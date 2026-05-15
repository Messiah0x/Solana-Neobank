'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { YieldTicker } from './YieldTicker';
import { DepositModal } from './DepositModal';
import { depositUsdc } from '@/lib/api';

interface YieldData {
  hasPosition: boolean;
  apy: number;
  depositedAmount: number;
  earnedYield: number;
  depositedAt: string | null;
  protocol: string;
}

interface Props {
  yieldData: YieldData | undefined;
  isLoading: boolean;
  usdcBalance: number;
  userId: string;
  onDepositSuccess: () => void;
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/35 font-medium">{label}</span>
      <span className={`font-mono text-sm font-semibold ${accent ? 'text-success' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export function YieldCard({ yieldData, isLoading, usdcBalance, userId, onDepositSuccess }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const apy = yieldData?.apy ?? 8.4;
  const hasPosition = yieldData?.hasPosition ?? false;
  const depositedAmount = yieldData?.depositedAmount ?? 0;
  const depositedAt = yieldData?.depositedAt ?? null;

  const dailyYield = (usdcBalance * (apy / 100)) / 365;
  const monthlyYield = (usdcBalance * (apy / 100)) / 12;

  async function handleDeposit(amount: number) {
    await depositUsdc(userId, amount);
    onDepositSuccess();
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 rounded-2xl border border-white/[0.06] bg-surface p-6"
      >
        <div className="space-y-3">
          <div className="h-5 w-24 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-12 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-36 bg-white/[0.06] rounded animate-pulse" />
        </div>
      </motion.div>
    );
  }

  // ── ACTIVE POSITION ─────────────────────────────────────────────────────────
  if (hasPosition && depositedAt) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-2 rounded-2xl border border-white/[0.06] bg-surface overflow-hidden"
        >
          {/* Green top accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-success/0 via-success to-success/0" />

          <div className="p-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-semibold text-white/70">Earning on Marginfi</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-accent-muted border border-accent/15 text-accent font-mono text-xs font-bold">
                {apy.toFixed(1)}% APY
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Deposited */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-2">
                  Deposited
                </p>
                <div className="font-mono font-bold text-2xl">
                  ${depositedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-white/30 mt-1">USDC · Marginfi</p>
              </div>

              {/* Live ticker */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-2">
                  Earned
                </p>
                <YieldTicker
                  principal={depositedAmount}
                  apyPercent={apy}
                  depositedAt={depositedAt}
                />
                <p className="text-xs text-success/50 mt-1">Live · updating</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-1">
              <StatRow
                label="Daily earnings"
                value={`+$${((depositedAmount * (apy / 100)) / 365).toFixed(4)}`}
                accent
              />
              <StatRow
                label="Monthly earnings"
                value={`+$${((depositedAmount * (apy / 100)) / 12).toFixed(2)}`}
                accent
              />
            </div>

            {/* Withdraw */}
            <button className="mt-5 w-full py-2.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/15 transition-all text-sm font-semibold">
              Withdraw Funds
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  // ── NO POSITION ──────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="col-span-2 rounded-2xl border border-white/[0.06] bg-surface p-6"
      >
        {/* APY headline */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-2">
              Current APY
            </p>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="font-mono font-bold text-5xl text-accent leading-none"
            >
              {apy.toFixed(1)}
              <span className="text-2xl text-accent/60 ml-1">%</span>
            </motion.div>
            <p className="text-xs text-white/30 mt-2">Lending rate on Marginfi · USDC</p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <span className="text-xs text-white/35 font-semibold">Marginfi</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <span className="text-xs text-white/35 font-semibold">Non-custodial</span>
            </div>
          </div>
        </div>

        {/* Projections */}
        {usdcBalance > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Daily', value: `$${dailyYield.toFixed(4)}` },
              { label: 'Monthly', value: `$${monthlyYield.toFixed(2)}` },
              { label: 'Yearly', value: `$${(usdcBalance * (apy / 100)).toFixed(2)}` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center"
              >
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">
                  {item.label}
                </p>
                <p className="font-mono text-sm font-bold text-success">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {usdcBalance <= 0 && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-warning/5 border border-warning/15 text-warning/70 text-sm">
            Add USDC to your wallet to start earning.
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModalOpen(true)}
          disabled={usdcBalance <= 0}
          className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          Start Earning
        </motion.button>
      </motion.div>

      <DepositModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDeposit}
        usdcBalance={usdcBalance}
        apy={apy}
      />
    </>
  );
}
