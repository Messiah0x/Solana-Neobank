'use client';

import { useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastContext, Toast } from '@/lib/useToast';

const BORDER_COLOR: Record<Toast['type'], string> = {
  success: '#22c55e', // green-500
  error: '#ef4444',   // red-500
  info: '#3b82f6',    // blue-500
};

const ICON: Record<Toast['type'], React.ReactNode> = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const TEXT_COLOR: Record<Toast['type'], string> = {
  success: '#4ade80',
  error: '#f87171',
  info: '#60a5fa',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const borderColor = BORDER_COLOR[toast.type];
  const textColor = TEXT_COLOR[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[260px] max-w-[340px] shadow-2xl"
      style={{
        background: 'rgba(18, 16, 14, 0.96)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Type icon */}
      <span style={{ color: textColor }}>{ICON[toast.type]}</span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-white/80 leading-snug">
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    /*
     * Bottom-center on mobile (< sm), bottom-right on desktop (sm+).
     * z-[200] sits above modals (z-50).
     */
    <div className="fixed z-[200] flex flex-col gap-2 pointer-events-none bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => removeToast(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
