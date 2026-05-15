'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const stats = [
  { label: 'Settlement speed', value: '<400ms' },
  { label: 'Target APY', value: '8.4%' },
  { label: 'Network', value: 'Solana' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl flex items-center px-6 justify-between">
        <span className="font-heading font-bold text-xl tracking-tight">
          sol<span className="text-accent">bank</span>
        </span>
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Open App
          </motion.button>
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pt-16">
        <div className="text-center max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Status pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent-muted text-accent text-xs font-semibold mb-10 tracking-wide uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Live on Solana Devnet
            </motion.div>

            <h1 className="font-heading font-bold text-5xl md:text-7xl leading-[1.05] mb-6 tracking-tight">
              Your money,
              <br />
              <span className="text-accent">always earning.</span>
            </h1>

            <p className="text-lg text-white/45 max-w-xl mx-auto mb-12 leading-relaxed font-body">
              The first non-custodial neobank on Solana. Earn DeFi yield automatically.
              Spend anywhere with Visa. You hold the keys.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono font-bold text-2xl text-white mb-1">{s.value}</div>
                <div className="text-xs text-white/35 font-body">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
