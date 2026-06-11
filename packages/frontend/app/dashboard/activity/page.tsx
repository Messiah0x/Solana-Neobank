'use client';

import { useState } from 'react';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { motion, AnimatePresence } from 'framer-motion';

import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { getWalletTransactions, getWallet } from '@/lib/api';
import { fetchTransactionsFromChain } from '@/lib/chain';

type Filter = 'all' | 'received' | 'sent' | 'yield';

interface Transaction {
  signature: string;
  timestamp: number | null;
  status: 'success' | 'failed';
  slot: number;
  type: 'sent' | 'received' | 'other';
  amount: number | null;
  counterparty: string | null;
  token?: 'USDC' | 'SOL' | null;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of txs) {
    const key = tx.timestamp ? formatDate(tx.timestamp) : 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return groups;
}

function TxIcon({ type }: { type: 'sent' | 'received' | 'other' }) {
  if (type === 'received') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-success/10 border border-success/15 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </div>
    );
  }
  if (type === 'sent') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-error/10 border border-error/15 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
      </svg>
    </div>
  );
}

function formatAmount(
  amount: number | null,
  type: 'sent' | 'received' | 'other',
  token: 'USDC' | 'SOL' | null,
): string | null {
  if (amount === null || amount === 0) return null;
  const sign = type === 'received' ? '+' : type === 'sent' ? '-' : '';
  const formatted = amount >= 0.01 && amount < 10000
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : amount.toFixed(6);
  return `${sign}${formatted}${token ? ` ${token}` : ''}`;
}

function TxRow({ tx, index }: { tx: Transaction; index: number }) {
  const short = `${tx.signature.slice(0, 8)}···${tx.signature.slice(-6)}`;
  const counterpartyShort = tx.counterparty
    ? `${tx.counterparty.slice(0, 6)}···${tx.counterparty.slice(-4)}`
    : null;
  const explorerUrl = `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`;
  const label = tx.type === 'received' ? 'Received' : tx.type === 'sent' ? 'Sent' : 'Transaction';
  const amountStr = formatAmount(tx.amount, tx.type, tx.token ?? null);
  const amountColor = tx.type === 'received' ? 'text-success' : tx.type === 'sent' ? 'text-error' : 'text-white/40';

  return (
    <motion.a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="flex items-center gap-3.5 py-3.5 border-b border-white/[0.04] last:border-0 group cursor-pointer hover:bg-white/[0.02] -mx-4 px-4 transition-colors"
    >
      <TxIcon type={tx.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors flex items-center gap-1.5">
          {label}
          <svg className="w-3 h-3 text-white/20 group-hover:text-accent/50 transition-colors opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </p>
        <p className="text-xs text-white/25 font-mono mt-0.5 truncate group-hover:text-white/40 transition-colors">
          {counterpartyShort ?? short}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        {amountStr ? (
          <p className={`text-sm font-semibold tabular-nums ${amountColor}`}>{amountStr}</p>
        ) : (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            tx.status === 'success' ? 'bg-success/10 text-success/80' : 'bg-error/10 text-error/80'
          }`}>
            {tx.status}
          </span>
        )}
        {tx.timestamp && (
          <p className="text-[10px] text-white/20 mt-1.5 tabular-nums">{formatTime(tx.timestamp)}</p>
        )}
      </div>
    </motion.a>
  );
}

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="w-10 h-10 rounded-2xl bg-white/[0.05] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 bg-white/[0.05] rounded animate-pulse" style={{ animationDelay: `${delay}ms` }} />
        <div className="h-3 w-48 bg-white/[0.04] rounded animate-pulse" style={{ animationDelay: `${delay + 100}ms` }} />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3.5 w-16 bg-white/[0.05] rounded animate-pulse" style={{ animationDelay: `${delay}ms` }} />
        <div className="h-3 w-10 bg-white/[0.04] rounded animate-pulse ml-auto" style={{ animationDelay: `${delay + 150}ms` }} />
      </div>
    </div>
  );
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'received', label: 'Received' },
  { key: 'sent', label: 'Sent' },
  { key: 'yield', label: 'Yield' },
];

export default function ActivityPage() {
  const { user } = usePrivy();
  const userId = user?.id ?? null;
  
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const { wallets } = useSolanaWallets();
  const privyAddress = wallets[0]?.address ?? null;

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

  const { data: transactions, isLoading } = useSWR(
    wallet && userId ? `tx-all-${userId}` : null,
    async () => {
      try {
        return await getWalletTransactions(userId!, 50);
      } catch {
        const pk = wallet?.publicKey ?? privyAddress;
        if (!pk) throw new Error('No wallet');
        return fetchTransactionsFromChain(pk, 50);
      }
    },
    { refreshInterval: 30_000 },
  );

  const filtered = (transactions ?? []).filter((tx: Transaction) => {
    if (search && !tx.signature.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'yield') return false;
    if (filter === 'received') return tx.type === 'received';
    if (filter === 'sent') return tx.type === 'sent';
    return true;
  });

  const grouped = groupByDate(filtered);
  const hasWallet = !!wallet;

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-2xl mx-auto">

            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">Transactions</p>
              <h1 className="text-2xl font-bold text-ivory">Activity</h1>
            </div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative mb-4"
            >
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by signature..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.07] bg-surface/50 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-accent/30 focus:bg-surface transition-all font-mono"
              />
            </motion.div>

            {/* Filter pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.3 }}
              className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1"
            >
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-accent text-[#0A0A0A]'
                      : 'bg-white/[0.05] text-white/40 hover:text-white/60 border border-white/[0.06]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden"
            >
              {isLoading ? (
                <div className="px-4">
                  {[0, 150, 300, 450, 600].map((d) => (
                    <SkeletonRow key={d} delay={d} />
                  ))}
                </div>
              ) : !hasWallet ? (
                <div className="flex flex-col items-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white/35">No wallet yet</p>
                  <p className="text-xs text-white/20 mt-1.5">Create a wallet to start transacting</p>
                </div>
              ) : filter === 'yield' ? (
                <div className="flex flex-col items-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/[0.06] border border-accent/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-accent/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white/35">No yield transactions yet</p>
                  <p className="text-xs text-white/20 mt-1.5">Deposit to Marginfi to start earning</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white/35">
                    {search ? 'No matches' : 'No transactions yet'}
                  </p>
                  <p className="text-xs text-white/20 mt-1.5">
                    {search ? 'Try a different search term' : 'Fund your wallet to get started'}
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={filter + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {Object.entries(grouped).map(([date, txs]) => (
                      <div key={date}>
                        <div className="px-4 pt-4 pb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">{date}</p>
                        </div>
                        <div className="px-4">
                          {txs.map((tx: Transaction, i: number) => (
                            <TxRow key={tx.signature} tx={tx} index={i} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>

            {filtered.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-[11px] text-white/20 mt-4"
              >
                {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} · Solana Devnet
              </motion.p>
            )}

          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
