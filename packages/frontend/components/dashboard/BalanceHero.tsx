'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSolPrice } from '@/lib/useSolPrice';

interface Props {
  usdc: number;
  sol: number;
  apy: number;
  hasYield: boolean;
  isLoading: boolean;
  publicKey: string;
  onAirdrop?: () => void;
  onRefresh?: () => void;
}

type AirdropState = 'idle' | 'loading' | 'success' | 'error';

export function BalanceHero({ usdc, sol, apy, hasYield, isLoading, publicKey, onAirdrop, onRefresh }: Props) {
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [airdropState, setAirdropState] = useState<AirdropState>('idle');
  const [usdcAirdropState, setUsdcAirdropState] = useState<AirdropState>('idle');
  const truncated = publicKey ? `${publicKey.slice(0, 4)}···${publicKey.slice(-4)}` : '';

  const solPrice = useSolPrice();
  const totalUsd = usdc + sol * solPrice;

  async function handleCopyAddress() {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — ignore; the receive modal shows the full address.
    }
  }

  async function handleAirdrop() {
    if (!publicKey || airdropState === 'loading') return;
    setAirdropState('loading');
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com',
        'confirmed',
      );
      const pubkey = new PublicKey(publicKey);
      const sig = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
      setAirdropState('success');
      onAirdrop?.();
      setTimeout(() => setAirdropState('idle'), 3000);
    } catch (err) {
      console.error('[airdrop]', err);
      setAirdropState('error');
      setTimeout(() => setAirdropState('idle'), 6000);
    }
  }

  async function handleUsdcAirdrop() {
    if (!publicKey || usdcAirdropState === 'loading') return;
    setUsdcAirdropState('loading');
    try {
      const res = await fetch('/api/faucet/usdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: publicKey }),
      });
      if (!res.ok) throw new Error(`Faucet returned ${res.status}`);
      setUsdcAirdropState('success');
      onAirdrop?.();
      setTimeout(() => setUsdcAirdropState('idle'), 3000);
    } catch (err) {
      console.error('[usdc faucet]', err);
      setUsdcAirdropState('error');
      setTimeout(() => setUsdcAirdropState('idle'), 6000);
    }
  }

  const showAirdropButton = !isLoading && sol < 0.01;
  const showUsdcFaucetButton = !isLoading && usdc < 1;

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 1000);
  }

  return (
    <div className="px-4 pt-2 pb-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden theme-invert"
        style={{
          background: 'linear-gradient(135deg, #1A1510 0%, #0F0D0A 50%, #0A0A0A 100%)',
          border: '1px solid rgba(212,175,127,0.12)',
        }}
      >
        {/* Gold glow */}
        <div
          className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,127,0.14) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}
        />
        {/* Green glow when earning */}
        {hasYield && (
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }}
          />
        )}

        <div className="relative p-6">
          {/* Label */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
              Total Portfolio
            </p>
            <button
              onClick={handleRefresh}
              disabled={isLoading || refreshing}
              aria-label="Refresh balances"
              className="w-6 h-6 -m-1 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors disabled:opacity-40"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Main hero: total USD value */}
          {isLoading ? (
            <div className="h-14 w-48 bg-white/[0.06] rounded-xl animate-pulse mb-1" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={totalUsd.toFixed(2)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="font-mono font-bold text-5xl tracking-tight leading-none mb-1 text-white"
              >
                {solPrice > 0
                  ? `$${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `$${usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Breakdown row */}
          <div className="flex items-center gap-3 mb-1">
            {isLoading ? (
              <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <>
                <p className="text-sm text-white/35 font-medium">
                  {usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </p>
                {sol > 0 && (
                  <span className="text-xs text-white/20 font-mono">+ {sol.toFixed(4)} SOL</span>
                )}
                {solPrice > 0 && sol > 0 && (
                  <span className="text-xs text-white/15 font-mono">
                    (~${(sol * solPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
              </>
            )}
          </div>

          {/* Faucet buttons — shown when balances are low (devnet) */}
          {(showAirdropButton || showUsdcFaucetButton) && (
            <div className="mb-4 flex items-center gap-4 flex-wrap">
              {/* SOL airdrop button */}
              {showAirdropButton && (
                <AnimatePresence mode="wait">
                  {airdropState === 'success' ? (
                    <motion.span
                      key="sol-success"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 text-xs text-success font-semibold"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      1 SOL added!
                    </motion.span>
                  ) : airdropState === 'error' ? (
                    <motion.a
                      key="sol-error"
                      href={`https://faucet.solana.com/?address=${publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 font-medium underline underline-offset-2"
                    >
                      Faucet limit hit — try faucet.solana.com
                    </motion.a>
                  ) : (
                    <motion.button
                      key="sol-button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={handleAirdrop}
                      disabled={airdropState === 'loading'}
                      className="inline-flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      {airdropState === 'loading' ? (
                        <>
                          <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
                          <span>Requesting SOL…</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Get test SOL
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              )}

              {/* Divider when both buttons visible */}
              {showAirdropButton && showUsdcFaucetButton && (
                <span className="text-white/15 text-xs select-none">·</span>
              )}

              {/* USDC faucet button */}
              {showUsdcFaucetButton && (
                <AnimatePresence mode="wait">
                  {usdcAirdropState === 'success' ? (
                    <motion.span
                      key="usdc-success"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 text-xs text-success font-semibold"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      USDC sent!
                    </motion.span>
                  ) : usdcAirdropState === 'error' ? (
                    <motion.a
                      key="usdc-error"
                      href="https://faucet.circle.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 font-medium underline underline-offset-2"
                    >
                      Faucet down — try faucet.circle.com
                    </motion.a>
                  ) : (
                    <motion.button
                      key="usdc-button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={handleUsdcAirdrop}
                      disabled={usdcAirdropState === 'loading'}
                      className="inline-flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      {usdcAirdropState === 'loading' ? (
                        <>
                          <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
                          <span>Requesting USDC…</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Get test USDC
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Spacer when no faucet buttons */}
          {!showAirdropButton && !showUsdcFaucetButton && <div className="mb-5" />}

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Yield status */}
            {hasYield ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-success text-xs font-semibold">{apy.toFixed(1)}% APY</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                <span className="text-white/35 text-xs font-medium">Not earning</span>
              </div>
            )}

            {/* Wallet address — click to copy */}
            {publicKey && (
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.05] transition-all group"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5"
                    >
                      <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="font-mono text-xs text-success font-semibold">Copied!</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="address"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="font-mono text-xs text-white/30 group-hover:text-white/50 transition-colors">{truncated}</span>
                      <svg className="w-2.5 h-2.5 text-white/20 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
