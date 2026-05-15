'use client';

import { motion } from 'framer-motion';

interface Props {
  onCreateWallet: () => void;
  creating: boolean;
}

export function WalletCard({ onCreateWallet, creating }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="col-span-2 rounded-2xl border border-white/[0.06] bg-surface bg-gradient-card p-10 flex flex-col items-center text-center"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-accent-muted border border-accent/20 flex items-center justify-center mb-6">
        <svg
          className="w-7 h-7 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
          />
        </svg>
      </div>

      <h2 className="font-heading font-bold text-xl mb-2">Create your wallet</h2>
      <p className="text-sm text-white/40 max-w-xs mb-8 leading-relaxed">
        Your Solana wallet is secured by Privy's MPC enclave. Your private key
        never touches our servers — only you hold it.
      </p>

      {/* Feature pills */}
      <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
        {['Non-custodial', 'MPC secured', 'Instant'].map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateWallet}
        disabled={creating}
        className="px-8 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
      >
        {creating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating wallet...
          </span>
        ) : (
          'Create Wallet'
        )}
      </motion.button>
    </motion.div>
  );
}
