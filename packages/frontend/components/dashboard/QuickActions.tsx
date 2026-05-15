'use client';

import { motion } from 'framer-motion';

interface Action {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  onClick?: () => void;
  soon?: boolean;
}

const actions: Action[] = [
  {
    label: 'Add',
    color: 'text-accent',
    bg: 'bg-accent-muted',
    border: 'border-accent/20',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    label: 'Send',
    color: 'text-white/50',
    bg: 'bg-white/[0.04]',
    border: 'border-white/[0.08]',
    soon: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
  {
    label: 'Earn',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    label: 'More',
    color: 'text-white/50',
    bg: 'bg-white/[0.04]',
    border: 'border-white/[0.08]',
    soon: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
];

export function QuickActions() {
  return (
    <div className="px-4 pt-4 pb-1">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.93 }}
            onClick={action.onClick}
            className={`flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border ${action.bg} ${action.border} transition-all relative`}
          >
            <span className={action.color}>{action.icon}</span>
            <span className={`text-[11px] font-semibold ${action.color}`}>{action.label}</span>
            {action.soon && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background border border-white/10 flex items-center justify-center">
                <span className="text-[7px] text-white/30 font-bold">•</span>
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
