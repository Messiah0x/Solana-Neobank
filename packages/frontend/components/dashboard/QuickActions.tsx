'use client';

import { motion } from 'framer-motion';

interface Props {
  onReceive?: () => void;
  onSend?: () => void;
  onEarn?: () => void;
  onSwap?: () => void;
  hasWallet?: boolean;
}

export function QuickActions({ onReceive, onSend, onEarn, onSwap, hasWallet }: Props) {
  const actions = [
    {
      label: 'Receive',
      color: 'text-accent',
      bg: 'bg-accent-muted',
      border: 'border-accent/20',
      onClick: hasWallet ? onReceive : undefined,
      disabled: !hasWallet,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12l-7.5 7.5L4.5 12M12 19.5V4.5" />
        </svg>
      ),
    },
    {
      label: 'Send',
      color: hasWallet ? 'text-white/70' : 'text-white/30',
      bg: hasWallet ? 'bg-white/[0.06]' : 'bg-white/[0.04]',
      border: hasWallet ? 'border-white/[0.12]' : 'border-white/[0.08]',
      onClick: hasWallet ? onSend : undefined,
      disabled: !hasWallet,
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
      onClick: onEarn,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
    },
    {
      label: 'Swap',
      color: hasWallet ? 'text-purple-400' : 'text-white/30',
      bg: hasWallet ? 'bg-purple-500/10' : 'bg-white/[0.04]',
      border: hasWallet ? 'border-purple-500/20' : 'border-white/[0.08]',
      onClick: hasWallet ? onSwap : undefined,
      disabled: !hasWallet,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 pt-4 pb-1">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, i) => {
          const isDisabled = 'disabled' in action ? !!action.disabled : false;
          const hasClick = 'onClick' in action && !!action.onClick;
          const isSoon = 'soon' in action && !!action.soon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileTap={hasClick && !isDisabled ? { scale: 0.93 } : undefined}
              onClick={'onClick' in action ? action.onClick : undefined}
              disabled={isDisabled}
              className={`flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border ${action.bg} ${action.border} transition-all relative ${isDisabled ? 'opacity-40 cursor-not-allowed' : hasClick ? 'hover:opacity-80 cursor-pointer' : ''}`}
            >
              <span className={action.color}>{action.icon}</span>
              <span className={`text-[11px] font-semibold ${action.color}`}>{action.label}</span>
              {isSoon && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background border border-white/10 flex items-center justify-center">
                  <span className="text-[7px] text-white/30 font-bold">•</span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
