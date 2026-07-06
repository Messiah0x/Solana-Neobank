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
  /** 'transaction' frames the flip as undoing/doubling a specific past payment. */
  mode?: 'wager' | 'transaction';
}

const LANDING_DURATION = 1.4;

// Minute-tick ring drawn around the coin field — a small mint-style detail
// that reads as engraved metal rather than a flat graphic.
function TickRing({ color, opacity }: { color: string; opacity: number }) {
  return (
    <g stroke={color} strokeOpacity={opacity} strokeWidth="1.4" strokeLinecap="round">
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * 79;
        const y1 = 100 + Math.sin(a) * 79;
        const x2 = 100 + Math.cos(a) * 73;
        const y2 = 100 + Math.sin(a) * 73;
        return <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} />;
      })}
    </g>
  );
}

function CoinDisc() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
      <defs>
        <radialGradient id="hRim" cx="34%" cy="24%" r="90%">
          <stop offset="0%" stopColor="#FFF7E4" />
          <stop offset="26%" stopColor="#F4DFAF" />
          <stop offset="55%" stopColor="#DCB878" />
          <stop offset="78%" stopColor="#B8894A" />
          <stop offset="100%" stopColor="#6E4E1E" />
        </radialGradient>
        <radialGradient id="hField" cx="50%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#3A2E1C" />
          <stop offset="55%" stopColor="#221A0F" />
          <stop offset="100%" stopColor="#120C06" />
        </radialGradient>
        <linearGradient id="hMark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF7E0" />
          <stop offset="48%" stopColor="#F0D399" />
          <stop offset="100%" stopColor="#B4863C" />
        </linearGradient>
        <linearGradient id="hSheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="hGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#F0D08A" floodOpacity="0.5" />
        </filter>
        <filter id="hBlur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      <circle cx="100" cy="100" r="98" fill="none" stroke="#000000" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="96.5" fill="url(#hRim)" />
      <circle cx="100" cy="100" r="96.5" fill="none" stroke="#FFF7E4" strokeOpacity="0.55" strokeWidth="1.2" />
      {/* reeded edge */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="#5A3F17" strokeOpacity="0.45" strokeWidth="4" strokeDasharray="1.4 3.2" />
      {/* inner bevel + field */}
      <circle cx="100" cy="100" r="83" fill="url(#hField)" stroke="#5A3F17" strokeOpacity="0.6" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="83" fill="none" stroke="#FBE9C4" strokeOpacity="0.14" strokeWidth="1" />
      {/* guilloché concentric detail */}
      <circle cx="100" cy="100" r="76" fill="none" stroke="#D4AF7F" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="0.6 3" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#D4AF7F" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="0.6 4" />
      <TickRing color="#E9CC97" opacity={0.3} />
      {/* Avanor mark, true to the brand wordmark glyph */}
      <g filter="url(#hGlow)" transform="translate(100 104) scale(0.82) translate(-37.5 -50)">
        <path
          fill="url(#hMark)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M37.5 2 L0 98 L14 98 L37.5 22 L61 98 L75 98 L37.5 2 Z M37.5 62 L28 98 L47 98 Z"
        />
      </g>
      {/* specular sweep */}
      <ellipse cx="72" cy="46" rx="54" ry="30" fill="url(#hSheen)" filter="url(#hBlur)" transform="rotate(-22 72 46)" />
    </svg>
  );
}

// Tails face — a cool platinum treatment with a 2× mark so the two sides
// of the coin are unmistakably distinct as it lands.
function CoinDiscTails() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
      <defs>
        <radialGradient id="tRim" cx="34%" cy="24%" r="90%">
          <stop offset="0%" stopColor="#FBFCFF" />
          <stop offset="28%" stopColor="#D7DEE8" />
          <stop offset="58%" stopColor="#A9B4C2" />
          <stop offset="80%" stopColor="#7C8797" />
          <stop offset="100%" stopColor="#454E5C" />
        </radialGradient>
        <radialGradient id="tField" cx="50%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#26303C" />
          <stop offset="55%" stopColor="#171E27" />
          <stop offset="100%" stopColor="#0C1016" />
        </radialGradient>
        <linearGradient id="tMark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#DCE4EE" />
          <stop offset="100%" stopColor="#94A0AF" />
        </linearGradient>
        <linearGradient id="tSheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="tGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#BFD0E4" floodOpacity="0.5" />
        </filter>
        <filter id="tBlur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      <circle cx="100" cy="100" r="98" fill="none" stroke="#000000" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="96.5" fill="url(#tRim)" />
      <circle cx="100" cy="100" r="96.5" fill="none" stroke="#FBFCFF" strokeOpacity="0.55" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#37414F" strokeOpacity="0.45" strokeWidth="4" strokeDasharray="1.4 3.2" />
      <circle cx="100" cy="100" r="83" fill="url(#tField)" stroke="#37414F" strokeOpacity="0.6" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="83" fill="none" stroke="#E8EEF6" strokeOpacity="0.14" strokeWidth="1" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#AEBBCB" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="0.6 3" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#AEBBCB" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="0.6 4" />
      <TickRing color="#DCE4EE" opacity={0.3} />
      <g filter="url(#tGlow)">
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="66"
          fill="url(#tMark)"
        >
          2×
        </text>
      </g>
      <ellipse cx="72" cy="46" rx="54" ry="30" fill="url(#tSheen)" filter="url(#tBlur)" transform="rotate(-22 72 46)" />
    </svg>
  );
}

type Phase = 'idle' | 'flipping' | 'result' | 'error';

export function DoubleOrNothingModal({ amount, currency, executeFlip, onClose, onSettled, mode = 'wager' }: DoubleOrNothingModalProps) {
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
      // Land on the face that matches the actual outcome: heads (0°) for a
      // win, tails (180°) for a loss — the coin itself must agree with the
      // result, not just an overlay drawn on top of it.
      const base = Math.ceil(rotationRef.current / 360) * 360;
      const target = base + 3 * 360 + (result.result === 'lose' ? 180 : 0);
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
            {mode === 'transaction' ? 'Flip This Payment' : 'Double or Nothing'}
          </p>
          <h2 className="text-xl font-bold text-ivory mb-1">
            {mode === 'transaction' ? `Get it free, or pay double` : `${fmt(amount)} on the line`}
          </h2>
          <p className="text-xs text-white/35 mb-6 leading-relaxed">
            {phase === 'idle' && mode === 'transaction' &&
              `You'll sign a real transfer of ${fmt(amount)} to the house. Heads: you're fully refunded — this one's free. Tails: it's gone, and you've now paid ${fmt(amount * 2)} for it.`}
            {phase === 'idle' && mode === 'wager' &&
              `Flip the coin to wager ${fmt(amount)}. You'll sign a real transfer to the house — call it right and ${fmt(amount * 2)} lands straight back in your wallet.`}
            {phase === 'flipping' && 'Approve the transaction in your wallet, then hold tight — the coin is in the air…'}
            {phase === 'result' && outcome?.result === 'win' && mode === 'transaction' && `Heads! ${fmt(amount)} just landed back in your wallet — this one's free.`}
            {phase === 'result' && outcome?.result === 'win' && mode === 'wager' && `Heads up! ${fmt(amount * 2)} just landed in your wallet.`}
            {phase === 'result' && outcome?.result === 'lose' && mode === 'transaction' && `Tails — that payment just doubled to ${fmt(amount * 2)} total.`}
            {phase === 'result' && outcome?.result === 'lose' && mode === 'wager' && "So close — the house takes this round. Run it again?"}
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
                  transform: 'translateZ(-6px) scale(0.97)',
                  background: 'linear-gradient(180deg, #C99B5A 0%, #8B6914 45%, #5C4410 100%)',
                }}
              />
              <CoinDisc />
              <div className="absolute inset-0" style={{ transform: 'rotateX(180deg)' }}>
                <CoinDiscTails />
              </div>
              {/* Result overlay — fades in over the face once the coin has landed */}
              <AnimatePresence>
                {phase === 'result' && outcome && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute flex flex-col items-center justify-center gap-1.5 rounded-full"
                    style={{ inset: 16, background: 'rgba(12,9,6,0.94)' }}
                  >
                    {outcome.result === 'win' ? (
                      <>
                        <span className="text-4xl font-black tracking-tight" style={{ color: '#F4E4C1', textShadow: '0 0 18px rgba(212,175,127,0.5)' }}>
                          {mode === 'transaction' ? 'FREE' : '2x'}
                        </span>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-accent/80">
                          {mode === 'transaction' ? 'REFUNDED' : 'DOUBLE'}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#D4AF7F" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" d="M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.1-.7 1.7-1.6 2.3-.9.6-1.4 1.1-1.4 2.2M12 17h.01" />
                        </svg>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-accent/60">
                          {mode === 'transaction' ? 'DOUBLED' : 'NEXT TIME'}
                        </span>
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
                  {mode === 'transaction'
                    ? outcome.result === 'win' ? 'Refunded' : 'Charged double'
                    : outcome.result === 'win' ? 'You called it' : 'Result'}
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
