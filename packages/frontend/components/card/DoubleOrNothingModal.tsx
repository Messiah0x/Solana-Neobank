'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlipCurrency, FlipResult } from '@/lib/api';

interface DoubleOrNothingModalProps {
  amount: number;
  currency: FlipCurrency;
  executeFlip: () => Promise<FlipResult>;
  onClose: () => void;
  onSettled: (result: FlipResult) => void;
}

const LANDING_DURATION = 1.4;

function CoinDisc() {
  return (
    <div
      className="absolute inset-0 rounded-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 32% 26%, #FFFCF2 0%, #FFF6E0 14%, #F4E4C1 34%, #D4AF7F 62%, #B8893F 86%, #8B6914 100%)',
        boxShadow:
          'inset 0 6px 16px rgba(255,255,255,0.65), inset 0 -16px 30px rgba(0,0,0,0.45), inset 0 0 0 7px rgba(139,105,20,0.22)',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Reeded edge — fine radial ridges around the rim */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'repeating-conic-gradient(rgba(91,67,10,0.16) 0deg 1.2deg, transparent 1.2deg 4.8deg)',
          mixBlendMode: 'multiply',
        }}
      />
      {/* Inner embossed ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 10,
          border: '1.5px solid rgba(139,105,20,0.45)',
          boxShadow: 'inset 0 1px 5px rgba(255,255,255,0.55), inset 0 -2px 6px rgba(0,0,0,0.18)',
        }}
      />
      {/* Specular highlight */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '6%',
          left: '12%',
          width: '46%',
          height: '26%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.65)',
          filter: 'blur(8px)',
          transform: 'rotate(-25deg)',
        }}
      />
      {/* Lower rim shadow for roundness */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '4%',
          left: '18%',
          width: '64%',
          height: '20%',
          borderRadius: '50%',
          background: 'rgba(91,67,10,0.35)',
          filter: 'blur(10px)',
        }}
      />
    </div>
  );
}

type Phase = 'idle' | 'flipping' | 'result' | 'error';

export function DoubleOrNothingModal({ amount, currency, executeFlip, onClose, onSettled }: DoubleOrNothingModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [outcome, setOutcome] = useState<FlipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinFast, setSpinFast] = useState(false);
  const rotationRef = useRef(0);

  const symbol = currency === 'USDC' ? '$' : '';
  const suffix = currency === 'USDC' ? '' : ' SOL';
  const fmt = (n: number) => `${symbol}${n.toLocaleString('en-US', { maximumFractionDigits: 4 })}${suffix}`;

  // Keep the coin spinning while the bet is being signed, confirmed
  // on-chain, and resolved server-side — the duration is unknown.
  useEffect(() => {
    if (!spinFast) return;
    const interval = setInterval(() => {
      rotationRef.current += 360;
      setRotation(rotationRef.current);
    }, 450);
    return () => clearInterval(interval);
  }, [spinFast]);

  async function startFlip() {
    if (phase !== 'idle') return;
    setPhase('flipping');
    setSpinFast(true);
    try {
      const result = await executeFlip();
      setSpinFast(false);
      // Always land face-up (a multiple of 360) after a couple of extra
      // spins — the win/lose outcome is shown via the overlay, not the face.
      const base = Math.ceil(rotationRef.current / 360) * 360;
      const target = base + 3 * 360;
      rotationRef.current = target;
      setRotation(target);
      setTimeout(() => {
        setOutcome(result);
        setPhase('result');
      }, LANDING_DURATION * 1000);
    } catch (e) {
      setSpinFast(false);
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('error');
    }
  }

  function finish() {
    if (outcome) onSettled(outcome);
  }

  const dismissible = phase === 'idle' || phase === 'error';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(8,6,4,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={() => dismissible && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center max-h-[90dvh] overflow-y-auto theme-invert"
          style={{
            background: 'linear-gradient(160deg, #1C1610 0%, #100C08 100%)',
            border: '1px solid rgba(212,175,127,0.18)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent/70 mb-1">
            Double or Nothing
          </p>
          <h2 className="text-xl font-bold text-ivory mb-1">
            {fmt(amount)} on the line
          </h2>
          <p className="text-xs text-white/35 mb-6 leading-relaxed">
            {phase === 'idle' &&
              `Flip the coin to wager ${fmt(amount)}. You'll sign a real transfer to the house — call it right and ${fmt(amount * 2)} lands straight back in your wallet.`}
            {phase === 'flipping' && 'Approve the transaction in your wallet, then hold tight — the coin is in the air…'}
            {phase === 'result' && outcome?.result === 'win' && `Heads up! ${fmt(amount * 2)} just landed in your wallet.`}
            {phase === 'result' && outcome?.result === 'lose' && "So close — the house takes this round. Run it again?"}
            {phase === 'error' && (error ?? 'Something went wrong')}
          </p>

          <div style={{ perspective: 1000 }} className="mb-6 relative h-44 flex items-center justify-center">
            {/* Soft ambient glow beneath the coin for depth */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                width: 190,
                height: 190,
                background: 'radial-gradient(circle, rgba(212,175,127,0.35) 0%, rgba(212,175,127,0) 70%)',
                filter: 'blur(4px)',
              }}
            />
            {/* Cast shadow that contracts while the coin is airborne */}
            <motion.div
              className="absolute left-1/2 bottom-1 -translate-x-1/2 rounded-full pointer-events-none"
              style={{ width: 110, height: 16, background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)' }}
              animate={{ scaleX: spinFast ? [1, 0.55, 1] : 1, opacity: spinFast ? [0.6, 0.3, 0.6] : 0.6 }}
              transition={spinFast ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            />
            <motion.button
              type="button"
              onClick={startFlip}
              disabled={phase !== 'idle'}
              animate={{
                rotateX: rotation,
                y: spinFast ? [0, -22, 0] : 0,
              }}
              transition={
                spinFast
                  ? {
                      rotateX: { duration: 0.45, ease: 'linear' },
                      y: { duration: 0.45, repeat: Infinity, ease: 'easeInOut' },
                    }
                  : { duration: LANDING_DURATION, ease: [0.22, 0.68, 0, 1] }
              }
              whileHover={phase === 'idle' ? { scale: 1.04 } : undefined}
              whileTap={phase === 'idle' ? { scale: 0.97 } : undefined}
              className="relative w-36 h-36 rounded-full"
              style={{
                transformStyle: 'preserve-3d',
                cursor: phase === 'idle' ? 'pointer' : 'default',
                boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Coin edge — gives the disc visible thickness as it tilts */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  transform: 'translateZ(-6px) scale(0.985)',
                  background: 'linear-gradient(180deg, #C99B5A 0%, #8B6914 45%, #5C4410 100%)',
                }}
              />
              <CoinDisc />
              {/* Result overlay — fades in once the coin has landed */}
              <AnimatePresence>
                {phase === 'result' && outcome && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                  >
                    {outcome.result === 'win' ? (
                      <>
                        <span className="text-4xl font-black tracking-tight" style={{ color: '#3A2A0E', textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>2x</span>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-[#3A2A0E]">DOUBLE</span>
                      </>
                    ) : (
                      <>
                        <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#3A2A0E" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" d="M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.1-.7 1.7-1.6 2.3-.9.6-1.4 1.1-1.4 2.2M12 17h.01" />
                        </svg>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-[#3A2A0E]">NEXT TIME</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {phase === 'result' && outcome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: outcome.result === 'win' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${outcome.result === 'win' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-1">
                  {outcome.result === 'win' ? 'You called it' : 'Result'}
                </p>
                <p className={`text-2xl font-bold font-mono ${outcome.result === 'win' ? 'text-green-400' : 'text-amber-400/80'}`}>
                  {outcome.result === 'win' ? '+' : '-'}{fmt(amount)}
                </p>
                {outcome.result === 'win' && outcome.payoutSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${outcome.payoutSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-[11px] text-accent/70 hover:text-accent underline underline-offset-2"
                  >
                    View payout on explorer
                  </a>
                )}
              </div>
              <button
                onClick={finish}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-[#0A0A0A] hover:opacity-90 transition-opacity"
              >
                {outcome.result === 'win' ? 'Nice' : 'Got it'}
              </button>
            </motion.div>
          )}

          {phase === 'error' && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
            >
              Close
            </button>
          )}

          {phase === 'idle' && (
            <button
              onClick={onClose}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Cancel
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
