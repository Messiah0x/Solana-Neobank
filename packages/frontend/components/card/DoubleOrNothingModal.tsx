'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayCurrency } from '@/lib/hooks/usePlayBalance';

interface DoubleOrNothingModalProps {
  amount: number;
  currency: PlayCurrency;
  onClose: () => void;
  onResolved: (result: 'win' | 'lose') => void;
}

const SPIN_DURATION = 2.4;

function CoinFace({ side }: { side: 'win' | 'lose' }) {
  return (
    <div
      className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1"
      style={{
        background: 'linear-gradient(145deg, #F4E4C1 0%, #D4AF7F 45%, #8B6914 100%)',
        border: '4px solid rgba(212,175,127,0.9)',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.5)',
        backfaceVisibility: 'hidden',
        transform: side === 'lose' ? 'rotateY(180deg)' : undefined,
      }}
    >
      {side === 'win' ? (
        <>
          <span className="text-3xl font-black text-[#1A1410]">2x</span>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#1A1410]">WIN</span>
        </>
      ) : (
        <>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#1A1410" strokeWidth={3}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#1A1410]">LOSE</span>
        </>
      )}
    </div>
  );
}

export function DoubleOrNothingModal({ amount, currency, onClose, onResolved }: DoubleOrNothingModalProps) {
  const [phase, setPhase] = useState<'idle' | 'flipping' | 'result'>('idle');
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [rotation, setRotation] = useState(0);

  const symbol = currency === 'usdc' ? '$' : '';
  const suffix = currency === 'usdc' ? '' : ' SOL';
  const fmt = (n: number) => `${symbol}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}`;

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
    const isWin = flipCoin();
    const outcome: 'win' | 'lose' = isWin ? 'win' : 'lose';
    // Land showing the correct face: win = multiple of 360, lose = 180 + multiple of 360
    const fullSpins = 5;
    const target = fullSpins * 360 + (isWin ? 0 : 180);
    setRotation(target);
    setPhase('flipping');
    setTimeout(() => {
      setResult(outcome);
      setPhase('result');
    }, SPIN_DURATION * 1000);
  }

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
            {fmt(amount)} bet
          </h2>
          <p className="text-xs text-white/35 mb-6 leading-relaxed">
            {phase === 'idle' && 'Tap the coin to flip. Win doubles your bet, lose forfeits it. Fair 50/50 odds.'}
            {phase === 'flipping' && 'Flipping...'}
            {phase === 'result' && result === 'win' && `You won! +${fmt(amount)} added to your play balance.`}
            {phase === 'result' && result === 'lose' && `Tough luck — -${fmt(amount)} from your play balance.`}
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
              <CoinFace side="win" />
              <CoinFace side="lose" />
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
                  background: result === 'win' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${result === 'win' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-1">
                  Result
                </p>
                <p className={`text-2xl font-bold font-mono ${result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                  {result === 'win' ? '+' : '-'}{fmt(amount)}
                </p>
              </div>
              <button
                onClick={() => onResolved(result)}
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
