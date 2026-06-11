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
import { SendModal } from '@/components/wallet/SendModal';
import { SwapModal } from '@/components/wallet/SwapModal';
import { YieldCard } from '@/components/yield/YieldCard';
import { BalanceHero } from '@/components/dashboard/BalanceHero';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import {
  registerWallet,
  getWallet,
  getWalletBalance,
  getWalletTransactions,
  getYieldData,
  getYieldApy,
} from '@/lib/api';
import { fetchBalancesFromChain, fetchTransactionsFromChain } from '@/lib/chain';

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
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Track whether we have already evaluated onboarding for this session
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/auth/signin');
    }
  }, [ready, authenticated, router]);

  // Once we have a Privy wallet + userId, sync it with our backend
  const syncWallet = useCallback(async (currentPublicKey?: string) => {
    const pubkey = currentPublicKey ?? privyPublicKey;
    if (!userId || !pubkey) return;
    setSyncing(true);
    setDegraded(false);
    try {
      try {
        const w = await getWallet(userId);
        setWalletPublicKey(w.publicKey);
      } catch {
        // Wallet not in backend yet — register the Privy wallet public key
        const w = await registerWallet(userId, pubkey);
        setWalletPublicKey(w.publicKey);
      }
    } catch (err) {
      // Backend unreachable — degrade gracefully: use the Privy wallet
      // directly and read balances/history straight from the chain.
      console.error('[syncWallet]', err);
      setDegraded(true);
      setWalletPublicKey(pubkey);
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

  // Show onboarding the first time walletPublicKey becomes available (and it hasn't been dismissed)
  useEffect(() => {
    if (walletPublicKey && !onboardingChecked) {
      setOnboardingChecked(true);
      const alreadyOnboarded = typeof window !== 'undefined'
        ? localStorage.getItem('avanor_onboarded')
        : '1';
      if (!alreadyOnboarded) {
        setShowOnboarding(true);
      }
    }
  }, [walletPublicKey, onboardingChecked]);

  const { data: balance, isLoading: balanceLoading, mutate: mutateBalance } = useSWR(
    walletPublicKey && userId ? `balance-${userId}` : null,
    async () => {
      try {
        return await getWalletBalance(userId!);
      } catch {
        // Backend down — read straight from the chain
        setDegraded(true);
        return fetchBalancesFromChain(walletPublicKey!);
      }
    },
    { refreshInterval: 30_000 },
  );

  const { data: yieldData, isLoading: yieldLoading, mutate: mutateYield } = useSWR(
    walletPublicKey && userId ? `yield-${userId}` : null,
    () => getYieldData(userId!),
    { refreshInterval: 60_000 },
  );

  const { data: liveApy } = useSWR('yield-apy', getYieldApy, { refreshInterval: 60_000 });
  const apy = yieldData?.apy ?? liveApy ?? 5.2;

  const { data: transactions, isLoading: txLoading, mutate: mutateTransactions } = useSWR(
    walletPublicKey && userId ? `tx-${userId}` : null,
    async () => {
      try {
        return await getWalletTransactions(userId!, 5);
      } catch {
        setDegraded(true);
        return fetchTransactionsFromChain(walletPublicKey!, 5);
      }
    },
    { refreshInterval: 30_000 },
  );

  async function handleCreateWallet() {
    setCreating(true);
    setError(null);
    try {
      let pubkey: string | null = privyPublicKey;
      try {
        await createPrivyWallet();
        // wallets array will update async — grab fresh address after create
        pubkey = wallets[0]?.address ?? privyPublicKey;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        // Privy throws if wallet already exists — treat as success and sync
        if (!msg.toLowerCase().includes('already')) throw err;
        pubkey = privyPublicKey;
      }
      // Sync immediately with the known public key (don't wait for wallets[] update)
      if (pubkey) {
        await syncWallet(pubkey);
      }
    } catch (err) {
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
  // Show "create wallet" screen only if user has no Privy wallet at all
  const needsWalletCreation = walletChecked && !privyPublicKey && !walletPublicKey;
  // Show "connecting" card whenever Privy wallet exists but backend not yet synced
  const needsSync = !!privyPublicKey && !walletPublicKey;
  // Initial spinner: before we know anything (no Privy wallet detected yet, still loading)
  const isLoading = !ready || (!walletChecked && !privyPublicKey && authenticated);

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          {degraded && (
            <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl border border-warning/20 bg-warning/[0.06] text-warning/80 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
              Limited connectivity — balances read directly from Solana. Yield deposits are temporarily unavailable.
            </div>
          )}
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

          {isLoading ? (
            <div className="px-4 pt-4 space-y-3">
              <div className="rounded-3xl border border-white/[0.06] bg-surface/30 h-44 animate-pulse" />
              <div className="grid grid-cols-4 gap-3 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.04] h-20 animate-pulse" />
                ))}
              </div>
            </div>
          ) : needsSync ? (
            /* Privy wallet detected — syncing or waiting to retry */
            <div className="px-4 pt-5 lg:pt-10 lg:px-10">
              <div className="max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/[0.06] bg-surface/30 p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                    {syncing ? (
                      <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin block" />
                    ) : (
                      <svg className="w-5 h-5 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white/70 mb-1">
                    {syncing ? 'Connecting…' : 'Connecting your wallet'}
                  </p>
                  <p className="text-xs text-white/30 mb-5">
                    {syncing ? 'Linking your Privy wallet to your account.' : 'Your Privy wallet is ready. Tap below to connect it to your account.'}
                  </p>
                  <button
                    onClick={() => syncWallet()}
                    disabled={syncing}
                    className="w-full py-3 rounded-xl bg-accent text-[#0A0A0A] text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {syncing ? 'Connecting…' : 'Connect Wallet'}
                  </button>
                </motion.div>
              </div>
            </div>
          ) : needsWalletCreation ? (
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
                apy={apy}
                hasYield={yieldData?.hasPosition ?? false}
                isLoading={balanceLoading}
                publicKey={walletPublicKey ?? ''}
                onAirdrop={() => mutateBalance()}
                onRefresh={() => {
                  mutateBalance();
                  mutateYield();
                  mutateTransactions();
                }}
              />

              <QuickActions
                hasWallet={hasWallet}
                onReceive={() => setShowReceiveModal(true)}
                onSend={() => setShowSendModal(true)}
                onEarn={() => router.push('/dashboard/yield')}
                onSwap={() => setShowSwapModal(true)}
              />

              <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:mt-4">
                <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 lg:pb-0 lg:order-2">
                  <YieldCard
                    yieldData={yieldData}
                    isLoading={yieldLoading}
                    usdcBalance={balance?.usdc ?? 0}
                    userId={userId!}
                    onDepositSuccess={handleDepositSuccess}
                    apy={apy}
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

      {/* Send modal */}
      {showSendModal && (
        <SendModal
          usdcBalance={balance?.usdc ?? 0}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            mutateBalance();
          }}
        />
      )}

      {/* Swap modal */}
      {showSwapModal && (
        <SwapModal
          solBalance={balance?.sol ?? 0}
          onClose={() => setShowSwapModal(false)}
          onSuccess={() => {
            mutateBalance();
            setShowSwapModal(false);
          }}
        />
      )}

      {/* First-time onboarding modal */}
      {showOnboarding && walletPublicKey && userId && (
        <OnboardingModal
          publicKey={walletPublicKey}
          userId={userId}
          apy={apy}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
