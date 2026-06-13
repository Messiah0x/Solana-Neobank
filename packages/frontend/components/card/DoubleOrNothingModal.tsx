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
    <div className="absolute inset-0 rounded-full" style={{ backfaceVisibility: 'hidden' }}>
      {/* Thick metallic bezel — gives the disc real edge thickness */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #FFF6E0 0%, #E8C97A 28%, #B8893F 52%, #8B6914 78%, #F4E4C1 100%)',
          boxShadow:
            'inset 0 3px 5px rgba(255,255,255,0.7), inset 0 -4px 8px rgba(0,0,0,0.55), 0 1px 1px rgba(255,255,255,0.25)',
        }}
      />
      {/* Recessed face */}
      <div
        className="absolute rounded-full overflow-hidden flex items-center justify-center"
        style={{
          inset: 11,
          background: 'linear-gradient(160deg, #1C1610 0%, #0C0906 100%)',
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7), inset 0 -2px 4px rgba(212,175,127,0.12)',
        }}
      >
        {/* Sheen sweep across the face */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '4%',
            left: '8%',
            width: '52%',
            height: '30%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
            filter: 'blur(10px)',
            transform: 'rotate(-25deg)',
          }}
        />
        {/* Avanor monogram */}
        <svg viewBox="0 0 100 100" className="relative w-[58%] h-[58%]">
          <defs>
            <linearGradient id="coinGold" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF6E0" />
              <stop offset="50%" stopColor="#D4AF7F" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            <linearGradient id="coinArrow" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D4AF7F" />
              <stop offset="100%" stopColor="#FFF6E0" />
            </linearGradient>
          </defs>
          <path
            fill="url(#coinGold)"
            d="M50 11 L21 89 L32 89 L41 65 L59 65 L68 89 L79 89 Z M44.5 55 L50 39.5 L55.5 55 Z"
          />
          <path
            fill="url(#coinArrow)"
            d="M37 70 L52 70 L52 58 L60 58 L46 42 L32 58 L40 58 Z"
            transform="rotate(45 46 58)"
          />
        </svg>
      </div>
      {/* Reeded edge ridges around the bezel */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'repeating-conic-gradient(rgba(91,67,10,0.25) 0deg 1deg, transparent 1deg 4deg)',
          mixBlendMode: 'multiply',
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
              className="relative w-40 h-40 rounded-full"
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
              {/* Result overlay — fades in over the face once the coin has landed */}
              <AnimatePresence>
                {phase === 'result' && outcome && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute flex flex-col items-center justify-center gap-1.5 rounded-full"
                    style={{ inset: 11, background: 'rgba(12,9,6,0.92)' }}
                  >
                    {outcome.result === 'win' ? (
                      <>
                        <span className="text-4xl font-black tracking-tight" style={{ color: '#F4E4C1', textShadow: '0 0 18px rgba(212,175,127,0.5)' }}>2x</span>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-accent/80">DOUBLE</span>
                      </>
                    ) : (
                      <>
                        <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#D4AF7F" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" d="M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.1-.7 1.7-1.6 2.3-.9.6-1.4 1.1-1.4 2.2M12 17h.01" />
                        </svg>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-accent/60">NEXT TIME</span>
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
