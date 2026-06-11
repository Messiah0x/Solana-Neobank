'use client';

import { useSolanaWallets } from '@privy-io/react-auth';
import { Connection, Transaction } from '@solana/web3.js';
import {
  prepareDeposit,
  confirmDeposit,
  prepareWithdraw,
  confirmWithdraw,
  PreparedYieldTx,
} from './api';

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';

// Non-custodial yield actions: the backend prepares unsigned transactions,
// the user's Privy wallet signs them client-side, and the backend records the
// position only after on-chain confirmation.
export function useYieldActions(userId: string | null) {
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0] ?? null;

  async function signAndConfirm(prep: PreparedYieldTx): Promise<string> {
    if (!wallet) throw new Error('No wallet connected');
    const tx = Transaction.from(Buffer.from(prep.transaction, 'base64'));
    const connection = new Connection(RPC_URL, 'confirmed');
    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(
      { signature, blockhash: prep.blockhash, lastValidBlockHeight: prep.lastValidBlockHeight },
      'confirmed',
    );
    return signature;
  }

  async function deposit(amount: number) {
    if (!userId) throw new Error('Not signed in');
    // First-time depositors sign two transactions: marginfi account creation,
    // then the deposit itself.
    let prep = await prepareDeposit(userId, amount);
    if (prep.step === 'createAccount') {
      await signAndConfirm(prep);
      prep = await prepareDeposit(userId, amount);
      if (prep.step !== 'deposit') {
        throw new Error('Account setup is still confirming — try again shortly');
      }
    }
    const signature = await signAndConfirm(prep);
    await confirmDeposit(userId, amount, signature, prep.marginfiAccountPk);
    return signature;
  }

  async function withdraw(amount: number) {
    if (!userId) throw new Error('Not signed in');
    const prep = await prepareWithdraw(userId, amount);
    const signature = await signAndConfirm(prep);
    await confirmWithdraw(userId, amount, signature);
    return signature;
  }

  return { deposit, withdraw, hasWallet: !!wallet };
}
