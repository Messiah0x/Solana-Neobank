'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/lib/useToast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
  depositedAmount: number;
}

export function WithdrawModal({ isOpen, onClose, onConfirm, depositedAmount }: Props) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount > 0 && parsedAmount <= depositedAmount;

  function handleClose() {
    if (submitting) return;
    setAmount('');
    setError(null);
    setSuccess(false);
    onClose();
  }

  async function handleConfirm() {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(parsedAmount);
      setSuccess(true);
      toast.success(`Withdrew $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC successfully`);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(msg);
      toast.error(`Withdrawal failed: ${msg}`);
    } finally {
      setSubmitting(false);
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/[0.08] rounded-t-3xl p-8 pb-12 max-w-lg mx-auto max-h-[85dvh] overflow-y-auto theme-invert"
            style={{ background: 'var(--gradient-modal-dark)', paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-8" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg">Withdraw Funds</h2>
                <p className="text-white/40 text-xs">Withdraw USDC from MarginFi lending pool</p>
              </div>
            </div>

            {/* Available balance */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 mb-4">
              <p className="text-xs text-white/35 uppercase tracking-wider font-semibold mb-2">Available to Withdraw</p>
              <div className="flex items-end justify-between">
                <span className="font-mono font-bold text-3xl">
                  ${depositedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-white/40 text-sm font-medium mb-1">USDC</span>
              </div>
            </div>

            {/* Amount input */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/35 uppercase tracking-wider font-semibold">Amount</p>
                <button
                  type="button"
                  onClick={() => setAmount(String(depositedAmount))}
                  className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  Withdraw All
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-lg font-mono">$</span>
                <input
                  type="number"
                  min="0.01"
                  max={depositedAmount}
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setError(null);
                    setAmount(e.target.value);
                  }}
                  placeholder="0.00"
                  disabled={submitting || success}
                  className="flex-1 bg-transparent font-mono text-2xl font-bold outline-none placeholder-white/15 text-white disabled:opacity-50"
                />
                <span className="text-white/40 text-sm font-medium">USDC</span>
              </div>
              {parsedAmount > depositedAmount && parsedAmount > 0 && (
                <p className="text-xs text-error mt-2">Amount exceeds available balance</p>
              )}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl border border-error/20 bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 px-4 py-3 rounded-xl border border-success/20 bg-success/10 text-success text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Withdrawal successful!
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/20 transition-all text-sm font-semibold disabled:opacity-40"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={submitting || !isValid || success}
                className="flex-[2] py-3.5 rounded-xl bg-error/80 hover:bg-error disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Withdrawal'
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
