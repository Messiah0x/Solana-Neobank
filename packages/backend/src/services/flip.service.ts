import { randomInt } from 'crypto';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { prisma } from '../lib/prisma';
import { connection, NETWORK } from '../lib/helius';
import { resolveDbUserId } from '../lib/user';

export type FlipCurrency = 'SOL' | 'USDC';

const USDC_MINT: Record<string, string> = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};
const USDC_DECIMALS = 6;

// Per-flip bet caps — keep individual exposure small relative to the
// house bankroll. Overridable per environment.
const MAX_BET = {
  SOL: Number(process.env.FLIP_MAX_BET_SOL ?? 1),
  USDC: Number(process.env.FLIP_MAX_BET_USDC ?? 100),
} as const;

// SOL the house always keeps back for payout transaction fees.
const HOUSE_SOL_FEE_RESERVE = 0.01;

function err(message: string, code: string) {
  return Object.assign(new Error(message), { code });
}

// The house wallet holds the bankroll: bets are paid into it, winnings are
// paid out of it. Loaded lazily so the rest of the API works without it.
let houseKeypair: Keypair | null | undefined;

function getHouseKeypair(): Keypair {
  if (houseKeypair === undefined) {
    const secret = process.env.HOUSE_WALLET_SECRET;
    if (!secret) {
      houseKeypair = null;
    } else {
      try {
        houseKeypair = Keypair.fromSecretKey(bs58.decode(secret.trim()));
      } catch {
        throw err('HOUSE_WALLET_SECRET is not a valid base58 secret key', 'FLIP_DISABLED');
      }
    }
  }
  if (!houseKeypair) {
    throw err('Coin flip is not configured on this server', 'FLIP_DISABLED');
  }
  return houseKeypair;
}

async function getUserPublicKey(dbUserId: string): Promise<PublicKey> {
  const wallet = await prisma.wallet.findUnique({ where: { userId: dbUserId } });
  if (!wallet) throw err('Wallet not found', 'NOT_FOUND');
  return new PublicKey(wallet.publicKey);
}

async function getHouseBalance(currency: FlipCurrency, housePk: PublicKey): Promise<number> {
  if (currency === 'SOL') {
    const lamports = await connection.getBalance(housePk);
    return Math.max(0, lamports / LAMPORTS_PER_SOL - HOUSE_SOL_FEE_RESERVE);
  }
  const mint = new PublicKey(USDC_MINT[NETWORK]);
  const ata = await getAssociatedTokenAddress(mint, housePk);
  try {
    const balance = await connection.getTokenAccountBalance(ata);
    return balance.value.uiAmount ?? 0;
  } catch {
    return 0;
  }
}

// Public house status: lets the client show availability and max bets
// before asking the user to sign anything.
export async function getHouseStatus() {
  const secret = process.env.HOUSE_WALLET_SECRET;
  if (!secret) return { enabled: false as const };
  const house = getHouseKeypair();
  const [sol, usdc] = await Promise.all([
    getHouseBalance('SOL', house.publicKey),
    getHouseBalance('USDC', house.publicKey),
  ]);
  return {
    enabled: true as const,
    housePublicKey: house.publicKey.toString(),
    // The house must cover the winnings (1x on top of the returned bet),
    // so the largest acceptable bet is min(cap, house balance).
    maxBet: {
      SOL: Math.min(MAX_BET.SOL, sol),
      USDC: Math.min(MAX_BET.USDC, usdc),
    },
  };
}

function assertBetAmount(currency: FlipCurrency, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw err('Amount must be positive', 'BAD_BET');
  if (amount > MAX_BET[currency]) {
    throw err(`Maximum bet is ${MAX_BET[currency]} ${currency}`, 'BAD_BET');
  }
}

// Builds the unsigned bet transaction: a plain transfer of the bet amount
// from the user's wallet to the house wallet, signed client-side.
export async function prepareBet(userId: string, currency: FlipCurrency, amount: number) {
  assertBetAmount(currency, amount);
  const house = getHouseKeypair();
  const dbUserId = await resolveDbUserId(userId);
  const userPk = await getUserPublicKey(dbUserId);

  const houseBalance = await getHouseBalance(currency, house.publicKey);
  if (amount > houseBalance) {
    throw err(
      `The house can only cover bets up to ${houseBalance.toFixed(4)} ${currency} right now`,
      'BAD_BET',
    );
  }

  const tx = new Transaction();
  if (currency === 'SOL') {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: userPk,
        toPubkey: house.publicKey,
        lamports: Math.round(amount * LAMPORTS_PER_SOL),
      }),
    );
  } else {
    const mint = new PublicKey(USDC_MINT[NETWORK]);
    const userAta = await getAssociatedTokenAddress(mint, userPk);
    const houseAta = await getAssociatedTokenAddress(mint, house.publicKey);
    tx.add(
      // No-op when the house ATA already exists; the user pays the rent
      // the first time, which is negligible on devnet.
      createAssociatedTokenAccountIdempotentInstruction(userPk, houseAta, house.publicKey, mint),
      createTransferInstruction(userAta, houseAta, userPk, Math.round(amount * 10 ** USDC_DECIMALS)),
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.feePayer = userPk;
  tx.recentBlockhash = blockhash;

  return {
    transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
    blockhash,
    lastValidBlockHeight,
    housePublicKey: house.publicKey.toString(),
  };
}

async function assertTxConfirmed(signature: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { value } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = value[0];
    if (status) {
      if (status.err) throw err('Bet transaction failed on-chain', 'BAD_BET');
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw err('Bet transaction not confirmed — try again', 'BAD_BET');
}

// Verifies on-chain that `signature` really moved `amount` of `currency`
// from the user's wallet into the house wallet. This is what stops a
// client from claiming a win with an arbitrary signature.
async function verifyBetOnChain(
  signature: string,
  userPk: PublicKey,
  housePk: PublicKey,
  currency: FlipCurrency,
  amount: number,
) {
  const parsed = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (!parsed?.meta || parsed.meta.err) throw err('Bet transaction not found on-chain', 'BAD_BET');

  const keys = parsed.transaction.message.accountKeys;
  const userIndex = keys.findIndex((k) => k.pubkey.equals(userPk));
  if (userIndex === -1 || !keys[userIndex].signer) {
    throw err('Bet was not signed by your wallet', 'BAD_BET');
  }

  // Tolerance for float → base-unit rounding.
  const epsilon = currency === 'SOL' ? 1 / LAMPORTS_PER_SOL : 1 / 10 ** USDC_DECIMALS;

  if (currency === 'SOL') {
    const houseIndex = keys.findIndex((k) => k.pubkey.equals(housePk));
    if (houseIndex === -1) throw err('Bet did not pay the house wallet', 'BAD_BET');
    const delta =
      ((parsed.meta.postBalances[houseIndex] ?? 0) - (parsed.meta.preBalances[houseIndex] ?? 0)) /
      LAMPORTS_PER_SOL;
    if (delta + epsilon < amount) throw err('Bet amount does not match the on-chain transfer', 'BAD_BET');
    return;
  }

  const houseOwner = housePk.toString();
  const pre = parsed.meta.preTokenBalances?.find((b) => b.owner === houseOwner);
  const post = parsed.meta.postTokenBalances?.find((b) => b.owner === houseOwner);
  const preAmount = pre?.uiTokenAmount.uiAmount ?? 0;
  const postAmount = post?.uiTokenAmount.uiAmount ?? 0;
  if (postAmount - preAmount + epsilon < amount) {
    throw err('Bet amount does not match the on-chain transfer', 'BAD_BET');
  }
}

// Pays 2x the bet (their stake back + equal winnings) from the house
// wallet to the winner.
async function payOut(userPk: PublicKey, currency: FlipCurrency, amount: number): Promise<string> {
  const house = getHouseKeypair();
  const payout = amount * 2;

  const tx = new Transaction();
  if (currency === 'SOL') {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: house.publicKey,
        toPubkey: userPk,
        lamports: Math.round(payout * LAMPORTS_PER_SOL),
      }),
    );
  } else {
    const mint = new PublicKey(USDC_MINT[NETWORK]);
    const houseAta = await getAssociatedTokenAddress(mint, house.publicKey);
    const userAta = await getAssociatedTokenAddress(mint, userPk);
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(house.publicKey, userAta, userPk, mint),
      createTransferInstruction(houseAta, userAta, house.publicKey, Math.round(payout * 10 ** USDC_DECIMALS)),
    );
  }

  return sendAndConfirmTransaction(connection, tx, [house], { commitment: 'confirmed' });
}

// Resolves a bet: verify the transfer landed, flip fairly, pay out on a
// win. Idempotent on betSignature — replaying returns the original result
// without flipping or paying again.
export async function resolveBet(
  userId: string,
  currency: FlipCurrency,
  amount: number,
  betSignature: string,
) {
  assertBetAmount(currency, amount);
  const house = getHouseKeypair();
  const dbUserId = await resolveDbUserId(userId);
  const userPk = await getUserPublicKey(dbUserId);

  await assertTxConfirmed(betSignature);
  await verifyBetOnChain(betSignature, userPk, house.publicKey, currency, amount);

  // Fair 50/50 flip with Node's CSPRNG, decided only after the bet is
  // irreversibly on-chain.
  const result: 'win' | 'lose' = randomInt(2) === 0 ? 'win' : 'lose';

  let flip;
  try {
    flip = await prisma.coinFlip.create({
      data: { userId: dbUserId, currency, amount, betSignature, result },
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') {
      // Replay of an already-resolved bet — return the recorded outcome.
      const existing = await prisma.coinFlip.findUnique({ where: { betSignature } });
      if (existing) {
        return {
          result: existing.result as 'win' | 'lose',
          payout: existing.result === 'win' ? existing.amount * 2 : 0,
          payoutSignature: existing.payoutSignature,
        };
      }
    }
    throw e;
  }

  if (result === 'lose') {
    return { result, payout: 0, payoutSignature: null };
  }

  try {
    const payoutSignature = await payOut(userPk, currency, amount);
    await prisma.coinFlip.update({ where: { id: flip.id }, data: { payoutSignature } });
    return { result, payout: amount * 2, payoutSignature };
  } catch (e) {
    // The win is recorded; flag the failed payout for retry/manual review
    // rather than losing track of what is owed.
    const message = e instanceof Error ? e.message : 'payout failed';
    await prisma.coinFlip.update({ where: { id: flip.id }, data: { payoutError: message } });
    throw err('You won, but the payout failed to send — contact support with your bet signature', 'PAYOUT_FAILED');
  }
}

export async function getFlipHistory(userId: string, limit = 25) {
  const dbUserId = await resolveDbUserId(userId);
  return prisma.coinFlip.findMany({
    where: { userId: dbUserId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      currency: true,
      amount: true,
      result: true,
      betSignature: true,
      payoutSignature: true,
      createdAt: true,
    },
  });
}
