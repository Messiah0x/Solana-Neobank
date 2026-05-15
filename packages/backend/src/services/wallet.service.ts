import { prisma } from '../lib/prisma';
import { encryptPrivateKey } from '../lib/encryption';
import { generateKeypair, getUsdcBalance, getSolBalance, getRecentTransactions } from './solana.service';
import { resolveDbUserId } from '../lib/user';

export async function createWallet(userId: string) {
  const dbUserId = await resolveDbUserId(userId);
  const existing = await prisma.wallet.findUnique({ where: { userId: dbUserId } });
  if (existing) {
    throw Object.assign(new Error('Wallet already exists for this user'), { code: 'WALLET_EXISTS' });
  }

  const keypair = generateKeypair();
  const { encrypted, iv, tag } = encryptPrivateKey(keypair.secretKey);

  const wallet = await prisma.wallet.create({
    data: {
      userId: dbUserId,
      publicKey: keypair.publicKey.toString(),
      encryptedKey: encrypted,
      keyIv: iv,
      keyTag: tag,
    },
    select: { id: true, publicKey: true, createdAt: true },
  });

  return wallet;
}

export async function getWallet(userId: string) {
  const dbUserId = await resolveDbUserId(userId);
  const wallet = await prisma.wallet.findUnique({
    where: { userId: dbUserId },
    select: { id: true, publicKey: true, createdAt: true },
  });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { code: 'NOT_FOUND' });
  return wallet;
}

export async function getWalletBalance(userId: string) {
  const dbUserId = await resolveDbUserId(userId);
  const wallet = await prisma.wallet.findUnique({
    where: { userId: dbUserId },
    select: { publicKey: true },
  });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { code: 'NOT_FOUND' });

  const [usdc, sol] = await Promise.all([
    getUsdcBalance(wallet.publicKey),
    getSolBalance(wallet.publicKey),
  ]);

  return { publicKey: wallet.publicKey, usdc, sol };
}

export async function getWalletTransactions(userId: string, limit = 10) {
  const dbUserId = await resolveDbUserId(userId);
  const wallet = await prisma.wallet.findUnique({
    where: { userId: dbUserId },
    select: { publicKey: true },
  });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { code: 'NOT_FOUND' });

  return getRecentTransactions(wallet.publicKey, limit);
}
