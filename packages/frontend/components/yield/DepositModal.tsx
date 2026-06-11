'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/lib/useToast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
  usdcBalance: number;
  apy: number;
}

function ProjectionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-white/40">{label}</span>
      <span className="font-mono text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export function DepositModal({ isOpen, onClose, onConfirm, usdcBalance, apy }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const { toast } = useToast();

  const amount = amountInput === '' ? usdcBalance : parseFloat(amountInput);
  const amountInvalid = isNaN(amount) || amount <= 0 || amount > usdcBalance;
  const dailyYield = (amount * (apy / 100)) / 365;
  const monthlyYield = (amount * (apy / 100)) / 12;
  const yearlyYield = amount * (apy / 100);

  async function handleConfirm() {
    if (amountInvalid) return;
    setConfirming(true);
    setError(null);
    try {
      await onConfirm(amount);
      toast.success(`Deposited $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC — now earning ${apy.toFixed(1)}% APY`);
      setAmountInput('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setError(msg);
      toast.error(`Deposit failed: ${msg}`);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => !confirming && onClose()}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] rounded-t-3xl p-8 pb-12 max-w-lg mx-auto max-h-[92dvh] overflow-y-auto theme-invert"
            style={{ background: 'linear-gradient(145deg, #161310 0%, #0F0D0A 100%)' }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-8" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg">Start Earning</h2>
                <p className="text-white/40 text-xs">Deposit into Marginfi lending pool</p>
              </div>
            </div>

            {/* Amount */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/35 uppercase tracking-wider font-semibold">Depositing</p>
                <button
                  type="button"
                  onClick={() => setAmountInput('')}
                  disabled={confirming}
                  className="text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors disabled:opacity-40"
                >
                  Max
                </button>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-baseline gap-1 flex-1 min-w-0">
                  <span className="font-mono font-bold text-3xl text-white/60">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    disabled={confirming}
                    className={`w-full bg-transparent font-mono font-bold text-3xl outline-none placeholder:text-white/80 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      amountInput !== '' && amountInvalid ? 'text-error' : ''
                    }`}
                  />
                </div>
                <span className="text-white/40 text-sm font-medium mb-1 flex-shrink-0">USDC</span>
              </div>
              {amountInput !== '' && amountInvalid && (
                <p className="text-[11px] text-error mt-2">
                  {amount > usdcBalance
                    ? `You have $${usdcBalance.toFixed(2)} USDC available`
                    : 'Enter a valid amount'}
                </p>
              )}
            </div>

            {/* APY badge */}
            <div className="flex items-center justify-between rounded-xl bg-accent-muted border border-accent/15 px-4 py-3 mb-4">
              <span className="text-sm text-white/60">APY via Marginfi</span>
              <span className="font-mono font-bold text-accent text-lg">{apy.toFixed(1)}%</span>
            </div>

            {/* Projections */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 mb-6">
              <ProjectionRow label="Daily earnings" value={`$${dailyYield.toFixed(4)}`} />
              <ProjectionRow label="Monthly earnings" value={`$${monthlyYield.toFixed(2)}`} />
              <ProjectionRow label="Yearly earnings" value={`$${yearlyYield.toFixed(2)}`} />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => !confirming && onClose()}
                disabled={confirming}
                className="flex-1 py-3.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/20 transition-all text-sm font-semibold disabled:opacity-40"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={confirming || amountInvalid}
                className="flex-[2] py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {confirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Deposit'
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
