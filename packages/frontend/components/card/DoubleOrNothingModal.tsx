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
      // Land on the correct face: win shows the front (multiple of 360),
      // lose shows the back (180 offset), with a couple of extra spins.
      const base = Math.ceil(rotationRef.current / 360) * 360;
      const target = base + 2 * 360 + (result.result === 'lose' ? 180 : 0);
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/70 mb-1">
            Double or Nothing
          </p>
          <h2 className="text-xl font-bold text-ivory mb-1">
            {fmt(amount)} bet
          </h2>
          <p className="text-xs text-white/35 mb-6 leading-relaxed">
            {phase === 'idle' &&
              `Tap the coin to bet ${fmt(amount)}. You'll sign a real transfer to the house wallet — win pays ${fmt(amount * 2)} back, lose forfeits your bet.`}
            {phase === 'flipping' && 'Approve the transaction in your wallet, then hold tight — settling on-chain…'}
            {phase === 'result' && outcome?.result === 'win' && `You won! ${fmt(amount * 2)} has been sent to your wallet.`}
            {phase === 'result' && outcome?.result === 'lose' && 'Tough luck — the house keeps this one.'}
            {phase === 'error' && (error ?? 'Something went wrong')}
          </p>

          <div style={{ perspective: 800 }} className="mb-6">
            <motion.button
              type="button"
              onClick={startFlip}
              disabled={phase !== 'idle'}
              animate={{ rotateY: rotation }}
              transition={
                spinFast
                  ? { duration: 0.45, ease: 'linear' }
                  : { duration: LANDING_DURATION, ease: [0.22, 0.68, 0, 1] }
              }
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
                  Result
                </p>
                <p className={`text-2xl font-bold font-mono ${outcome.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
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
                Done
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
