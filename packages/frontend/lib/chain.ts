'use client';

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// Client-side chain reads, used as a fallback when the backend is
// unreachable. Balances and history come straight from the RPC, so the core
// app keeps working even if our API is down.

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_DECIMALS = 6;

// Mainnet — used by the Portfolio page to read real-world wallet balances.
// The app's own banking flow runs on devnet (RPC_URL above), but
// wallets a user adds to track will hold real mainnet funds.
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://solana-rpc.publicnode.com';
const MAINNET_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

function getConnection() {
  return new Connection(RPC_URL, 'confirmed');
}

function getMainnetConnection() {
  return new Connection(MAINNET_RPC_URL, 'confirmed');
}

// Public RPC endpoints occasionally hang instead of erroring, which can leave
// the UI stuck on "Loading…" indefinitely. Bound every chain read so a slow
// endpoint surfaces as a failure within a few seconds.
const RPC_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms = RPC_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('RPC request timed out')), ms)),
  ]);
}

export async function fetchMainnetBalancesFromChain(publicKey: string): Promise<{
  publicKey: string;
  usdc: number;
  sol: number;
}> {
  const connection = getMainnetConnection();
  const owner = new PublicKey(publicKey);

  const [sol, usdc] = await Promise.all([
    withTimeout(connection.getBalance(owner)).then((l) => l / LAMPORTS_PER_SOL),
    (async () => {
      try {
        const ata = await withTimeout(getAssociatedTokenAddress(MAINNET_USDC_MINT, owner));
        const account = await withTimeout(getAccount(connection, ata));
        return Number(account.amount) / 10 ** USDC_DECIMALS;
      } catch {
        return 0; // no USDC account yet, or the lookup timed out
      }
    })(),
  ]);

  return { publicKey, usdc, sol };
}

export async function fetchBalancesFromChain(publicKey: string): Promise<{
  publicKey: string;
  usdc: number;
  sol: number;
}> {
  const connection = getConnection();
  const owner = new PublicKey(publicKey);

  const [sol, usdc] = await Promise.all([
    connection.getBalance(owner).then((l) => l / LAMPORTS_PER_SOL),
    (async () => {
      try {
        const ata = await getAssociatedTokenAddress(USDC_MINT, owner);
        const account = await getAccount(connection, ata);
        return Number(account.amount) / 10 ** USDC_DECIMALS;
      } catch {
        return 0; // no USDC account yet
      }
    })(),
  ]);

  return { publicKey, usdc, sol };
}

export interface ChainTransaction {
  signature: string;
  timestamp: number | null;
  status: 'success' | 'failed';
  slot: number;
  type: 'sent' | 'received' | 'other';
  amount: number | null;
  counterparty: string | null;
  token?: 'USDC' | 'SOL' | null;
}

export async function fetchTransactionsFromChain(
  publicKey: string,
  limit = 10,
): Promise<ChainTransaction[]> {
  const connection = getConnection();
  const pubkey = new PublicKey(publicKey);
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
  if (signatures.length === 0) return [];

  const parsedTxs = await connection.getParsedTransactions(
    signatures.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 },
  );

  return signatures.map((sig, i) => {
    const parsed = parsedTxs[i];
    let type: 'sent' | 'received' | 'other' = 'other';
    let amount: number | null = null;
    let counterparty: string | null = null;
    let token: 'USDC' | 'SOL' | null = null;

    const meta = parsed?.meta;
    if (meta) {
      const accountKeys = (parsed.transaction.message.accountKeys ?? []).map((k) =>
        typeof k === 'string' ? k : k.pubkey.toString(),
      );
      const myIndex = accountKeys.indexOf(publicKey);

      // SPL token (USDC) delta first
      const pre = meta.preTokenBalances ?? [];
      const post = meta.postTokenBalances ?? [];
      const myPre = pre.find((b) => b.owner === publicKey || accountKeys[b.accountIndex] === publicKey);
      const myPost = post.find((b) => b.owner === publicKey || accountKeys[b.accountIndex] === publicKey);
      if (myPre || myPost) {
        const preVal = myPre?.uiTokenAmount?.uiAmount ?? 0;
        const postVal = myPost?.uiTokenAmount?.uiAmount ?? 0;
        const delta = postVal - preVal;
        if (Math.abs(delta) > 0) {
          type = delta > 0 ? 'received' : 'sent';
          amount = Math.abs(delta);
          token = 'USDC';
          const others = delta > 0 ? pre : post;
          for (const b of others) {
            const addr = b.owner ?? accountKeys[b.accountIndex];
            if (addr && addr !== publicKey) { counterparty = addr; break; }
          }
        }
      }

      // SOL delta fallback
      if (amount === null && myIndex !== -1 && meta.preBalances && meta.postBalances) {
        const fee = myIndex === 0 ? (meta.fee ?? 0) : 0;
        const delta = ((meta.postBalances[myIndex] ?? 0) - (meta.preBalances[myIndex] ?? 0) + fee) / LAMPORTS_PER_SOL;
        if (Math.abs(delta) > 0.000001) {
          type = delta > 0 ? 'received' : 'sent';
          amount = Math.abs(delta);
          token = 'SOL';
        }
      }
    }

    return {
      signature: sig.signature,
      timestamp: sig.blockTime ? sig.blockTime * 1000 : null,
      status: sig.err ? ('failed' as const) : ('success' as const),
      slot: sig.slot,
      type,
      amount,
      counterparty,
      token,
    };
  });
}
