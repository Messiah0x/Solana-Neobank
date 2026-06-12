import { useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export type AirdropState = 'idle' | 'loading' | 'success' | 'error';

interface Options {
  /** Called after a successful airdrop (e.g. to refresh balances). */
  onSuccess?: () => void;
  /** How long the success/error state is shown before resetting to idle. */
  successTimeoutMs?: number;
  errorTimeoutMs?: number;
}

export function useAirdrop(publicKey: string, options: Options = {}) {
  const { onSuccess, successTimeoutMs = 3000, errorTimeoutMs = 6000 } = options;
  const [solState, setSolState] = useState<AirdropState>('idle');
  const [usdcState, setUsdcState] = useState<AirdropState>('idle');

  async function requestSol() {
    if (!publicKey || solState === 'loading') return;
    setSolState('loading');
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com',
        'confirmed',
      );
      const pubkey = new PublicKey(publicKey);
      const sig = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
      setSolState('success');
      onSuccess?.();
      setTimeout(() => setSolState('idle'), successTimeoutMs);
    } catch (err) {
      console.error('[airdrop]', err);
      setSolState('error');
      setTimeout(() => setSolState('idle'), errorTimeoutMs);
    }
  }

  async function requestUsdc() {
    if (!publicKey || usdcState === 'loading') return;
    setUsdcState('loading');
    try {
      const res = await fetch('/api/faucet/usdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: publicKey }),
      });
      if (!res.ok) throw new Error(`Faucet returned ${res.status}`);
      setUsdcState('success');
      onSuccess?.();
      setTimeout(() => setUsdcState('idle'), successTimeoutMs);
    } catch (err) {
      console.error('[usdc faucet]', err);
      setUsdcState('error');
      setTimeout(() => setUsdcState('idle'), errorTimeoutMs);
    }
  }

  return { solState, usdcState, requestSol, requestUsdc };
}
