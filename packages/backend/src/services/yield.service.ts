import { Keypair, PublicKey } from '@solana/web3.js';
import { MarginfiAccountWrapper } from '@mrgnlabs/marginfi-client-v2';
import { prisma } from '../lib/prisma';
import { decryptPrivateKey } from '../lib/encryption';
import { createMarginfiClient } from '../lib/marginfi';
import { NETWORK } from '../lib/helius';

const USDC_MINT: Record<string, string> = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

const FALLBACK_APY = 8.4;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

async function getUserKeypair(userId: string): Promise<Keypair> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { code: 'NOT_FOUND' });
  const secretKey = decryptPrivateKey(wallet.encryptedKey, wallet.keyIv, wallet.keyTag);
  return Keypair.fromSecretKey(secretKey);
}

export async function getCurrentApy(): Promise<number> {
  try {
    const dummy = Keypair.generate();
    const client = await createMarginfiClient(dummy);
    const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
    const bank = client.getBankByMint(usdcMint);
    if (!bank) return FALLBACK_APY;
    const { lendingRate } = bank.computeInterestRates();
    const apy = lendingRate.toNumber() * 100;
    return apy > 0 ? apy : FALLBACK_APY;
  } catch {
    return FALLBACK_APY;
  }
}

export async function deposit(userId: string, amountUsdc: number) {
  if (amountUsdc <= 0) throw new Error('Amount must be positive');

  const keypair = await getUserKeypair(userId);
  const client = await createMarginfiClient(keypair);

  const usdcMint = new PublicKey(USDC_MINT[NETWORK]);
  const bank = client.getBankByMint(usdcMint);
  if (!bank) throw new Error('USDC bank not found on Marginfi');

  const accounts = await client.getMarginfiAccountsForAuthority(keypair.publicKey);
  const marginfiAccount = accounts[0] ?? (await client.createMarginfiAccount());

  const signature = await marginfiAccount.deposit(amountUsdc, bank.address);

  await prisma.yieldPosition.upsert({
    where: { userId },
    create: {
      userId,
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
  const position = await prisma.yieldPosition.findUnique({ where: { userId } });
  if (!position?.marginfiAccountPk)
    throw Object.assign(new Error('No yield position found'), { code: 'NOT_FOUND' });

  const keypair = await getUserKeypair(userId);
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
    where: { userId },
    data: { depositAmount: Math.max(0, position.depositAmount - amountUsdc) },
  });

  return { signature };
}

export async function getYieldData(userId: string) {
  const [position, apy] = await Promise.all([
    prisma.yieldPosition.findUnique({ where: { userId } }),
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
