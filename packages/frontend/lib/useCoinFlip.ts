'use client';

import { useSolanaWallets } from '@privy-io/react-auth';
import { Connection, Transaction } from '@solana/web3.js';
import { prepareFlip, resolveFlip, type FlipCurrency, type FlipResult } from './api';

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';

// Real-money Double or Nothing: the backend builds the bet transfer to the
// house wallet, the user's Privy wallet signs it client-side, and the
// backend flips only after verifying the transfer landed on-chain.
export function useCoinFlip(userId: string | null) {
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0] ?? null;

  async function flip(currency: FlipCurrency, amount: number): Promise<FlipResult> {
    if (!userId) throw new Error('Not signed in');
    if (!wallet) throw new Error('No wallet connected');

    const prep = await prepareFlip(userId, currency, amount);
    const tx = Transaction.from(Buffer.from(prep.transaction, 'base64'));
    const connection = new Connection(RPC_URL, 'confirmed');
    const betSignature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(
      { signature: betSignature, blockhash: prep.blockhash, lastValidBlockHeight: prep.lastValidBlockHeight },
      'confirmed',
    );
    return resolveFlip(userId, currency, amount, betSignature);
  }

  return { flip, hasWallet: !!wallet };
}
