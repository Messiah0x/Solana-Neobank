'use client';

import { motion } from 'framer-motion';
import { shortAddr, explorerTxUrl } from '@/lib/format';

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

interface Props {
  transactions?: Transaction[];
  isLoading: boolean;
  hasWallet: boolean;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatAmount(
  amount: number | null,
  type: 'sent' | 'received' | 'other',
  token: 'USDC' | 'SOL' | null,
): string | null {
  if (amount === null || amount === 0) return null;
  const sign = type === 'received' ? '+' : type === 'sent' ? '-' : '';
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return `${sign}${formatted}${token ? ` ${token}` : ''}`;
}

function TxRow({ tx, index }: { tx: Transaction; index: number }) {
  const short = shortAddr(tx.signature, 6);
  const counterpartyShort = tx.counterparty ? shortAddr(tx.counterparty, 6) : null;
  const explorerUrl = explorerTxUrl(tx.signature);
  const label = tx.type === 'received' ? 'Received' : tx.type === 'sent' ? 'Sent' : 'Transaction';
  const amountStr = formatAmount(tx.amount, tx.type, tx.token ?? null);
  const amountColor = tx.type === 'received' ? 'text-success' : tx.type === 'sent' ? 'text-error' : 'text-white/40';

  const iconBg = tx.type === 'received'
    ? 'bg-success/10 border border-success/20'
    : tx.type === 'sent'
    ? 'bg-error/10 border border-error/20'
    : 'bg-white/[0.05] border border-white/10';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-3.5 py-3.5 border-b border-white/[0.04] last:border-0"
    >
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {tx.type === 'received' ? (
          <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        ) : tx.type === 'sent' ? (
          <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/30 font-mono mt-0.5 hover:text-accent/70 transition-colors inline-flex items-center gap-1 group"
          onClick={(e) => e.stopPropagation()}
        >
          {counterpartyShort ?? short}
          <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      <div className="text-right flex-shrink-0">
        {amountStr ? (
          <p className={`text-sm font-semibold tabular-nums ${amountColor}`}>{amountStr}</p>
        ) : (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            tx.status === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}>
            {tx.status}
          </span>
        )}
        {tx.timestamp && (
          <p className="text-[10px] text-white/25 mt-1">{timeAgo(tx.timestamp)}</p>
        )}
      </div>
    </motion.div>
  );
}

export function ActivityFeed({ transactions, isLoading, hasWallet }: Props) {
  return (
    <div className="px-4 pt-5 pb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-base">Activity</h2>
        {transactions && transactions.length > 0 && (
          <span className="text-xs text-white/25 font-medium">{transactions.length} recent</span>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-surface overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/[0.06] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-28 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                </div>
                <div className="h-3.5 w-16 bg-white/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : !hasWallet ? (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/40 mb-1">No activity yet</p>
            <p className="text-xs text-white/20">Transactions will appear here</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="px-4">
            {transactions.slice(0, 5).map((tx, i) => (
              <TxRow key={tx.signature} tx={tx} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/50 mb-1">Wallet ready</p>
            <p className="text-xs text-white/25">Add funds to start transacting</p>
          </div>
        )}
      </div>
    </div>
  );
}
