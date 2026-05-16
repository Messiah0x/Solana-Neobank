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

const USDC_DECIMALS = 6;
const LAMPORTS = LAMPORTS_PER_SOL;

function enrichTransaction(
  publicKey: string,
  parsed: Awaited<ReturnType<typeof connection.getParsedTransactions>>[number],
): { type: 'sent' | 'received' | 'other'; amount: number | null; counterparty: string | null } {
  if (!parsed) return { type: 'other', amount: null, counterparty: null };

  const meta = parsed.meta;
  const message = parsed.transaction?.message;
  if (!meta || !message) return { type: 'other', amount: null, counterparty: null };

  // Collect ordered account keys (handles both legacy and versioned messages)
  const accountKeys: string[] = [];
  if ('accountKeys' in message) {
    for (const k of message.accountKeys) {
      if (typeof k === 'string') accountKeys.push(k);
      else if (k && typeof (k as { pubkey?: { toString(): string } }).pubkey?.toString === 'function')
        accountKeys.push((k as { pubkey: { toString(): string } }).pubkey.toString());
    }
  }

  const myIndex = accountKeys.indexOf(publicKey);

  // --- Try SPL token (USDC) first ---
  const pre = meta.preTokenBalances ?? [];
  const post = meta.postTokenBalances ?? [];

  // Find this wallet's token balance change
  const myPre = pre.find((b) => accountKeys[b.accountIndex] === publicKey || b.owner === publicKey);
  const myPost = post.find((b) => accountKeys[b.accountIndex] === publicKey || b.owner === publicKey);

  if (myPre || myPost) {
    const preAmt = Number(myPre?.uiTokenAmount?.uiAmount ?? myPre?.uiTokenAmount?.amount ?? 0) / (myPre ? 1 : 1);
    const postAmt = Number(myPost?.uiTokenAmount?.uiAmount ?? myPost?.uiTokenAmount?.amount ?? 0) / (myPost ? 1 : 1);
    // uiAmount is already decimal-adjusted when present
    const preVal = myPre?.uiTokenAmount?.uiAmount ?? (Number(myPre?.uiTokenAmount?.amount ?? 0) / 10 ** USDC_DECIMALS);
    const postVal = myPost?.uiTokenAmount?.uiAmount ?? (Number(myPost?.uiTokenAmount?.amount ?? 0) / 10 ** USDC_DECIMALS);
    const delta = postVal - preVal;

    if (Math.abs(delta) > 0) {
      const type = delta > 0 ? 'received' : 'sent';
      // Find counterparty: another account whose token balance moved in the opposite direction
      let counterparty: string | null = null;
      const others = delta > 0 ? pre : post;
      for (const b of others) {
        const addr = b.owner ?? accountKeys[b.accountIndex];
        if (addr && addr !== publicKey) { counterparty = addr; break; }
      }
      return { type, amount: Math.abs(delta), counterparty };
    }
  }

  // --- Fall back to SOL balance change ---
  if (myIndex !== -1 && meta.preBalances && meta.postBalances) {
    const preSol = meta.preBalances[myIndex] ?? 0;
    const postSol = meta.postBalances[myIndex] ?? 0;
    // Subtract fee if this wallet is the fee payer (index 0)
    const fee = myIndex === 0 ? (meta.fee ?? 0) : 0;
    const delta = (postSol - preSol + fee) / LAMPORTS;

    if (Math.abs(delta) > 0.000001) {
      const type = delta > 0 ? 'received' : 'sent';
      // Find counterparty: account with largest opposite movement
      let counterparty: string | null = null;
      let bestDelta = 0;
      for (let i = 0; i < accountKeys.length; i++) {
        if (i === myIndex) continue;
        const d = ((meta.postBalances[i] ?? 0) - (meta.preBalances[i] ?? 0)) / LAMPORTS;
        // Opposite sign means it's the other party
        if (type === 'sent' && d > bestDelta) { bestDelta = d; counterparty = accountKeys[i]; }
        if (type === 'received' && d < bestDelta) { bestDelta = d; counterparty = accountKeys[i]; }
      }
      return { type, amount: Math.abs(delta), counterparty };
    }
  }

  return { type: 'other', amount: null, counterparty: null };
}

export async function getRecentTransactions(publicKey: string, limit = 10) {
  const pubkey = new PublicKey(publicKey);
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

  if (signatures.length === 0) return [];

  const transactions = await connection.getParsedTransactions(
    signatures.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 },
  );

  return signatures.map((sig, i) => {
    const parsed = transactions[i] ?? null;
    const enriched = enrichTransaction(publicKey, parsed);
    return {
      signature: sig.signature,
      timestamp: sig.blockTime ? sig.blockTime * 1000 : null,
      status: sig.err ? 'failed' : ('success' as 'success' | 'failed'),
      slot: sig.slot,
      meta: parsed?.meta ?? null,
      type: enriched.type,
      amount: enriched.amount,
      counterparty: enriched.counterparty,
    };
  });
}
