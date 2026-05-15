'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Balance {
  publicKey: string;
  usdc: number;
  sol: number;
}

interface Props {
  balance?: Balance;
  isLoading: boolean;
  publicKey: string;
  onRefresh: () => void;
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

export function BalanceDisplay({ balance, isLoading, publicKey, onRefresh }: Props) {
  const [copied, setCopied] = useState(false);

  const truncated = `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`;

  function copyAddress() {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* USDC Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-white/[0.06] bg-surface p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
              USDC Balance
            </p>
            {isLoading ? (
              <div className="h-11 w-44 bg-white/[0.06] rounded-lg animate-pulse" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={balance?.usdc}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono font-bold text-4xl tracking-tight"
                >
                  ${(balance?.usdc ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="px-2.5 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <span className="text-success text-xs font-bold">USDC</span>
            </div>
          </div>
        </div>

        {/* Wallet address row */}
        <button
          onClick={copyAddress}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all group"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
          <span className="font-mono text-xs text-white/45 flex-1 text-left">{truncated}</span>
          <span className="text-white/25 group-hover:text-white/50 transition-colors">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-success text-xs font-medium"
                >
                  Copied
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CopyIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>
      </motion.div>

      {/* SOL Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-white/[0.06] bg-surface p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
          SOL Balance
        </p>
        {isLoading ? (
          <div className="h-8 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={balance?.sol}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="font-mono font-bold text-2xl text-white/80"
            >
              {(balance?.sol ?? 0).toFixed(4)}{' '}
              <span className="text-white/30 text-lg">SOL</span>
            </motion.div>
          </AnimatePresence>
        )}
        <p className="text-xs text-white/25 mt-3">Used to pay Solana transaction fees</p>
      </motion.div>
    </>
  );
}
