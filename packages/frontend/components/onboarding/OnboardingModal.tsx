'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AvanorLogo } from '@/components/brand/AvanorLogo';
import { useAirdrop } from '@/lib/hooks/useAirdrop';
import { shortAddr } from '@/lib/format';

interface Props {
  publicKey: string;
  userId: string;
  apy?: number;
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

const stepTransition = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export function OnboardingModal({ publicKey, apy = 5.2, onComplete }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [solReceived, setSolReceived] = useState(false);
  const [usdcReceived, setUsdcReceived] = useState(false);

  const truncated = publicKey ? shortAddr(publicKey, 6) : '';

  function dismiss() {
    localStorage.setItem('avanor_onboarded', '1');
    onComplete();
  }

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goToYield() {
    localStorage.setItem('avanor_onboarded', '1');
    onComplete();
    router.push('/dashboard/yield');
  }

  const { solState, requestSol: handleSolAirdrop } = useAirdrop(publicKey, {
    errorTimeoutMs: 8000,
    onSuccess: () => setSolReceived(true),
  });
  const { usdcState, requestUsdc: handleUsdcAirdrop } = useAirdrop(publicKey, {
    errorTimeoutMs: 8000,
    onSuccess: () => setUsdcReceived(true),
  });

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[92dvh] overflow-y-auto theme-invert"
        style={{
          background: 'var(--gradient-hero-dark)',
          border: '1px solid rgba(212,175,127,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold glow top-right */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,127,0.12) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />

        {/* X close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors"
          aria-label="Close onboarding"
        >
          <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative p-8">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i + 1 === step ? 24 : 6,
                  opacity: i + 1 === step ? 1 : i + 1 < step ? 0.6 : 0.25,
                }}
                transition={{ duration: 0.25 }}
                className="h-1.5 rounded-full bg-accent"
              />
            ))}
          </div>

          {/* Step content */}
          <div className="overflow-hidden" style={{ minHeight: 300 }}>
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepTransition}
                  className="flex flex-col items-center text-center"
                >
                  {/* Logo */}
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,127,0.15) 0%, rgba(212,175,127,0.05) 100%)',
                      border: '1px solid rgba(212,175,127,0.20)',
                    }}
                  >
                    <AvanorLogo size={40} showWordmark={false} />
                  </div>

                  <h1 className="font-heading font-bold text-2xl text-ivory mb-3 tracking-tight">
                    Welcome to Avanor
                  </h1>
                  <p className="text-sm text-white/45 leading-relaxed mb-8 max-w-xs">
                    Your Solana neobank. Earn yield on USDC, send money instantly, and manage your on-chain finances — all in one place.
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 justify-center mb-8">
                    {[
                      { icon: '⚡', label: 'Instant USDC transfers' },
                      { icon: '📈', label: `${apy.toFixed(1)}% APY yield` },
                      { icon: '🔐', label: 'Self-custody wallet' },
                    ].map((f) => (
                      <span
                        key={f.label}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/50"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <span>{f.icon}</span>
                        {f.label}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={goNext}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm text-[#0A0A0A] transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'var(--gradient-gold)' }}
                  >
                    Get Started
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepTransition}
                  className="flex flex-col"
                >
                  <h2 className="font-heading font-bold text-xl text-ivory mb-2 tracking-tight">
                    Fund your wallet
                  </h2>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">
                    You&apos;re on Solana devnet. Grab some test tokens to try everything out — they&apos;re free!
                  </p>

                  {/* Wallet address chip */}
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-6"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                    <span className="font-mono text-xs text-white/40 flex-1 truncate">{truncated}</span>
                    <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">Devnet</span>
                  </div>

                  {/* Airdrop buttons */}
                  <div className="space-y-3 mb-6">
                    {/* SOL */}
                    <div
                      className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${solReceived ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(212,175,127,0.10)', border: '1px solid rgba(212,175,127,0.15)' }}
                        >
                          <span className="text-sm">◎</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/80">1 SOL</p>
                          <p className="text-xs text-white/30">Needed for transactions</p>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {solReceived ? (
                          <motion.span
                            key="sol-done"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1 text-xs text-success font-semibold"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Received
                          </motion.span>
                        ) : solState === 'error' ? (
                          <motion.a
                            key="sol-err"
                            href={`https://faucet.solana.com/?address=${publicKey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-400/80 hover:text-red-400 font-medium underline underline-offset-2 text-right"
                          >
                            Limit hit — use faucet.solana.com
                          </motion.a>
                        ) : (
                          <motion.button
                            key="sol-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleSolAirdrop}
                            disabled={solState === 'loading'}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            style={{ background: 'rgba(212,175,127,0.12)', color: '#D4AF7F', border: '1px solid rgba(212,175,127,0.20)' }}
                          >
                            {solState === 'loading' ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin block" />
                                Requesting…
                              </span>
                            ) : (
                              'Get test SOL'
                            )}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* USDC */}
                    <div
                      className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${usdcReceived ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.20)' }}
                        >
                          <span className="text-sm font-bold text-blue-400">$</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/80">10 USDC</p>
                          <p className="text-xs text-white/30">For yield & transfers</p>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {usdcReceived ? (
                          <motion.span
                            key="usdc-done"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1 text-xs text-success font-semibold"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Received
                          </motion.span>
                        ) : usdcState === 'error' ? (
                          <motion.a
                            key="usdc-err"
                            href="https://faucet.circle.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-400/80 hover:text-red-400 font-medium underline underline-offset-2 text-right"
                          >
                            Down — use faucet.circle.com
                          </motion.a>
                        ) : (
                          <motion.button
                            key="usdc-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleUsdcAirdrop}
                            disabled={usdcState === 'loading'}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            style={{ background: 'rgba(212,175,127,0.12)', color: '#D4AF7F', border: '1px solid rgba(212,175,127,0.20)' }}
                          >
                            {usdcState === 'loading' ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin block" />
                                Requesting…
                              </span>
                            ) : (
                              'Get test USDC'
                            )}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Live balance hint */}
                  {(solReceived || usdcReceived) && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-success/70 text-center mb-4"
                    >
                      Balances update live on your dashboard
                    </motion.p>
                  )}

                  <button
                    onClick={goNext}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm text-[#0A0A0A] transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'var(--gradient-gold)' }}
                  >
                    Next
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepTransition}
                  className="flex flex-col items-center text-center"
                >
                  {/* Yield icon */}
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
                      border: '1px solid rgba(16,185,129,0.20)',
                    }}
                  >
                    <svg className="w-9 h-9 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>

                  <h2 className="font-heading font-bold text-xl text-ivory mb-2 tracking-tight">
                    Start earning
                  </h2>
                  <p className="text-sm text-white/45 leading-relaxed mb-6 max-w-xs">
                    Deposit USDC to MarginFi and earn yield automatically. No lock-up, withdraw anytime.
                  </p>

                  {/* APY callout */}
                  <div
                    className="inline-flex items-center gap-3 px-5 py-4 rounded-2xl mb-8"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.18)',
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-mono font-bold text-3xl text-success">{apy.toFixed(1)}%</span>
                      <span className="text-xs text-success/60 font-semibold uppercase tracking-wider">APY</span>
                    </div>
                    <div className="w-px h-10 bg-success/15" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white/60">via MarginFi</p>
                      <p className="text-xs text-white/30">Solana DeFi protocol</p>
                    </div>
                  </div>

                  <button
                    onClick={goToYield}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm text-[#0A0A0A] transition-all hover:opacity-90 active:scale-[0.98] mb-3"
                    style={{ background: 'var(--gradient-gold)' }}
                  >
                    Go to Yield
                  </button>

                  <button
                    onClick={dismiss}
                    className="text-xs text-white/25 hover:text-white/45 transition-colors py-1"
                  >
                    Skip for now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step counter */}
          <p className="text-center text-[11px] text-white/20 mt-6 font-medium">
            {step} of {TOTAL_STEPS}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
