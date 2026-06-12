'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AvanorLogo } from '@/components/brand/AvanorLogo';

const stats = [
  { label: 'Settlement speed', value: '<400ms' },
  { label: 'APY after fees', value: 'Up to 7.6%' },
  { label: 'Network', value: 'Solana' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,127,0.06) 0%, transparent 60%)' }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl flex items-center px-6 justify-between">
        <AvanorLogo size={28} showWordmark />
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-[#0A0A0A] text-sm font-semibold rounded-lg transition-colors"
          >
            Launch App
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
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent-muted text-accent text-xs font-semibold mb-10 tracking-widest uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Live on Solana Devnet
            </motion.div>

            <h1 className="font-heading font-bold text-5xl md:text-7xl leading-[1.05] mb-6 tracking-tight text-ivory">
              Your money,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--gradient-gold)' }}
              >
                always earning.
              </span>
            </h1>

            <p className="text-lg text-white/40 max-w-xl mx-auto mb-12 leading-relaxed font-body">
              The first non-custodial neobank on Solana. Earn DeFi yield automatically.
              Spend anywhere with Visa. You hold the keys.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/auth/signin">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3.5 font-semibold rounded-xl transition-colors text-sm text-[#0A0A0A]"
                  style={{ background: 'var(--gradient-gold)' }}
                >
                  Launch App
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
                <div className="font-mono font-bold text-2xl text-accent mb-1">{s.value}</div>
                <div className="text-xs text-white/30 font-body">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="relative z-10 py-6 px-6 text-center">
        <p className="text-[11px] text-white/20 leading-relaxed max-w-md mx-auto mb-4">
          Avanor is in open beta on Solana Devnet — no real funds are involved at this stage.
          Yield is variable and provided by the MarginFi protocol; Avanor charges a 10% performance
          fee on yield earned, never on your principal.
        </p>
        <div className="flex items-center justify-center gap-5 text-[11px] text-white/25">
          <Link href="/legal/terms" className="hover:text-white/50 transition-colors">Terms of Service</Link>
          <span className="text-white/10">·</span>
          <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
