'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Yield',
    href: '/dashboard/yield',
    comingSoon: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Card',
    href: '/dashboard/card',
    comingSoon: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Transactions',
    href: '/dashboard/transactions',
    comingSoon: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 bottom-0 w-60 border-r border-white/[0.06] bg-background flex flex-col z-40"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06] flex-shrink-0">
        <span className="font-heading font-bold text-xl tracking-tight">
          sol<span className="text-accent">bank</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.comingSoon ? '#' : item.href}
              onClick={(e) => item.comingSoon && e.preventDefault()}
            >
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? 'bg-accent-muted text-accent border border-accent/15'
                    : item.comingSoon
                    ? 'text-white/25 cursor-not-allowed'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                <span className={active ? 'text-accent' : ''}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.comingSoon && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/25 font-semibold tracking-wide">
                    SOON
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Network badge */}
      <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-white/50 font-medium">Solana Devnet</p>
            <p className="text-[10px] text-white/25 mt-0.5">Phase 1 — Core</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
