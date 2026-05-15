'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  usdc: number;
  sol: number;
  apy: number;
  hasYield: boolean;
  isLoading: boolean;
  publicKey: string;
}

export function BalanceHero({ usdc, sol, apy, hasYield, isLoading, publicKey }: Props) {
  const truncated = publicKey ? `${publicKey.slice(0, 4)}···${publicKey.slice(-4)}` : '';

  return (
    <div className="px-4 pt-2 pb-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D1530 0%, #0A1020 50%, #080C18 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Blue glow */}
        <div
          className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.18) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-3">
            Total Balance
          </p>

          {/* Balance number */}
          {isLoading ? (
            <div className="h-14 w-48 bg-white/[0.06] rounded-xl animate-pulse mb-1" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={usdc}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="font-mono font-bold text-5xl tracking-tight leading-none mb-1"
              >
                ${usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.div>
            </AnimatePresence>
          )}
          <p className="text-sm text-white/35 font-medium mb-5">USDC · Solana</p>

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

            {/* Wallet address */}
            {publicKey && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-mono text-xs text-white/30">{truncated}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
