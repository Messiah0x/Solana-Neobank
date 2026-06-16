'use client';

import { motion } from 'framer-motion';
import { useSolMarket } from '@/lib/useSolMarket';

function fmtMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function SolanaLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="solGrad" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#13111A" />
      <path
        d="M8 22.5h13.5c.3 0 .5-.1.7-.3l1.5-1.6c.4-.4.1-1.1-.5-1.1H9.7c-.3 0-.5.1-.7.3l-1.5 1.6c-.4.4-.1 1.1.5 1.1z"
        fill="url(#solGrad)"
      />
      <path
        d="M8 16.8h13.5c.3 0 .5-.1.7-.3l1.5-1.6c.4-.4.1-1.1-.5-1.1H9.7c-.3 0-.5.1-.7.3l-1.5 1.6c-.4.4-.1 1.1.5 1.1z"
        fill="url(#solGrad)"
      />
      <path
        d="M23.2 10.4a1 1 0 00-.7-.3H9c-.6 0-.9.7-.5 1.1l1.5 1.6c.2.2.4.3.7.3h13.5c.6 0 .9-.7.5-1.1l-1.5-1.6z"
        fill="url(#solGrad)"
      />
    </svg>
  );
}

export function SolanaMarketCard() {
  const { price, marketCap, change24h } = useSolMarket();

  const isPositive = change24h >= 0;
  const loading = price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mx-4 mb-4 lg:mx-0 rounded-2xl border border-white/[0.06] bg-surface/30 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-3 px-0.5">
        Market
      </p>

      <div className="flex items-center gap-3">
        <SolanaLogo />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-white/80">Solana</span>
            <span className="text-[11px] text-white/30 font-mono">SOL</span>
          </div>
          <p className="text-[11px] text-white/30 mt-0.5">
            Mkt Cap: {marketCap ? fmtMarketCap(marketCap) : '—'}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold font-mono text-white/90">
            {loading ? '—' : `$${price.toFixed(2)}`}
          </p>
          <p
            className="text-[11px] font-semibold mt-0.5"
            style={{ color: loading ? 'rgba(255,255,255,0.2)' : isPositive ? '#4ade80' : '#f87171' }}
          >
            {loading ? '—' : `${isPositive ? '+' : ''}${change24h.toFixed(2)}%`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
