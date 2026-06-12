'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind classes for padding/sizing of the sheet (e.g. "p-8 pb-12"). */
  contentClassName?: string;
  /** Margin below the drag handle, e.g. "mb-8". */
  handleClassName?: string;
  /** Minimum bottom padding reserved for the safe-area inset, e.g. "3rem". */
  safeAreaBottom?: string;
}

export function BottomSheetModal({
  isOpen,
  onClose,
  children,
  contentClassName = 'p-6 pb-8',
  handleClassName = 'mb-5',
  safeAreaBottom = '2rem',
}: Props) {
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
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={`fixed bottom-0 left-0 right-0 z-[60] border-t border-white/[0.08] rounded-t-3xl max-w-lg mx-auto max-h-[85dvh] overflow-y-auto theme-invert ${contentClassName}`}
            style={{ background: 'var(--gradient-modal-dark)', paddingBottom: `max(${safeAreaBottom}, env(safe-area-inset-bottom))` }}
          >
            {/* Handle bar */}
            <div className={`w-10 h-1 bg-white/10 rounded-full mx-auto ${handleClassName}`} />

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
