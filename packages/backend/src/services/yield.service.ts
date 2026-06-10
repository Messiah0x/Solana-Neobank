import { Keypair, PublicKey } from '@solana/web3.js';
import { MarginfiAccountWrapper } from '@mrgnlabs/marginfi-client-v2';
import { prisma } from '../lib/prisma';
import { decryptPrivateKey } from '../lib/encryption';
import { createMarginfiClient } from '../lib/marginfi';
import { NETWORK } from '../lib/helius';
import { resolveDbUserId } from '../lib/user';

const USDC_MINT: Record<string, string> = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

const FALLBACK_APY = 8.4;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

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
      const apy = bank ? bank.computeInterestRates().lendingRate.toNumber() * 100 : FALLBACK_APY;
      const value = apy > 0 ? apy : FALLBACK_APY;
      apyCache = { value, fetchedAt: Date.now() };
      return value;
    } catch {
      const value = apyCache?.value ?? FALLBACK_APY;
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
