'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useXStocks } from '@/lib/useXStocks';

function fmtMarketCap(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(n: number): string {
  if (n === 0) return '—';
  return n >= 1000
    ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${n.toFixed(2)}`;
}

const TICKER_COLORS: Record<string, string> = {
  NVDA:  '#76b900',
  AAPL:  '#6e7f8d',
  MSFT:  '#00a4ef',
  AMZN:  '#ff9900',
  GOOGL: '#4285f4',
  META:  '#0082fb',
  TSLA:  '#e82127',
  SPY:   '#9b59b6',
  COIN:  '#0052ff',
  MSTR:  '#f97316',
};

const LOGO_DOMAINS: Record<string, string> = {
  NVDA:  'nvidia.com',
  AAPL:  'apple.com',
  MSFT:  'microsoft.com',
  AMZN:  'amazon.com',
  GOOGL: 'abc.xyz',
  META:  'meta.com',
  TSLA:  'tesla.com',
  SPY:   'ssga.com',
  COIN:  'coinbase.com',
  MSTR:  'microstrategy.com',
};

function TickerBadge({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const color = TICKER_COLORS[symbol] ?? '#D4AF7F';
  const domain = LOGO_DOMAINS[symbol];
  const label = symbol.length > 4 ? symbol.slice(0, 4) : symbol;

  if (domain && !failed) {
    return (
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: '#ffffff', padding: 4 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://logo.clearbit.com/${domain}?size=36`}
          alt={symbol}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <span className="text-[9px] font-black tracking-tight" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 bg-white/[0.04] rounded" />
        <div className="h-2.5 w-14 bg-white/[0.03] rounded" />
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-3 w-16 bg-white/[0.04] rounded ml-auto" />
        <div className="h-2.5 w-10 bg-white/[0.03] rounded ml-auto" />
      </div>
    </div>
  );
}

export function XStocksSection() {
  const { stocks, isLoading, error } = useXStocks();
  const isStale = stocks.length > 0 && stocks[0].stale;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
          Tokenized Stocks
        </p>
        <div className="flex items-center gap-2">
          {isStale && <span className="text-[10px] text-white/20">approximate</span>}
          <a
            href="https://xstocks.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-accent/50 hover:text-accent/80 transition-colors"
          >
            Powered by xStocks ↗
          </a>
        </div>
      </div>

      {/* Regulatory note */}
      <p className="text-[10px] text-white/20 leading-relaxed mb-2 px-1">
        xStocks are tracker certificates issued by Backed Finance (Jersey). Not available to US retail investors. Holdings shown reflect your mainnet wallet.
      </p>

      <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04]">
          <div className="w-9 flex-shrink-0" />
          <p className="flex-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">Asset</p>
          <div className="text-right w-28 flex-shrink-0 hidden sm:block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">Mkt Cap</span>
          </div>
          <div className="text-right w-20 flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">Price</span>
          </div>
          <div className="text-right w-14 flex-shrink-0 hidden sm:block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">Balance</span>
          </div>
        </div>

        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <p className="text-xs text-white/30">Market data unavailable — try again shortly</p>
          </div>
        ) : (
          stocks.map((stock, i) => {
            const isPositive = stock.change24h >= 0;
            return (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0"
              >
                <TickerBadge symbol={stock.symbol} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 truncate leading-tight">
                    {stock.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-white/30">{stock.xSymbol}</span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: isPositive ? '#4ade80' : '#f87171' }}
                    >
                      {isPositive ? '+' : ''}{stock.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="text-right w-28 flex-shrink-0 hidden sm:block">
                  <p className="text-xs font-mono text-white/50">{fmtMarketCap(stock.marketCap)}</p>
                </div>

                <div className="text-right w-20 flex-shrink-0">
                  <p className="text-sm font-bold font-mono text-white/80">{fmtPrice(stock.price)}</p>
                </div>

                <div className="text-right w-14 flex-shrink-0 hidden sm:block">
                  <p className="text-xs font-mono text-white/25">$0.00</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
