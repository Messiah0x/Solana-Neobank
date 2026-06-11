'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinFlipModalProps {
  amount: number;
  onClose: () => void;
  onResolved: (result: 'heads' | 'tails', finalAmount: number) => void;
}

const SPIN_DURATION = 2.4;

function CoinFace({ side }: { side: 'heads' | 'tails' }) {
  return (
    <div
      className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1"
      style={{
        background: 'linear-gradient(145deg, #F4E4C1 0%, #D4AF7F 45%, #8B6914 100%)',
        border: '4px solid rgba(212,175,127,0.9)',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.5)',
        backfaceVisibility: 'hidden',
        transform: side === 'tails' ? 'rotateY(180deg)' : undefined,
      }}
    >
      {side === 'heads' ? (
        <>
          <svg width={40} height={52} viewBox="0 0 75 100" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M37.5 2 L0 98 L14 98 L37.5 22 L61 98 L75 98 L37.5 2 Z M37.5 62 L28 98 L47 98 Z"
              fill="#1A1410"
            />
          </svg>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#1A1410]">FREE</span>
        </>
      ) : (
        <>
          <span className="text-3xl font-black text-[#1A1410]">2x</span>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#1A1410]">DOUBLE</span>
        </>
      )}
    </div>
  );
}

export function CoinFlipModal({ amount, onClose, onResolved }: CoinFlipModalProps) {
  const [phase, setPhase] = useState<'idle' | 'flipping' | 'result'>('idle');
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [rotation, setRotation] = useState(0);

  function flipCoin(): boolean {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % 2 === 0;
    }
    return Math.random() < 0.5;
  }

  function flip() {
    if (phase !== 'idle') return;
    const isHeads = flipCoin();
    const outcome: 'heads' | 'tails' = isHeads ? 'heads' : 'tails';
    // Land showing the correct face: heads = multiple of 360, tails = 180 + multiple of 360
    const fullSpins = 5;
    const target = fullSpins * 360 + (isHeads ? 0 : 180);
    setRotation(target);
    setPhase('flipping');
    setTimeout(() => {
      setResult(outcome);
      setPhase('result');
    }, SPIN_DURATION * 1000);
  }

  const finalAmount = result === 'tails' ? amount * 2 : result === 'heads' ? 0 : amount;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(8,6,4,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={() => phase !== 'flipping' && onClose()}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/70 mb-1">
            Double or Nothing
          </p>
          <h2 className="text-xl font-bold text-ivory mb-1">
            ${amount.toFixed(2)} purchase
          </h2>
          <p className="text-xs text-white/35 mb-6 leading-relaxed">
            {phase === 'idle' && 'Tap the coin to flip. Heads = free. Tails = pay double.'}
            {phase === 'flipping' && 'Flipping...'}
            {phase === 'result' && result === 'heads' && "Heads! This one's on the house."}
            {phase === 'result' && result === 'tails' && 'Tails! Double charge applied.'}
          </p>

          <div style={{ perspective: 800 }} className="mb-6">
            <motion.button
              type="button"
              onClick={flip}
              disabled={phase !== 'idle'}
              animate={{ rotateY: rotation }}
              transition={{ duration: SPIN_DURATION, ease: [0.22, 0.68, 0, 1] }}
              whileHover={phase === 'idle' ? { scale: 1.04 } : undefined}
              whileTap={phase === 'idle' ? { scale: 0.97 } : undefined}
              className="relative w-32 h-32 rounded-full"
              style={{
                transformStyle: 'preserve-3d',
                cursor: phase === 'idle' ? 'pointer' : 'default',
              }}
            >
              <CoinFace side="heads" />
              <CoinFace side="tails" />
            </motion.button>
          </div>

          {phase === 'result' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: result === 'heads' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${result === 'heads' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">
                  Final charge
                </p>
                <p className={`text-2xl font-bold font-mono ${result === 'heads' ? 'text-green-400' : 'text-red-400'}`}>
                  ${finalAmount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => onResolved(result, finalAmount)}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-[#0A0A0A] hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </motion.div>
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
