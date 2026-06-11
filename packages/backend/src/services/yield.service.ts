import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { MarginfiAccountWrapper } from '@mrgnlabs/marginfi-client-v2';
import { prisma } from '../lib/prisma';
import { decryptPrivateKey } from '../lib/encryption';
import { createMarginfiClient, createMarginfiClientForPubkey } from '../lib/marginfi';
import { connection, NETWORK } from '../lib/helius';
import { resolveDbUserId } from '../lib/user';

const USDC_MINT: Record<string, string> = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

const FALLBACK_APY = 8.4;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
// Avanor's revenue model: a performance fee on yield earned (never principal).
// The APY and earnings surfaced to users are always net of this fee.
const PERFORMANCE_FEE = 0.10;

async function getUserKeypair(dbUserId: string): Promise<Keypair> {
  const wallet = await prisma.wallet.findUnique({ where: { userId: dbUserId } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { code: 'NOT_FOUND' });
  if (!wallet.encryptedKey || !wallet.keyIv || !wallet.keyTag) {
    throw Object.assign(
      new Error('Wallet managed by Privy — client-side signing required'),
      { code: 'CLIENT_SIGN_REQUIRED' },
    );
  }
  const secretKey = decryptPrivateKey(wallet.encryptedKey, wallet.keyIv, wallet.keyTag);
  return Keypair.fromSecretKey(secretKey);
}

const APY_CACHE_TTL_MS = 5 * 60 * 1000;
let apyCache: { value: number; fetchedAt: number } | null = null;
let apyCacheInflight: Promise<number> | null = null;

export async function getCurrentApy(): Promise<number> {
  if (apyCache && Date.now() - apyCache.fetchedAt < APY_CACHE_TTL_MS) {
    return apyCache.value;
  }
  if (apyCacheInflight) return apyCacheInflight;

  apyCacheInflight = (async () => {
    try {
      const dummy = Keypair.generate();
      const client = await createMarginfiClient(dummy);
      const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
      const bank = client.getBankByMint(usdcMint);
      const grossApy = bank ? bank.computeInterestRates().lendingRate.toNumber() * 100 : FALLBACK_APY;
      const apy = (grossApy > 0 ? grossApy : FALLBACK_APY) * (1 - PERFORMANCE_FEE);
      const value = apy;
      apyCache = { value, fetchedAt: Date.now() };
      return value;
    } catch {
      const value = apyCache?.value ?? FALLBACK_APY * (1 - PERFORMANCE_FEE);
      apyCache = { value, fetchedAt: Date.now() };
      return value;
    } finally {
      apyCacheInflight = null;
    }
  })();

  return apyCacheInflight;
}

export async function deposit(userId: string, amountUsdc: number) {
  if (amountUsdc <= 0) throw new Error('Amount must be positive');

  const dbUserId = await resolveDbUserId(userId);
  const keypair = await getUserKeypair(dbUserId);
  const client = await createMarginfiClient(keypair);

  const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
  const bank = client.getBankByMint(usdcMint);
  if (!bank) throw new Error('USDC bank not found on Marginfi');

  const accounts = await client.getMarginfiAccountsForAuthority(keypair.publicKey);
  const marginfiAccount = accounts[0] ?? (await client.createMarginfiAccount());

  const signature = await marginfiAccount.deposit(amountUsdc, bank.address);

  await prisma.yieldPosition.upsert({
    where: { userId: dbUserId },
    create: {
      userId: dbUserId,
      depositAmount: amountUsdc,
      depositedAt: new Date(),
      protocol: 'marginfi',
      marginfiAccountPk: marginfiAccount.address.toString(),
    },
    update: {
      depositAmount: { increment: amountUsdc },
      marginfiAccountPk: marginfiAccount.address.toString(),
    },
  });

  return { signature, marginfiAccount: marginfiAccount.address.toString() };
}

export async function withdraw(userId: string, amountUsdc: number) {
  const dbUserId = await resolveDbUserId(userId);
  const position = await prisma.yieldPosition.findUnique({ where: { userId: dbUserId } });
  if (!position?.marginfiAccountPk)
    throw Object.assign(new Error('No yield position found'), { code: 'NOT_FOUND' });

  const keypair = await getUserKeypair(dbUserId);
  const client = await createMarginfiClient(keypair);

  const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
  const bank = client.getBankByMint(usdcMint);
  if (!bank) throw new Error('USDC bank not found');

  const marginfiAccount = await MarginfiAccountWrapper.fetch(
    new PublicKey(position.marginfiAccountPk),
    client,
  );
  const signature = await marginfiAccount.withdraw(amountUsdc, bank.address);

  await prisma.yieldPosition.update({
    where: { userId: dbUserId },
    data: { depositAmount: Math.max(0, position.depositAmount - amountUsdc) },
  });

  return { signature };
}

async function getUserPublicKey(dbUserId: string): Promise<PublicKey> {
  const wallet = await prisma.wallet.findUnique({ where: { userId: dbUserId } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { code: 'NOT_FOUND' });
  return new PublicKey(wallet.publicKey);
}

async function buildUnsignedTx(
  instructions: TransactionInstruction[],
  feePayer: PublicKey,
  partialSigners: Keypair[] = [],
) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer, blockhash, lastValidBlockHeight });
  tx.add(...instructions);
  if (partialSigners.length > 0) tx.partialSign(...partialSigners);
  return {
    transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
    blockhash,
    lastValidBlockHeight,
  };
}

// Non-custodial deposit flow for Privy wallets: the backend builds the
// transaction, the user's wallet signs it client-side. First-time users get
// a marginfi-account-creation step before the deposit step.
export async function prepareDeposit(userId: string, amountUsdc: number) {
  if (amountUsdc <= 0) throw new Error('Amount must be positive');
  const dbUserId = await resolveDbUserId(userId);
  const userPk = await getUserPublicKey(dbUserId);
  const client = await createMarginfiClientForPubkey(userPk);

  const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
  const bank = client.getBankByMint(usdcMint);
  if (!bank) throw new Error('USDC bank not found on Marginfi');

  const accounts = await client.getMarginfiAccountsForAuthority(userPk);
  if (accounts.length === 0) {
    // Step 1: create the marginfi account. The new account's keypair is a
    // throwaway signer we partial-sign here; the user signs as fee payer.
    const accountKeypair = Keypair.generate();
    const ixs = await client.makeCreateMarginfiAccountIx(accountKeypair.publicKey);
    const built = await buildUnsignedTx(ixs.instructions, userPk, [accountKeypair]);
    return { step: 'createAccount' as const, marginfiAccountPk: accountKeypair.publicKey.toString(), ...built };
  }

  const marginfiAccount = accounts[0];
  const ixs = await marginfiAccount.makeDepositIx(amountUsdc, bank.address);
  const built = await buildUnsignedTx(ixs.instructions, userPk);
  return { step: 'deposit' as const, marginfiAccountPk: marginfiAccount.address.toString(), ...built };
}

export async function prepareWithdraw(userId: string, amountUsdc: number) {
  if (amountUsdc <= 0) throw new Error('Amount must be positive');
  const dbUserId = await resolveDbUserId(userId);
  const position = await prisma.yieldPosition.findUnique({ where: { userId: dbUserId } });
  if (!position?.marginfiAccountPk)
    throw Object.assign(new Error('No yield position found'), { code: 'NOT_FOUND' });

  const userPk = await getUserPublicKey(dbUserId);
  const client = await createMarginfiClientForPubkey(userPk);

  const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
  const bank = client.getBankByMint(usdcMint);
  if (!bank) throw new Error('USDC bank not found');

  const marginfiAccount = await MarginfiAccountWrapper.fetch(
    new PublicKey(position.marginfiAccountPk),
    client,
  );
  const ixs = await marginfiAccount.makeWithdrawIx(amountUsdc, bank.address);
  const built = await buildUnsignedTx(ixs.instructions, userPk);
  return { step: 'withdraw' as const, marginfiAccountPk: position.marginfiAccountPk, ...built };
}

async function assertTxConfirmed(signature: string) {
  // Poll briefly — the client already waited for confirmation, this is a
  // server-side double-check before we trust the result.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { value } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = value[0];
    if (status) {
      if (status.err) throw new Error('Transaction failed on-chain');
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Transaction not confirmed — try again');
}

export async function confirmDeposit(
  userId: string,
  amountUsdc: number,
  signature: string,
  marginfiAccountPk: string,
) {
  if (amountUsdc <= 0) throw new Error('Amount must be positive');
  const dbUserId = await resolveDbUserId(userId);
  await assertTxConfirmed(signature);

  await prisma.yieldPosition.upsert({
    where: { userId: dbUserId },
    create: {
      userId: dbUserId,
      depositAmount: amountUsdc,
      depositedAt: new Date(),
      protocol: 'marginfi',
      marginfiAccountPk,
    },
    update: {
      depositAmount: { increment: amountUsdc },
      marginfiAccountPk,
    },
  });
  return { signature };
}

export async function confirmWithdraw(userId: string, amountUsdc: number, signature: string) {
  if (amountUsdc <= 0) throw new Error('Amount must be positive');
  const dbUserId = await resolveDbUserId(userId);
  const position = await prisma.yieldPosition.findUnique({ where: { userId: dbUserId } });
  if (!position) throw Object.assign(new Error('No yield position found'), { code: 'NOT_FOUND' });
  await assertTxConfirmed(signature);

  await prisma.yieldPosition.update({
    where: { userId: dbUserId },
    data: { depositAmount: Math.max(0, position.depositAmount - amountUsdc) },
  });
  return { signature };
}

export async function getYieldData(userId: string) {
  const dbUserId = await resolveDbUserId(userId);
  const [position, apy] = await Promise.all([
    prisma.yieldPosition.findUnique({ where: { userId: dbUserId } }),
    getCurrentApy(),
  ]);

  if (!position || position.depositAmount <= 0) {
    return { hasPosition: false, apy, depositedAmount: 0, earnedYield: 0, depositedAt: null };
  }

  const elapsedSeconds = (Date.now() - position.depositedAt.getTime()) / 1000;
  const earnedYield = position.depositAmount * (apy / 100) * (elapsedSeconds / SECONDS_PER_YEAR);

  return {
    hasPosition: true,
    apy,
    depositedAmount: position.depositAmount,
    earnedYield: Math.max(0, earnedYield),
    depositedAt: position.depositedAt.toISOString(),
    protocol: position.protocol,
  };
}
