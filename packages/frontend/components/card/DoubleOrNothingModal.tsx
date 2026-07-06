'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion';
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

// Minute-tick ring — a mint-style detail that reads as engraved metal.
// Deliberately filter-free: iOS Safari rasterizes SVG filter regions at low
// resolution, which is what made the mark look pixelated.
function TickRing({ color, opacity }: { color: string; opacity: number }) {
  return (
    <g stroke={color} strokeWidth="1.4" strokeLinecap="round">
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const long = i % 3 === 0;
        const r1 = 79;
        const r2 = long ? 71 : 74.5;
        return (
          <line
            key={i}
            x1={(100 + Math.cos(a) * r1).toFixed(1)}
            y1={(100 + Math.sin(a) * r1).toFixed(1)}
            x2={(100 + Math.cos(a) * r2).toFixed(1)}
            y2={(100 + Math.sin(a) * r2).toFixed(1)}
            strokeOpacity={long ? opacity : opacity * 0.55}
          />
        );
      })}
    </g>
  );
}

// Heads — a warm champagne-gold medallion carrying the Avanor monogram.
function HeadsFace() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full block">
      <defs>
        <radialGradient id="hRim" cx="34%" cy="22%" r="92%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="24%" stopColor="#F3DCA6" />
          <stop offset="52%" stopColor="#D9B577" />
          <stop offset="76%" stopColor="#AE7F3E" />
          <stop offset="100%" stopColor="#5E4118" />
        </radialGradient>
        <radialGradient id="hField" cx="50%" cy="28%" r="88%">
          <stop offset="0%" stopColor="#43341F" />
          <stop offset="52%" stopColor="#241B0F" />
          <stop offset="100%" stopColor="#0F0A05" />
        </radialGradient>
        <linearGradient id="hMark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFBEE" />
          <stop offset="46%" stopColor="#F2D79E" />
          <stop offset="100%" stopColor="#B0823A" />
        </linearGradient>
        <radialGradient id="hSheen" cx="38%" cy="26%" r="46%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4D890" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F4D890" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hOcc" cx="50%" cy="90%" r="52%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="99" fill="none" stroke="#000000" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="97.5" fill="url(#hRim)" />
      <circle cx="100" cy="100" r="97.5" fill="none" stroke="#FFF8E7" strokeOpacity="0.6" strokeWidth="1.2" />
      {/* reeded edge */}
      <circle cx="100" cy="100" r="90.5" fill="none" stroke="#5A3F17" strokeOpacity="0.5" strokeWidth="4" strokeDasharray="1.3 3" />
      {/* recessed field */}
      <circle cx="100" cy="100" r="83" fill="url(#hField)" stroke="#5A3F17" strokeOpacity="0.65" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="83" fill="url(#hOcc)" />
      <circle cx="100" cy="100" r="83" fill="none" stroke="#FBE9C4" strokeOpacity="0.16" strokeWidth="1" />
      {/* guilloché detail */}
      <circle cx="100" cy="100" r="65" fill="none" stroke="#E4C588" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="0.5 3.5" />
      <TickRing color="#EBD09B" opacity={0.34} />
      {/* soft aura + crisp monogram */}
      <ellipse cx="100" cy="103" rx="42" ry="48" fill="url(#hAura)" />
      <g transform="translate(100 105) scale(0.86) translate(-37.5 -50)">
        <path
          fill="url(#hMark)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M37.5 2 L0 98 L14 98 L37.5 22 L61 98 L75 98 L37.5 2 Z M37.5 62 L28 98 L47 98 Z"
        />
      </g>
      {/* specular sweep (gradient, no filter) */}
      <ellipse cx="76" cy="52" rx="62" ry="44" fill="url(#hSheen)" transform="rotate(-20 76 52)" />
    </svg>
  );
}

// Tails — a cool platinum medallion marked 2×.
function TailsFace() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full block">
      <defs>
        <radialGradient id="tRim" cx="34%" cy="22%" r="92%">
          <stop offset="0%" stopColor="#FCFDFF" />
          <stop offset="26%" stopColor="#DAE1EB" />
          <stop offset="56%" stopColor="#AAB5C4" />
          <stop offset="80%" stopColor="#78838F" />
          <stop offset="100%" stopColor="#3D4653" />
        </radialGradient>
        <radialGradient id="tField" cx="50%" cy="28%" r="88%">
          <stop offset="0%" stopColor="#2A3542" />
          <stop offset="52%" stopColor="#19212B" />
          <stop offset="100%" stopColor="#0A0E14" />
        </radialGradient>
        <linearGradient id="tMark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E4EAF2" />
          <stop offset="100%" stopColor="#9DA9B8" />
        </linearGradient>
        <radialGradient id="tSheen" cx="38%" cy="26%" r="46%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9D6E8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#C9D6E8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tOcc" cx="50%" cy="90%" r="52%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="99" fill="none" stroke="#000000" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="97.5" fill="url(#tRim)" />
      <circle cx="100" cy="100" r="97.5" fill="none" stroke="#FCFDFF" strokeOpacity="0.6" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="90.5" fill="none" stroke="#37414F" strokeOpacity="0.5" strokeWidth="4" strokeDasharray="1.3 3" />
      <circle cx="100" cy="100" r="83" fill="url(#tField)" stroke="#37414F" strokeOpacity="0.65" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="83" fill="url(#tOcc)" />
      <circle cx="100" cy="100" r="83" fill="none" stroke="#E8EEF6" strokeOpacity="0.16" strokeWidth="1" />
      <circle cx="100" cy="100" r="65" fill="none" stroke="#B9C6D6" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="0.5 3.5" />
      <TickRing color="#D3DEEC" opacity={0.34} />
      <ellipse cx="100" cy="100" rx="46" ry="40" fill="url(#tAura)" />
      <text
        x="101"
        y="103"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="62"
        letterSpacing="-2"
        fill="url(#tMark)"
      >
        2×
      </text>
      <ellipse cx="76" cy="52" rx="62" ry="44" fill="url(#tSheen)" transform="rotate(-20 76 52)" />
    </svg>
  );
}

type Phase = 'idle' | 'flipping' | 'result' | 'error';

// A promise-returning tween of a motion value — version-robust (onComplete
// fires on every framer-motion build we support).
function tween(value: MotionValue<number>, to: number | number[], opts: Record<string, unknown>) {
  return new Promise<void>((resolve) => {
    animate(value, to as never, { ...opts, onComplete: () => resolve() });
  });
}

export function DoubleOrNothingModal({ amount, currency, executeFlip, onClose, onSettled, mode = 'wager' }: DoubleOrNothingModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [outcome, setOutcome] = useState<FlipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [face, setFace] = useState<'heads' | 'tails'>('heads');
  const flippingRef = useRef(false);

  // The coin's vertical squash drives everything: the face flattens toward the
  // edge, and the milled edge fades in as it turns side-on. No CSS 3D /
  // backface-visibility (which iOS fails to composite for inline SVG).
  const scaleY = useMotionValue(1);
  const edgeOpacity = useTransform(scaleY, [0.12, 0.34, 0.64], [1, 0.85, 0]);
  const edgeScaleX = useTransform(scaleY, [0.08, 1], [1, 0.9]);

  const symbol = currency === 'USDC' ? '$' : '';
  const suffix = currency === 'USDC' ? '' : ' SOL';
  const fmt = (n: number) => `${symbol}${n.toLocaleString('en-US', { maximumFractionDigits: 4 })}${suffix}`;

  const won = outcome?.result === 'win';

  const edgeBg =
    face === 'heads'
      ? 'linear-gradient(180deg, rgba(255,247,224,0.7) 0%, rgba(212,175,127,0.25) 42%, rgba(94,65,24,0.75) 100%), repeating-linear-gradient(90deg, #F0D69C 0 2px, #6E4E1E 2px 4px)'
      : 'linear-gradient(180deg, rgba(252,253,255,0.7) 0%, rgba(170,181,196,0.25) 42%, rgba(61,70,83,0.75) 100%), repeating-linear-gradient(90deg, #E4EAF2 0 2px, #3D4653 2px 4px)';

  async function tumble() {
    while (flippingRef.current) {
      await tween(scaleY, 0.08, { duration: 0.13, ease: 'easeInOut' });
      if (!flippingRef.current) break;
      setFace((f) => (f === 'heads' ? 'tails' : 'heads'));
      await tween(scaleY, 1, { duration: 0.13, ease: 'easeInOut' });
    }
  }

  async function startFlip() {
    if (phase !== 'idle') return;
    setPhase('flipping');
    flippingRef.current = true;
    const spin = tumble();
    try {
      const result = await executeFlip();
      flippingRef.current = false;
      await spin;
      // Decisive landing on the face that matches the outcome, with an
      // overshoot bounce for weight.
      await tween(scaleY, 0.08, { duration: 0.12, ease: 'easeIn' });
      setFace(result.result === 'win' ? 'heads' : 'tails');
      await tween(scaleY, [0.08, 1.12, 0.95, 1], { duration: 0.52, times: [0, 0.55, 0.8, 1], ease: 'easeOut' });
      setOutcome(result);
      setPhase('result');
    } catch (e) {
      flippingRef.current = false;
      await spin.catch(() => {});
      await tween(scaleY, 1, { duration: 0.15, ease: 'easeOut' });
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
        style={{ background: 'rgba(8,6,4,0.88)', backdropFilter: 'blur(10px)' }}
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
            background: 'radial-gradient(120% 90% at 50% 0%, #241C13 0%, #16110B 46%, #0E0A06 100%)',
            border: '1px solid rgba(212,175,127,0.18)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent/70 mb-1.5">
            {mode === 'transaction' ? 'Flip This Payment' : 'Double or Nothing'}
          </p>
          <h2 className="text-[22px] leading-tight font-bold text-ivory mb-1.5">
            {mode === 'transaction' ? 'Get it free, or pay double' : `${fmt(amount)} on the line`}
          </h2>
          <p className="text-xs text-white/40 mb-6 leading-relaxed max-w-[19rem]">
            {phase === 'idle' && mode === 'transaction' &&
              `Sign a real ${fmt(amount)} transfer to the house. Heads, you're fully refunded — this one's free. Tails, it's gone and you've paid ${fmt(amount * 2)} in total.`}
            {phase === 'idle' && mode === 'wager' &&
              `Wager ${fmt(amount)} on a fair 50/50. Heads pays ${fmt(amount * 2)} straight back to your wallet. Tails, the house keeps it.`}
            {phase === 'flipping' && 'Approve the transfer in your wallet — the coin is in the air…'}
            {phase === 'result' && won && mode === 'transaction' && `Heads. ${fmt(amount)} is back in your wallet — this one's on the house.`}
            {phase === 'result' && won && mode === 'wager' && `Heads. ${fmt(amount * 2)} just landed in your wallet.`}
            {phase === 'result' && !won && mode === 'transaction' && `Tails. That payment just doubled to ${fmt(amount * 2)}.`}
            {phase === 'result' && !won && mode === 'wager' && 'Tails. The house takes this one — run it back?'}
            {phase === 'error' && (error ?? 'Something went wrong')}
          </p>

          {/* Coin stage */}
          <div className="mb-5 relative h-48 w-48 flex items-center justify-center">
            {/* Ambient base glow — tints to the outcome on result */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 208, height: 208 }}
              animate={{
                background:
                  phase === 'result'
                    ? won
                      ? 'radial-gradient(circle, rgba(74,222,128,0.34) 0%, rgba(74,222,128,0) 66%)'
                      : 'radial-gradient(circle, rgba(248,180,110,0.30) 0%, rgba(248,180,110,0) 66%)'
                    : 'radial-gradient(circle, rgba(212,175,127,0.30) 0%, rgba(212,175,127,0) 68%)',
                scale: phase === 'result' ? [0.7, 1.15, 1] : 1,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            {/* Idle breathing halo to signal the coin is tappable */}
            {phase === 'idle' && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ width: 176, height: 176, border: '1px solid rgba(212,175,127,0.35)' }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Airborne float wrapper (separate from the flip squash) */}
            <motion.div
              className="relative w-40 h-40"
              animate={phase === 'flipping' ? { y: [0, -16, 0] } : { y: 0 }}
              transition={
                phase === 'flipping'
                  ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            >
              {/* Cast shadow on the "ground" */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                style={{
                  bottom: -26,
                  width: 108,
                  height: 15,
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 72%)',
                }}
                animate={{ scale: phase === 'flipping' ? [1, 0.7, 1] : 1, opacity: phase === 'flipping' ? [0.55, 0.3, 0.55] : 0.55 }}
                transition={phase === 'flipping' ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
              />

              {/* Milled coin edge — revealed as the coin turns side-on, giving
                  real 3D thickness at mid-flip. Sits behind the face. */}
              <motion.div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: 150,
                  height: 34,
                  x: '-50%',
                  y: '-50%',
                  borderRadius: '50%',
                  opacity: edgeOpacity,
                  scaleX: edgeScaleX,
                  backgroundImage: edgeBg,
                  boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -3px 5px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.45)',
                }}
              />

              <motion.button
                type="button"
                onClick={startFlip}
                disabled={phase !== 'idle'}
                whileHover={phase === 'idle' ? { scale: 1.04 } : undefined}
                whileTap={phase === 'idle' ? { scale: 0.96 } : undefined}
                className="relative w-40 h-40 rounded-full block"
                style={{
                  scaleY,
                  transformOrigin: 'center',
                  cursor: phase === 'idle' ? 'pointer' : 'default',
                  filter: 'drop-shadow(0 16px 34px rgba(0,0,0,0.55))',
                }}
              >
                {face === 'heads' ? <HeadsFace /> : <TailsFace />}
              </motion.button>
            </motion.div>
          </div>

          {phase === 'idle' && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/60 mb-4 animate-pulse">
              Tap the coin to flip
            </p>
          )}

          {phase === 'result' && outcome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div
                className="rounded-2xl p-4 mb-4 flex items-center justify-between"
                style={{
                  background: won ? 'rgba(34,197,94,0.09)' : 'rgba(248,180,110,0.08)',
                  border: `1px solid ${won ? 'rgba(34,197,94,0.28)' : 'rgba(248,180,110,0.24)'}`,
                }}
              >
                <div className="text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-0.5">
                    {mode === 'transaction'
                      ? won ? 'Refunded — free' : 'Charged double'
                      : won ? 'You called it' : "House's round"}
                  </p>
                  <p className={`text-2xl font-bold font-mono tabular-nums ${won ? 'text-green-400' : 'text-amber-300/90'}`}>
                    {won ? '+' : '−'}{fmt(amount)}
                  </p>
                </div>
                <span
                  className="text-[11px] font-black tracking-[0.18em] px-2.5 py-1 rounded-full"
                  style={{
                    color: won ? '#4ade80' : '#f8b46e',
                    background: won ? 'rgba(74,222,128,0.12)' : 'rgba(248,180,110,0.12)',
                  }}
                >
                  {won ? 'HEADS' : 'TAILS'}
                </span>
              </div>
              {won && outcome.payoutSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${outcome.payoutSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-3 text-[11px] text-accent/70 hover:text-accent underline underline-offset-2"
                >
                  View payout on explorer ↗
                </a>
              )}
              <button
                onClick={finish}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-[#0A0A0A] hover:opacity-90 transition-opacity"
              >
                {won ? 'Collect' : 'Done'}
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
