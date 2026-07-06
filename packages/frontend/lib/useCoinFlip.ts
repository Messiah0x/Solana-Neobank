'use client';

import { useSolanaWallets } from '@privy-io/react-auth';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  decodeTransferInstruction,
} from '@solana/spl-token';
import { prepareFlip, resolveFlip, type FlipCurrency, type FlipResult } from './api';

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';
const USDC_DECIMALS = 6;

// Never blind-sign a transaction the backend handed us. Before the wallet
// signs, decode every instruction and prove the transaction does *only* what
// a bet is supposed to do: move at most `amount` from this user to the house
// and nothing else. This defends against a compromised/MITM'd backend
// returning a wallet-draining transfer, an Approve/SetAuthority, or a call
// into an arbitrary program.
function assertBetTxSafe(
  tx: Transaction,
  userPk: PublicKey,
  housePk: PublicKey,
  currency: FlipCurrency,
  amount: number,
) {
  if (tx.feePayer && !tx.feePayer.equals(userPk)) {
    throw new Error('Refused to sign: unexpected fee payer on bet transaction');
  }

  if (currency === 'SOL') {
    const maxLamports = Math.round(amount * LAMPORTS_PER_SOL);
    if (tx.instructions.length !== 1) {
      throw new Error('Refused to sign: unexpected instructions on bet transaction');
    }
    const ix = tx.instructions[0];
    if (!ix.programId.equals(SystemProgram.programId)) {
      throw new Error('Refused to sign: bet transaction calls an unexpected program');
    }
    let decoded;
    try {
      decoded = SystemInstruction.decodeTransfer(ix);
    } catch {
      throw new Error('Refused to sign: bet transaction is not a simple transfer');
    }
    if (!decoded.fromPubkey.equals(userPk)) throw new Error('Refused to sign: funds would leave a wallet that is not yours');
    if (!decoded.toPubkey.equals(housePk)) throw new Error('Refused to sign: bet would not be paid to the house');
    if (Number(decoded.lamports) > maxLamports + 1) {
      throw new Error('Refused to sign: bet would move more than your stake');
    }
    return;
  }

  // USDC: the backend builds [idempotent create house ATA, SPL transfer].
  const maxBaseUnits = Math.round(amount * 10 ** USDC_DECIMALS);
  let transfers = 0;
  for (const ix of tx.instructions) {
    if (ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) continue; // create-ATA, harmless
    if (!ix.programId.equals(TOKEN_PROGRAM_ID)) {
      throw new Error('Refused to sign: bet transaction calls an unexpected program');
    }
    // Only a plain SPL Transfer is acceptable — Approve/SetAuthority/etc. will
    // fail to decode here and be rejected.
    let decoded;
    try {
      decoded = decodeTransferInstruction(ix);
    } catch {
      throw new Error('Refused to sign: bet transaction contains a non-transfer token instruction');
    }
    if (!decoded.keys.owner.pubkey.equals(userPk)) {
      throw new Error('Refused to sign: token transfer is not authorized by your wallet');
    }
    if (Number(decoded.data.amount) > maxBaseUnits + 1) {
      throw new Error('Refused to sign: bet would move more than your stake');
    }
    transfers += 1;
  }
  if (transfers !== 1) {
    throw new Error('Refused to sign: unexpected token transfers on bet transaction');
  }
}

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
    // Verify what we're about to sign before the wallet ever sees it.
    assertBetTxSafe(tx, new PublicKey(wallet.address), new PublicKey(prep.housePublicKey), currency, amount);
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
