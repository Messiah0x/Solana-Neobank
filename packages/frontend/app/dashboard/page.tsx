'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { WalletCard } from '@/components/wallet/WalletCard';
import { YieldCard } from '@/components/yield/YieldCard';
import { BalanceHero } from '@/components/dashboard/BalanceHero';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import {
  createWallet,
  getWallet,
  getWalletBalance,
  getWalletTransactions,
  getYieldData,
} from '@/lib/api';

const DEMO_USER_ID = 'demo-user-001';

export default function DashboardPage() {
  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to load existing wallet on mount
  useEffect(() => {
    getWallet(DEMO_USER_ID)
      .then((w) => setWalletPublicKey(w.publicKey))
      .catch(() => {})
      .finally(() => setWalletChecked(true));
  }, []);

  const { data: balance, isLoading: balanceLoading, mutate: mutateBalance } = useSWR(
    walletPublicKey ? `balance-${DEMO_USER_ID}` : null,
    () => getWalletBalance(DEMO_USER_ID),
    { refreshInterval: 30_000 },
  );

  const { data: yieldData, isLoading: yieldLoading, mutate: mutateYield } = useSWR(
    walletPublicKey ? `yield-${DEMO_USER_ID}` : null,
    () => getYieldData(DEMO_USER_ID),
    { refreshInterval: 60_000 },
  );

  const { data: transactions, isLoading: txLoading } = useSWR(
    walletPublicKey ? `tx-${DEMO_USER_ID}` : null,
    () => getWalletTransactions(DEMO_USER_ID, 5),
    { refreshInterval: 30_000 },
  );

  async function handleCreateWallet() {
    setCreating(true);
    setError(null);
    try {
      const wallet = await createWallet(DEMO_USER_ID);
      setWalletPublicKey(wallet.publicKey);
      mutateBalance();
      mutateYield();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setCreating(false);
    }
  }

  function handleDepositSuccess() {
    mutateBalance();
    mutateYield();
  }

  const hasWallet = !!walletPublicKey;

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mt-3 px-4 py-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm"
            >
              {error}
            </motion.div>
          )}

          {!walletChecked ? (
            /* Loading skeleton while we check for existing wallet */
            <div className="px-4 pt-4 space-y-3">
              <div className="rounded-3xl border border-white/[0.06] bg-surface/30 h-44 animate-pulse" />
              <div className="grid grid-cols-4 gap-3 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.04] h-20 animate-pulse" />
                ))}
              </div>
            </div>
          ) : !hasWallet ? (
            /* Wallet creation */
            <div className="px-4 pt-5 lg:pt-10 lg:px-10">
              <div className="max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-4 px-1">
                  Get started
                </p>
                <WalletCard onCreateWallet={handleCreateWallet} creating={creating} />
              </div>
            </div>
          ) : (
            /* Full dashboard — single column on mobile, 2-col on desktop */
            <div className="lg:px-8 lg:pt-6">
              {/* Balance hero — full width on both */}
              <BalanceHero
                usdc={balance?.usdc ?? 0}
                sol={balance?.sol ?? 0}
                apy={yieldData?.apy ?? 8.4}
                hasYield={yieldData?.hasPosition ?? false}
                isLoading={balanceLoading}
                publicKey={walletPublicKey ?? ''}
              />

              {/* Quick actions — full width */}
              <QuickActions />

              {/* Below quick actions: 2-col on desktop, single col on mobile */}
              <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:mt-4">
                {/* Yield card */}
                <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 lg:pb-0 lg:order-2">
                  <YieldCard
                    yieldData={yieldData}
                    isLoading={yieldLoading}
                    usdcBalance={balance?.usdc ?? 0}
                    userId={DEMO_USER_ID}
                    onDepositSuccess={handleDepositSuccess}
                  />
                </div>

                {/* Activity feed */}
                <div className="lg:order-1">
                  <ActivityFeed
                    transactions={transactions}
                    isLoading={txLoading}
                    hasWallet={hasWallet}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
