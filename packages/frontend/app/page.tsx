'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AvanorLogo } from '@/components/brand/AvanorLogo';

const stats = [
  { label: 'Settlement speed', value: '<400ms' },
  { label: 'APY after fees', value: 'Up to 7.6%' },
  { label: 'Network', value: 'Solana' },
];

const features = [
  {
    title: 'You hold the keys',
    body: 'Your wallet is created the moment you sign in — and it belongs to you. Avanor is non-custodial by architecture: we cannot access, freeze, or move your funds. Ever.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    ),
  },
  {
    title: 'Earning is the default',
    body: 'Idle USDC routes into MarginFi lending with one tap and starts compounding immediately. No lockups, withdraw any time. We take 10% of the yield — never your principal.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    ),
  },
  {
    title: 'Bank-grade, chain-fast',
    body: 'Solana settles in under half a second for under a cent. Payments, deposits, and withdrawals feel like sending a message — because on Solana, they basically are.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    ),
  },
];

const steps = [
  { n: '01', title: 'Sign in', body: 'One tap with Google or GitHub. A self-custodied Solana wallet is created for you instantly — no seed phrase to write down.' },
  { n: '02', title: 'Deposit', body: 'Fund your account with USDC. On the current devnet beta, the built-in faucet gives you test funds to try everything risk-free.' },
  { n: '03', title: 'Earn', body: 'Move any amount into yield. Watch it accrue in real time, and withdraw whenever you like. Your keys, your money, always.' },
];

const securityPoints = [
  'Cryptographically verified identity on every API request',
  'Non-custodial: private keys never touch our servers',
  'Transactions signed on your device, verified on-chain',
  'Hardened headers, rate limiting & 24/7 error monitoring',
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

      {/* Features */}
      <section className="relative z-10 px-6 py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/70 mb-3">Why Avanor</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-ivory">A bank account that works for you</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-muted border border-accent/15 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    {f.icon}
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-lg text-ivory mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/70 mb-3">How it works</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-ivory">Three steps. No seed phrase.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="font-mono font-bold text-4xl text-accent/30 mb-3">{s.n}</div>
                <h3 className="font-heading font-bold text-lg text-ivory mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="relative z-10 px-6 py-24 border-t border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto rounded-3xl p-8 md:p-10 relative overflow-hidden"
          style={{ background: 'var(--gradient-card-dark)', border: '1px solid rgba(212,175,127,0.18)' }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,127,0.1) 0%, transparent 65%)', transform: 'translate(25%, -25%)' }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/70 mb-3">Security first</p>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-ivory mb-6">Built like a bank should be</h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {securityPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-white/55">
                  <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24 border-t border-white/[0.06] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-ivory mb-6">Ready to put your money to work?</h2>
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
        </motion.div>
      </section>

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
