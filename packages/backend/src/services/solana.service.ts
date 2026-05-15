import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { connection, NETWORK } from '../lib/helius';

// USDC mint addresses per network
const USDC_MINT: Record<string, PublicKey> = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  devnet: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
};

export function generateKeypair(): Keypair {
  return Keypair.generate();
}

export async function getUsdcBalance(publicKey: string): Promise<number> {
  const mint = USDC_MINT[NETWORK];
  if (!mint) throw new Error(`No USDC mint for network: ${NETWORK}`);

  try {
    const pubkey = new PublicKey(publicKey);
    const ata = await getAssociatedTokenAddress(mint, pubkey);
    const account = await getAccount(connection, ata);
    // USDC has 6 decimals
    return Number(account.amount) / 1_000_000;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === 'TokenAccountNotFoundError' ||
        err.message.includes('could not find account'))
    ) {
      return 0;
    }
    throw err;
  }
}

export async function getSolBalance(publicKey: string): Promise<number> {
  const lamports = await connection.getBalance(new PublicKey(publicKey));
  return lamports / LAMPORTS_PER_SOL;
}

export async function getRecentTransactions(publicKey: string, limit = 10) {
  const pubkey = new PublicKey(publicKey);
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

  if (signatures.length === 0) return [];

  const transactions = await connection.getParsedTransactions(
    signatures.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 },
  );

  return signatures.map((sig, i) => ({
    signature: sig.signature,
    timestamp: sig.blockTime ? sig.blockTime * 1000 : null,
    status: sig.err ? 'failed' : 'success',
    slot: sig.slot,
    meta: transactions[i]?.meta ?? null,
  }));
}
