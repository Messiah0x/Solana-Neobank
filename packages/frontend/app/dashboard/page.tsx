'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { WalletCard } from '@/components/wallet/WalletCard';
import { BalanceDisplay } from '@/components/wallet/BalanceDisplay';
import { createWallet, getWalletBalance } from '@/lib/api';

// For Phase 1, we use a demo user. Phase 5 (KYC) replaces this with auth.
const DEMO_USER_ID = 'demo-user-001';

export default function DashboardPage() {
  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: balance, isLoading, mutate } = useSWR(
    walletPublicKey ? `balance-${DEMO_USER_ID}` : null,
    () => getWalletBalance(DEMO_USER_ID),
    { refreshInterval: 30_000 },
  );

  async function handleCreateWallet() {
    setCreating(true);
    setError(null);
    try {
      const wallet = await createWallet(DEMO_USER_ID);
      setWalletPublicKey(wallet.publicKey);
      mutate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-60">
        <Header />

        <main className="flex-1 p-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl"
          >
            {/* Page header */}
            <div className="mb-8">
              <h1 className="font-heading font-bold text-2xl tracking-tight mb-1">Overview</h1>
              <p className="text-sm text-white/35">Your Solana neobank dashboard</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 px-4 py-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm"
              >
                {error}
              </motion.div>
            )}

            {walletPublicKey ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BalanceDisplay
                  balance={balance}
                  isLoading={isLoading}
                  publicKey={walletPublicKey}
                  onRefresh={() => mutate()}
                />
              </div>
            ) : (
              <WalletCard onCreateWallet={handleCreateWallet} creating={creating} />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
