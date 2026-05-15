'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { AvanorLogo } from '@/components/brand/AvanorLogo';

function VisaWordmark() {
  return (
    <svg viewBox="0 0 78 25" className="h-6 w-auto" aria-label="Visa">
      <path
        fill="rgba(212,175,127,0.9)"
        d="M30.5 0.8L19.8 24.2h-6.9L7.6 6.5c-.3-1.2-.6-1.7-1.7-2.2C4 3.5 1.9 2.8 0 2.4l.2-.8h11.1c1.4 0 2.7 1 3 2.6l2.7 14.5L24 1.6l6.5-.8zm25.8 15.7c0-6.3-8.7-6.7-8.7-9.5 0-.9.8-1.8 2.6-2 .9-.1 3.3-.2 6 1.1l1.1-4.9C55.9.5 53.5 0 50.6 0c-6.5 0-11 3.4-11.1 8.4-.1 3.6 3.3 5.6 5.7 6.8 2.6 1.2 3.4 2 3.4 3.1 0 1.7-2 2.4-3.9 2.4-3.3.1-5.2-.9-6.7-1.5l-1.2 5.3c1.5.7 4.4 1.3 7.4 1.3 7 0 11.5-3.4 11.5-8.3zm17.3 7.7H78L72.5.8h-6c-1.4 0-2.5.8-3 2L53.7 24.2h6.9l1.4-3.8h8.5l.8 3.8zm-7.4-9.1l3.5-9.6 2 9.6h-5.5zM37.5.8l-5.5 23.4h-6.6L31 .8h6.5z"
      />
    </svg>
  );
}

function ContactlessIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M8.5 8.5c-.9.9-1.5 2.1-1.5 3.5s.6 2.6 1.5 3.5" stroke="rgba(212,175,127,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 6.5c-1.5 1.5-2.5 3.5-2.5 5.5s1 4 2.5 5.5" stroke="rgba(212,175,127,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 4.5c-2.1 2.1-3.5 5-3.5 8s1.4 5.9 3.5 8" stroke="rgba(212,175,127,0.7)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg className="w-10 h-8" viewBox="0 0 40 32" fill="none">
      <rect x="0.5" y="0.5" width="39" height="31" rx="5.5" fill="rgba(212,175,127,0.12)" stroke="rgba(212,175,127,0.25)" />
      <rect x="14" y="0" width="2" height="8" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="24" y="0" width="2" height="8" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="14" y="24" width="2" height="8" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="24" y="24" width="2" height="8" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="0" y="11" width="8" height="2" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="0" y="19" width="8" height="2" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="32" y="11" width="8" height="2" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="32" y="19" width="8" height="2" rx="1" fill="rgba(212,175,127,0.3)" />
      <rect x="8" y="8" width="24" height="16" rx="2" fill="rgba(212,175,127,0.08)" stroke="rgba(212,175,127,0.2)" />
      <rect x="12" y="12" width="6" height="8" rx="1" fill="rgba(212,175,127,0.15)" />
      <rect x="20" y="12" width="8" height="4" rx="1" fill="rgba(212,175,127,0.1)" />
      <rect x="20" y="18" width="8" height="2" rx="1" fill="rgba(212,175,127,0.1)" />
    </svg>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function ControlButton({ icon, label, active, onClick, disabled }: ControlButtonProps) {
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200 ${
        active
          ? 'border-accent/30 bg-accent/[0.08]'
          : 'border-white/[0.07] bg-surface/50 hover:bg-white/[0.04]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className={active ? 'text-accent' : 'text-white/40'}>{icon}</span>
      <span className={`text-[11px] font-semibold tracking-wide ${active ? 'text-accent' : 'text-white/35'}`}>
        {label}
      </span>
    </motion.button>
  );
}

export default function CardPage() {
  const { data: session } = useSession();
  const [frozen, setFrozen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const displayName = session?.user?.name?.toUpperCase() ?? 'AVANOR MEMBER';

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-xl mx-auto lg:mx-0">

            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">Payment</p>
              <h1 className="text-2xl font-bold text-ivory">Virtual Card</h1>
            </div>

            {/* Card visual */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl overflow-hidden mb-5"
              style={{
                background: 'linear-gradient(145deg, #1C1610 0%, #130F0A 40%, #0A0A0A 100%)',
                border: '1px solid rgba(212,175,127,0.18)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(212,175,127,0.1) inset',
                aspectRatio: '1.586',
              }}
            >
              <div
                className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,175,127,0.12) 0%, transparent 65%)', transform: 'translate(25%, -25%)' }}
              />
              <div
                className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,175,127,0.06) 0%, transparent 65%)', transform: 'translate(-20%, 20%)' }}
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(212,175,127,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,127,1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              <div className="relative h-full p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <AvanorLogo size={22} showWordmark />
                  <ContactlessIcon />
                </div>
                <div className="flex items-center gap-4">
                  <ChipIcon />
                </div>
                <div className="space-y-3">
                  <div className="font-mono text-base tracking-[0.18em] text-white/75">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showDetails ? 'shown' : 'hidden'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showDetails ? '4242  4242  4242  4242' : '••••  ••••  ••••  4242'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Card Holder</p>
                      <p className="text-xs font-semibold text-white/65 tracking-wider">{displayName}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Expires</p>
                      <p className="text-xs font-mono font-semibold text-white/65">{showDetails ? '12/28' : '••/••'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">CVV</p>
                      <p className="text-xs font-mono font-semibold text-white/65">{showDetails ? '737' : '•••'}</p>
                    </div>
                    <VisaWordmark />
                  </div>
                </div>
              </div>

              {/* Frozen overlay */}
              <AnimatePresence>
                {frozen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}
                  >
                    <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.04]">
                      <svg className="w-7 h-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3M3 12h18m-18 0l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-white/50 tracking-wide">Card Frozen</p>
                    <p className="text-xs text-white/25">Tap Freeze to restore</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="grid grid-cols-4 gap-2.5 mb-5"
            >
              <ControlButton
                icon={
                  showDetails ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                }
                label={showDetails ? 'Hide' : 'Details'}
                active={showDetails}
                onClick={() => setShowDetails(!showDetails)}
              />
              <ControlButton
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3M3 12h18m-18 0l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
                  </svg>
                }
                label={frozen ? 'Unfreeze' : 'Freeze'}
                active={frozen}
                onClick={() => setFrozen(!frozen)}
              />
              <ControlButton
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                }
                label="Add funds"
                disabled
              />
              <ControlButton
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                  </svg>
                }
                label="More"
                disabled
              />
            </motion.div>

            {/* Coming soon notice */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="rounded-2xl p-4 mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,127,0.06) 0%, rgba(212,175,127,0.02) 100%)',
                border: '1px solid rgba(212,175,127,0.12)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent/90">Physical & virtual Visa cards — coming soon</p>
                  <p className="text-xs text-white/30 mt-1 leading-relaxed">
                    Spend your Solana balance anywhere Visa is accepted. Zero FX fees. Real-time spending notifications.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Spend stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="grid grid-cols-2 gap-3 mb-6"
            >
              {[
                { label: 'Monthly spend', value: '$0.00', sub: 'No limit set' },
                { label: 'Available', value: '$0.00', sub: 'Add funds to spend' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-surface/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">{s.label}</p>
                  <p className="font-mono text-xl font-bold text-white/70">{s.value}</p>
                  <p className="text-[11px] text-white/25 mt-1">{s.sub}</p>
                </div>
              ))}
            </motion.div>

            {/* Card transactions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-3">Card Transactions</p>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 py-12 px-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white/30">No transactions yet</p>
                <p className="text-xs text-white/20 mt-1">Card transactions will appear here</p>
              </div>
            </motion.div>

          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
