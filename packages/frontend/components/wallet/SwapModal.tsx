'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolanaWallets } from '@privy-io/react-auth';
import { Connection, VersionedTransaction } from '@solana/web3.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const JUPITER_QUOTE_URL = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_URL = 'https://quote-api.jup.ag/v6/swap';
const SLIPPAGE_BPS = 50;
const FEE_RESERVE_SOL = 0.01;

const RPC_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HELIUS_RPC) ||
  'https://api.devnet.solana.com';

interface QuoteResult {
  outAmount: string;
  priceImpactPct: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any;
}

interface Props {
  solBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type Phase = 'idle' | 'quoting' | 'swapping' | 'success' | 'error';

export function SwapModal({ solBalance, onClose, onSuccess }: Props) {
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0] ?? null;

  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [txSig, setTxSig] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [swappedSol, setSwappedSol] = useState<number>(0);
  const [swappedUsdc, setSwappedUsdc] = useState<number>(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxSol = Math.max(0, solBalance - FEE_RESERVE_SOL);
  const amountNum = parseFloat(amount);
  const amountInvalid =
    amount.length > 0 && (isNaN(amountNum) || amountNum <= 0 || amountNum > maxSol);

  const fetchQuote = useCallback(async (solAmount: number) => {
    setQuote(null);
    setQuoteError(null);
    if (isNaN(solAmount) || solAmount <= 0) return;

    const lamports = Math.round(solAmount * 1e9);
    try {
      const url = `${JUPITER_QUOTE_URL}?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${lamports}&slippageBps=${SLIPPAGE_BPS}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error || data.errorCode) {
        const msg =
          data.error ?? data.message ?? 'Swap unavailable on devnet — try mainnet';
        setQuoteError(msg.includes('could not find') || msg.includes('route')
          ? 'Swap unavailable on devnet — try mainnet'
          : msg);
        return;
      }

      setQuote({
        outAmount: data.outAmount,
        priceImpactPct: data.priceImpactPct ?? '0',
        raw: data,
      });
    } catch {
      setQuoteError('Swap unavailable on devnet — try mainnet');
    }
  }, []);

  // Debounced quote fetch as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0 || num > maxSol) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchQuote(num);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, maxSol, fetchQuote]);

  function handleMax() {
    setAmount(maxSol > 0 ? maxSol.toFixed(4).replace(/\.?0+$/, '') : '0');
  }

  async function handleSwap() {
    if (!wallet || !quote || amountInvalid || !amount) return;
    setPhase('swapping');
    setErrorMsg(null);

    try {
      // Refresh quote right before swap
      const lamports = Math.round(amountNum * 1e9);
      const quoteUrl = `${JUPITER_QUOTE_URL}?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${lamports}&slippageBps=${SLIPPAGE_BPS}`;
      const quoteRes = await fetch(quoteUrl);
      const quoteData = await quoteRes.json();

      if (!quoteRes.ok || quoteData.error || quoteData.errorCode) {
        throw new Error('Swap unavailable on devnet — try mainnet');
      }

      // Get swap transaction
      const swapRes = await fetch(JUPITER_SWAP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: wallet.address,
          wrapAndUnwrapSol: true,
        }),
      });
      const swapData = await swapRes.json();

      if (!swapRes.ok || swapData.error || !swapData.swapTransaction) {
        throw new Error(swapData.error ?? 'Failed to build swap transaction');
      }

      // Deserialize versioned transaction
      const txBytes = Buffer.from(swapData.swapTransaction, 'base64');
      const versionedTx = VersionedTransaction.deserialize(txBytes);

      const connection = new Connection(RPC_URL, 'confirmed');
      const sig = await wallet.sendTransaction(versionedTx, connection);

      const usdcOut = parseInt(quoteData.outAmount, 10) / 1e6;
      setSwappedSol(amountNum);
      setSwappedUsdc(usdcOut);
      setTxSig(sig);
      setPhase('success');
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swap failed';
      setErrorMsg(
        msg.includes('devnet') || msg.includes('route') || msg.includes('liquidity')
          ? 'Swap unavailable on devnet — try mainnet'
          : msg,
      );
      setPhase('error');
    }
  }

  function handleReset() {
    setPhase('idle');
    setErrorMsg(null);
    setAmount('');
    setQuote(null);
    setQuoteError(null);
    setTxSig(null);
  }

  const usdcOut = quote ? parseInt(quote.outAmount, 10) / 1e6 : null;
  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : null;
  const exchangeRate = usdcOut && amountNum > 0 ? usdcOut / amountNum : null;

  const canSwap =
    phase === 'idle' &&
    !!wallet &&
    !!quote &&
    !amountInvalid &&
    amountNum > 0 &&
    !quoteError;

  const explorerUrl = txSig
    ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl p-6"
          style={{
            background: 'linear-gradient(145deg, #161310 0%, #0F0D0A 100%)',
            border: '1px solid rgba(212,175,127,0.12)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
                Solana · Devnet
              </p>
              <h3 className="text-lg font-bold text-ivory mt-0.5">Swap SOL → USDC</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.07] flex items-center justify-center hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white/70"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Success state */}
            {phase === 'success' && txSig ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-base font-bold text-white mb-1">Swap Complete!</p>
                <p className="text-sm text-white/40 mb-5">
                  {swappedSol} SOL swapped for{' '}
                  {swappedUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </p>

                <div
                  className="rounded-2xl p-4 mb-4 text-left"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">
                    Transaction
                  </p>
                  <p className="font-mono text-xs text-white/50 break-all">{txSig}</p>
                </div>

                <a
                  href={explorerUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3.5 rounded-xl font-bold text-sm text-center mb-3 transition-all bg-accent hover:bg-accent/90 text-white"
                >
                  View on Explorer
                </a>
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Swap again
                </button>
              </motion.div>
            ) : phase === 'error' ? (
              /* Error state */
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-white mb-1">Swap Failed</p>
                <p className="text-sm text-white/40 mb-5 break-words">{errorMsg}</p>
                <button
                  onClick={handleReset}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.10] transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              /* Form state */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Available SOL balance */}
                <div
                  className="rounded-2xl p-3 mb-4 flex items-center justify-between"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/25">
                    Available SOL
                  </span>
                  <span className="text-sm font-semibold text-white/60">
                    {solBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL
                  </span>
                </div>

                {/* SOL input */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5 block">
                    You Pay (SOL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.0000"
                      min="0"
                      max={maxSol}
                      step="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={phase === 'swapping'}
                      className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-white/80 placeholder:text-white/20 bg-white/[0.04] border outline-none transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        amountInvalid
                          ? 'border-error/40 focus:border-error/70'
                          : 'border-white/[0.08] focus:border-accent/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleMax}
                      disabled={phase === 'swapping' || maxSol <= 0}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Max
                    </button>
                  </div>
                  {amountInvalid && (
                    <p className="text-[11px] text-error mt-1.5">
                      {amountNum > maxSol
                        ? `Max swappable: ${maxSol.toFixed(4)} SOL (reserve 0.01 for fees)`
                        : 'Enter a valid amount'}
                    </p>
                  )}
                </div>

                {/* Quote output */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5 block">
                    You Receive (USDC)
                  </label>
                  <div
                    className="rounded-xl px-4 py-3 flex items-center justify-between min-h-[44px]"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {phase === 'swapping' || (amount && parseFloat(amount) > 0 && !quote && !quoteError) ? (
                      <span className="flex items-center gap-2 text-white/30 text-sm">
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin inline-block" />
                        Fetching quote…
                      </span>
                    ) : quoteError ? (
                      <span className="text-error/70 text-xs">{quoteError}</span>
                    ) : usdcOut != null ? (
                      <span className="text-white/80 text-sm font-semibold">
                        {usdcOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDC
                      </span>
                    ) : (
                      <span className="text-white/20 text-sm">—</span>
                    )}
                  </div>

                  {/* Exchange rate + price impact */}
                  {quote && exchangeRate && !quoteError && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center justify-between text-[11px] text-white/30 px-1"
                    >
                      <span>
                        1 SOL ≈ {exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                      {priceImpact !== null && (
                        <span className={priceImpact > 1 ? 'text-warning' : ''}>
                          Impact: {priceImpact < 0.01 ? '<0.01' : priceImpact.toFixed(2)}%
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Swap button */}
                <motion.button
                  whileTap={canSwap ? { scale: 0.97 } : undefined}
                  onClick={handleSwap}
                  disabled={!canSwap}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    canSwap
                      ? 'bg-accent hover:bg-accent/90 text-white cursor-pointer'
                      : 'bg-white/[0.06] border border-white/[0.08] text-white/25 cursor-not-allowed'
                  }`}
                >
                  {phase === 'swapping' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Swapping…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
                      </svg>
                      Swap SOL → USDC
                    </>
                  )}
                </motion.button>

                {!wallet && (
                  <p className="text-center text-[11px] text-white/20 mt-3">
                    No wallet connected
                  </p>
                )}

                <p className="text-center text-[10px] text-white/20 mt-3">
                  Powered by Jupiter · 0.5% slippage
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
