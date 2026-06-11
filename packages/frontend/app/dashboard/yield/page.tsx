'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DepositModal } from '@/components/yield/DepositModal';
import { WithdrawModal } from '@/components/yield/WithdrawModal';
import { getWallet, getWalletBalance, getYieldData, getYieldApy } from '@/lib/api';
import { useYieldActions } from '@/lib/useYieldActions';
import { fetchBalancesFromChain } from '@/lib/chain';

function calcProjections(deposited: number, apy: number) {
  const daily = (deposited * (apy / 100)) / 365;
  return { daily, weekly: daily * 7, monthly: daily * 30, annual: deposited * (apy / 100) };
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ProjectionCard({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex-1 rounded-2xl border border-white/[0.06] bg-surface/40 p-4"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">{label}</p>
      <p className="font-mono text-lg font-bold text-success">+${fmt(value)}</p>
    </motion.div>
  );
}

export default function YieldPage() {
  const { user } = usePrivy();
  const userId = user?.id ?? null;
  const yieldActions = useYieldActions(userId);
  const { wallets } = useSolanaWallets();
  const privyAddress = wallets[0]?.address ?? null;

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { data: wallet } = useSWR(
    userId ? `wallet-${userId}-${privyAddress ?? 'pending'}` : null,
    async () => {
      try {
        return await getWallet(userId!);
      } catch {
        // Backend down — fall back to the Privy wallet address directly
        return privyAddress ? { publicKey: privyAddress } : null;
      }
    },
  );
  const { data: balance, mutate: mutateBalance } = useSWR(
    wallet ? `balance-${userId}` : null,
    async () => {
      try {
        return await getWalletBalance(userId!);
      } catch {
        if (!wallet?.publicKey) throw new Error('No wallet');
        return fetchBalancesFromChain(wallet.publicKey);
      }
    },
    { refreshInterval: 30_000 },
  );
  const { data: yieldData, isLoading, mutate: mutateYield } = useSWR(
    wallet ? `yield-${userId}` : null,
    () => getYieldData(userId!),
    { refreshInterval: 30_000 },
  );
  const { data: liveApy } = useSWR('yield-apy', getYieldApy, { refreshInterval: 60_000 });

  const hasWallet = !!wallet;
  const hasPosition = yieldData?.hasPosition ?? false;
  const deposited = yieldData?.depositedAmount ?? 0;
  const earned = yieldData?.earnedYield ?? 0;
  const apy = yieldData?.apy ?? liveApy ?? 5.2;
  const proj = calcProjections(deposited, apy);
  const usdcAvailable = balance?.usdc ?? 0;

  async function handleDeposit(amount: number) {
    await yieldActions.deposit(amount);
    await Promise.all([mutateYield(), mutateBalance()]);
  }

  async function handleWithdraw(amount: number) {
    await yieldActions.withdraw(amount);
    await Promise.all([mutateYield(), mutateBalance()]);
  }

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-2xl mx-auto space-y-4">

            <div className="mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">MarginFi Protocol</p>
              <h1 className="text-2xl font-bold text-ivory">Yield</h1>
            </div>

            {/* Live APY banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative rounded-2xl overflow-hidden p-5"
              style={{
                background: 'linear-gradient(135deg, #0F1A12 0%, #0A0F0B 50%, #0A0A0A 100%)',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <div
                className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)', transform: 'translate(25%, -25%)' }}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-2">Live Rate</p>
                  {isLoading ? (
                    <div className="w-20 h-10 bg-white/[0.06] rounded-xl animate-pulse" />
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={apy}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-4xl font-bold text-success leading-none"
                      >
                        {apy.toFixed(1)}%
                      </motion.p>
                    </AnimatePresence>
                  )}
                  <p className="text-xs text-white/30 mt-1.5 font-medium">Annual Percentage Yield</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-bold text-success">Live</span>
                  </div>
                  <p className="text-[10px] text-white/25 font-medium">MarginFi · Devnet</p>
                </div>
              </div>
            </motion.div>

            {/* No wallet */}
            {!hasWallet && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/[0.06] bg-surface/30 flex flex-col items-center py-14 px-6 text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(212,175,127,0.08) 0%, rgba(212,175,127,0.03) 100%)', border: '1px solid rgba(212,175,127,0.12)' }}
                >
                  <svg className="w-7 h-7 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white/35">No wallet yet</p>
                <p className="text-xs text-white/20 mt-1.5 max-w-xs leading-relaxed">Create a wallet on the Overview page to start earning yield on your USDC</p>
              </motion.div>
            )}

            {/* Loading */}
            {hasWallet && isLoading && (
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 p-5 space-y-4">
                <div className="w-32 h-4 bg-white/[0.05] rounded animate-pulse" />
                <div className="w-48 h-10 bg-white/[0.05] rounded animate-pulse" />
                <div className="w-24 h-3 bg-white/[0.04] rounded animate-pulse" />
                <div className="flex gap-3 pt-2">
                  {[1,2,3].map(i => <div key={i} className="flex-1 h-20 bg-white/[0.04] rounded-2xl animate-pulse" />)}
                </div>
              </div>
            )}

            {/* Active position */}
            {hasWallet && !isLoading && hasPosition && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-white/[0.06] bg-surface/30 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Position</p>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-bold text-success">Earning</span>
                    </div>
                  </div>
                  <p className="font-mono text-4xl font-bold text-ivory leading-none">${fmt(deposited)}</p>
                  <p className="text-sm text-white/30 mt-1 mb-5">USDC deposited · MarginFi</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05]">
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold">Total Earned</p>
                      <p className="font-mono text-base font-bold text-success mt-0.5">+${fmt(earned)}</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold">Since</p>
                      <p className="text-sm font-semibold text-white/40 mt-0.5">
                        {yieldData?.depositedAt
                          ? new Date(yieldData.depositedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <div className="flex gap-3">
                  <ProjectionCard label="Weekly" value={proj.weekly} delay={0.15} />
                  <ProjectionCard label="Monthly" value={proj.monthly} delay={0.2} />
                  <ProjectionCard label="Annual" value={proj.annual} delay={0.25} />
                </div>
              </>
            )}

            {/* No position CTA */}
            {hasWallet && !isLoading && !hasPosition && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/[0.06] bg-surface/30 p-6 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)', border: '1px solid rgba(16,185,129,0.12)' }}
                >
                  <svg className="w-6 h-6 text-success/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white/50 mb-1">Start earning yield</p>
                <p className="text-xs text-white/25 leading-relaxed mb-5 max-w-xs mx-auto">
                  Deposit USDC into MarginFi to earn {apy.toFixed(1)}% APY, fully non-custodial on Solana.
                </p>
                <p className="text-[10px] text-white/20 font-mono">
                  Available balance: ${fmt(usdcAvailable)} USDC
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            {hasWallet && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDepositModal(true)}
                  disabled={usdcAvailable <= 0}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-accent/20 bg-accent/[0.06] text-accent hover:bg-accent/[0.10] hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Deposit USDC
                </motion.button>
                {hasPosition && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowWithdrawModal(true)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-white/[0.07] bg-white/[0.03] text-white/60 hover:text-white/80 hover:border-white/15 transition-all"
                  >
                    Withdraw
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Protocol info */}
            {hasWallet && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Protocol</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white/40">MF</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/50">MarginFi</p>
                      <p className="text-[10px] text-white/25 mt-0.5">Solana lending protocol</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white/30">Non-custodial</p>
                    <p className="text-[10px] text-white/20 mt-0.5">Devnet · Phase 1</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fee transparency */}
            {hasWallet && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-[11px] text-white/25 leading-relaxed mt-4 px-1"
              >
                How Avanor makes money: we take a 10% performance fee on yield you earn — never on
                your principal. Deposits and withdrawals are always free. The APY shown is what you
                receive after fees.
              </motion.p>
            )}

          </div>
        </main>
      </div>
      <MobileNav />

      {userId && (
        <>
          <DepositModal
            isOpen={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            onConfirm={handleDeposit}
            usdcBalance={usdcAvailable}
            apy={apy}
          />
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            onConfirm={handleWithdraw}
            depositedAmount={deposited}
          />
        </>
      )}
    </div>
  );
}
