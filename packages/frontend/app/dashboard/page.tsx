'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { WalletCard } from '@/components/wallet/WalletCard';
import { ReceiveModal } from '@/components/wallet/ReceiveModal';
import { YieldCard } from '@/components/yield/YieldCard';
import { BalanceHero } from '@/components/dashboard/BalanceHero';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import {
  registerWallet,
  getWallet,
  getWalletBalance,
  getWalletTransactions,
  getYieldData,
} from '@/lib/api';

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, createWallet: createPrivyWallet } = useSolanaWallets();
  const router = useRouter();

  const userId = user?.id ?? null;
  const privyWallet = wallets[0] ?? null;
  const privyPublicKey = privyWallet?.address ?? null;

  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/auth/signin');
    }
  }, [ready, authenticated, router]);

  // Once we have a Privy wallet + userId, sync it with our backend
  const syncWallet = useCallback(async () => {
    if (!userId || !privyPublicKey) return;
    setSyncing(true);
    try {
      try {
        const w = await getWallet(userId);
        setWalletPublicKey(w.publicKey);
      } catch {
        // Wallet not in backend yet — register the Privy wallet public key
        const w = await registerWallet(userId, privyPublicKey);
        setWalletPublicKey(w.publicKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync wallet');
    } finally {
      setSyncing(false);
      setWalletChecked(true);
    }
  }, [userId, privyPublicKey]);

  useEffect(() => {
    if (userId && privyPublicKey) {
      syncWallet();
    } else if (userId && !privyPublicKey && ready) {
      // User is logged in but has no Privy wallet yet — check backend anyway
      getWallet(userId)
        .then((w) => setWalletPublicKey(w.publicKey))
        .catch(() => {})
        .finally(() => setWalletChecked(true));
    }
  }, [userId, privyPublicKey, ready, syncWallet]);

  const { data: balance, isLoading: balanceLoading, mutate: mutateBalance } = useSWR(
    walletPublicKey && userId ? `balance-${userId}` : null,
    () => getWalletBalance(userId!),
    { refreshInterval: 30_000 },
  );

  const { data: yieldData, isLoading: yieldLoading, mutate: mutateYield } = useSWR(
    walletPublicKey && userId ? `yield-${userId}` : null,
    () => getYieldData(userId!),
    { refreshInterval: 60_000 },
  );

  const { data: transactions, isLoading: txLoading } = useSWR(
    walletPublicKey && userId ? `tx-${userId}` : null,
    () => getWalletTransactions(userId!, 5),
    { refreshInterval: 30_000 },
  );

  async function handleCreateWallet() {
    setCreating(true);
    setError(null);
    try {
      await createPrivyWallet();
      // syncWallet will be triggered by the wallets dependency changing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      setCreating(false);
    }
  }

  function handleDepositSuccess() {
    mutateBalance();
    mutateYield();
  }

  const hasWallet = !!walletPublicKey;
  const isLoading = !ready || (!walletChecked && authenticated);

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
              className="mx-4 mt-3 px-4 py-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm flex items-center justify-between gap-3"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-error/60 hover:text-error transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}

          {isLoading || syncing ? (
            <div className="px-4 pt-4 space-y-3">
              <div className="rounded-3xl border border-white/[0.06] bg-surface/30 h-44 animate-pulse" />
              <div className="grid grid-cols-4 gap-3 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.04] h-20 animate-pulse" />
                ))}
              </div>
            </div>
          ) : !hasWallet ? (
            <div className="px-4 pt-5 lg:pt-10 lg:px-10">
              <div className="max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-4 px-1">
                  Get started
                </p>
                <WalletCard onCreateWallet={handleCreateWallet} creating={creating} />
              </div>
            </div>
          ) : (
            <div className="lg:px-8 lg:pt-6">
              <BalanceHero
                usdc={balance?.usdc ?? 0}
                sol={balance?.sol ?? 0}
                apy={yieldData?.apy ?? 8.4}
                hasYield={yieldData?.hasPosition ?? false}
                isLoading={balanceLoading}
                publicKey={walletPublicKey ?? ''}
              />

              <QuickActions
                hasWallet={hasWallet}
                onReceive={() => setShowReceiveModal(true)}
                onEarn={() => router.push('/dashboard/yield')}
              />

              <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:mt-4">
                <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 lg:pb-0 lg:order-2">
                  <YieldCard
                    yieldData={yieldData}
                    isLoading={yieldLoading}
                    usdcBalance={balance?.usdc ?? 0}
                    userId={userId!}
                    onDepositSuccess={handleDepositSuccess}
                  />
                </div>

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

      {/* Receive modal */}
      {showReceiveModal && walletPublicKey && (
        <ReceiveModal
          publicKey={walletPublicKey}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
    </div>
  );
}
