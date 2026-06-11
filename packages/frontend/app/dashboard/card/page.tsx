'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import useSWR from 'swr';
import { getPrivyUserInfo } from '@/lib/privy-utils';
import { getWalletBalance } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { AvanorLogo } from '@/components/brand/AvanorLogo';
import { CoinFlipModal } from '@/components/card/CoinFlipModal';

interface CardTransaction {
  id: string;
  merchant: string;
  amount: number;
  doubleOrNothing: boolean;
  result?: 'heads' | 'tails';
  date: string;
}

const MERCHANTS = ['Coffee Co.', 'Metro Transit', 'Quick Mart', 'Streamflix', 'The Corner Diner', 'Cloud Nine SaaS'];
const PRESET_AMOUNTS = [5, 12, 25, 50];
const TXN_STORAGE_KEY = 'avanor_card_txns';

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
  const { user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { name } = getPrivyUserInfo(user ?? null);
  const userId = user?.id ?? null;
  const { data: balance } = useSWR(
    userId ? `balance-${userId}` : null,
    () => getWalletBalance(userId!),
    { refreshInterval: 30_000 },
  );
  const [frozen, setFrozen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [spendAmount, setSpendAmount] = useState(PRESET_AMOUNTS[1]);
  const [doubleOrNothing, setDoubleOrNothing] = useState(false);
  const [pendingFlip, setPendingFlip] = useState<{ amount: number; merchant: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TXN_STORAGE_KEY);
      if (raw) setTransactions(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function persistTransactions(next: CardTransaction[]) {
    setTransactions(next);
    try {
      localStorage.setItem(TXN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function handleSimulatePurchase() {
    if (frozen) return;
    const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
    if (doubleOrNothing) {
      setPendingFlip({ amount: spendAmount, merchant });
      return;
    }
    const txn: CardTransaction = {
      id: crypto.randomUUID(),
      merchant,
      amount: spendAmount,
      doubleOrNothing: false,
      date: new Date().toISOString(),
    };
    persistTransactions([txn, ...transactions].slice(0, 20));
  }

  function handleFlipResolved(result: 'heads' | 'tails', finalAmount: number) {
    if (!pendingFlip) return;
    const txn: CardTransaction = {
      id: crypto.randomUUID(),
      merchant: pendingFlip.merchant,
      amount: finalAmount,
      doubleOrNothing: true,
      result,
      date: new Date().toISOString(),
    };
    persistTransactions([txn, ...transactions].slice(0, 20));
    setPendingFlip(null);
  }

  const displayName = name.toUpperCase() || 'AVANOR MEMBER';

  // Use the last 4 chars of the wallet address as the card's last 4 digits.
  // Fall back to a fixed placeholder so the card always looks complete.
  const walletAddress = wallets[0]?.address ?? '';
  const last4 = walletAddress.length >= 4
    ? walletAddress.slice(-4).toUpperCase()
    : '4242';

  // Full card number uses the last4 derived from wallet address
  const fullCardNumber = `4242  4242  4242  ${last4}`;
  const maskedCardNumber = `••••  ••••  ••••  ${last4}`;

  async function handleCopy() {
    if (frozen) return;
    try {
      await navigator.clipboard.writeText(fullCardNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-xl mx-auto">

            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">Payment</p>
              <h1 className="text-2xl font-bold text-ivory">Virtual Card</h1>
            </div>

            {/* Card visual */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl overflow-hidden mb-3"
              style={{
                background: frozen
                  ? 'linear-gradient(145deg, #181818 0%, #111111 40%, #0A0A0A 100%)'
                  : 'linear-gradient(145deg, #1C1610 0%, #130F0A 40%, #0A0A0A 100%)',
                border: frozen
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(212,175,127,0.18)',
                boxShadow: frozen
                  ? '0 32px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset'
                  : '0 32px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(212,175,127,0.1) inset',
                aspectRatio: '1.586',
                filter: frozen ? 'grayscale(1) brightness(0.65)' : 'none',
                transition: 'filter 0.4s ease, background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
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
                        {showDetails ? fullCardNumber : maskedCardNumber}
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
                      <p className="text-xs font-mono font-semibold text-white/65">•••</p>
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
                    style={{ background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(6px)' }}
                  >
                    <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.04]">
                      <svg className="w-7 h-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3M3 12h18m-18 0l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-white/60 tracking-wide">Card Frozen</p>
                    <p className="text-xs text-white/30">All transactions paused</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Copy card number row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="flex justify-end mb-4"
            >
              <button
                onClick={handleCopy}
                disabled={frozen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                  frozen
                    ? 'text-white/15 cursor-not-allowed'
                    : copied
                    ? 'text-accent bg-accent/10'
                    : 'text-white/35 hover:text-accent/70 hover:bg-white/[0.04]'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    Copy card number
                  </>
                )}
              </button>
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
                disabled={frozen}
              />
              <ControlButton
                icon={
                  frozen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3M3 12h18m-18 0l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3M3 12h18m-18 0l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
                    </svg>
                  )
                }
                label={frozen ? 'Unfreeze' : 'Freeze'}
                active={frozen}
                onClick={() => {
                  setFrozen(!frozen);
                  if (!frozen) setShowDetails(false);
                }}
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

            {/* Simulate purchase */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="rounded-2xl p-4 mb-6 border border-white/[0.06] bg-surface/40"
            >
              <p className="text-sm font-semibold text-ivory mb-1">Simulate a purchase</p>
              <p className="text-xs text-white/30 mb-4 leading-relaxed">
                Try out card spending with test transactions — no real funds involved.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSpendAmount(amt)}
                    disabled={frozen}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      spendAmount === amt
                        ? 'bg-accent text-[#0A0A0A]'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    } ${frozen ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setDoubleOrNothing((v) => !v)}
                disabled={frozen}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-4 border transition-all duration-200 ${
                  doubleOrNothing
                    ? 'border-accent/40 bg-accent/[0.08]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
                } ${frozen ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="text-left">
                  <p className={`text-sm font-semibold ${doubleOrNothing ? 'text-accent' : 'text-white/60'}`}>
                    Double or Nothing
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">Flip a coin — heads is free, tails costs double</p>
                </div>
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    doubleOrNothing ? 'bg-accent' : 'bg-white/15'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-background"
                    animate={{ x: doubleOrNothing ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </button>

              <button
                onClick={handleSimulatePurchase}
                disabled={frozen}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-opacity ${
                  frozen ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-accent text-[#0A0A0A] hover:opacity-90'
                }`}
              >
                {doubleOrNothing ? `Pay $${spendAmount} — Flip the coin` : `Pay $${spendAmount}`}
              </button>
            </motion.div>

            {/* Coin flip stats — provable transparency for Double or Nothing */}
            {transactions.some((t) => t.doubleOrNothing) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13, duration: 0.4 }}
                className="rounded-2xl p-4 mb-6 border border-white/[0.06] bg-surface/40"
              >
                {(() => {
                  const flips = transactions.filter((t) => t.doubleOrNothing);
                  const heads = flips.filter((t) => t.result === 'heads').length;
                  const tails = flips.length - heads;
                  const headsPct = Math.round((heads / flips.length) * 100);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-ivory">Your flip record</p>
                        <p className="text-[11px] text-white/30">{flips.length} flip{flips.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06] mb-3">
                        <div className="bg-green-400/70" style={{ width: `${headsPct}%` }} />
                        <div className="bg-red-400/60" style={{ width: `${100 - headsPct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-green-400/80 font-semibold">{heads} heads · free</span>
                        <span className="text-white/25">fair 50/50 odds</span>
                        <span className="text-red-400/80 font-semibold">{tails} tails · 2x</span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Premium launch notice */}
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
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-accent/90">Virtual card</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
                      style={{ background: 'rgba(212,175,127,0.12)', color: 'rgba(212,175,127,0.7)', border: '1px solid rgba(212,175,127,0.2)' }}
                    >
                      Coming Q3 2026
                    </span>
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">
                    Spend your Solana balance anywhere Visa is accepted. Zero FX fees, instant settlement, real-time notifications.
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
                {
                  label: 'Monthly spend',
                  value: `$${transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`,
                  sub: transactions.length ? `${transactions.length} simulated transaction${transactions.length === 1 ? '' : 's'}` : 'No limit set',
                },
                {
                  label: 'Available',
                  value: `$${(balance?.usdc ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  sub: balance?.usdc ? 'USDC balance' : 'Add funds to spend',
                },
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-3">Transactions</p>
              {transactions.length === 0 ? (
                <div
                  className="rounded-2xl border border-white/[0.06] py-12 px-6 flex flex-col items-center text-center"
                  style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)' }}
                >
                  {/* Decorative card illustration */}
                  <div className="relative mb-5">
                    <div
                      className="w-16 h-10 rounded-xl border"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212,175,127,0.08) 0%, rgba(212,175,127,0.03) 100%)',
                        border: '1px solid rgba(212,175,127,0.15)',
                      }}
                    />
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-16 h-10 rounded-xl border"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    />
                    <div className="absolute top-2 left-2.5 flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/25" />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/15" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white/30">No card transactions yet</p>
                  <p className="text-xs text-white/18 mt-1.5 leading-relaxed">
                    Simulate a purchase above to see it here
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.05] overflow-hidden">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/75 truncate">{t.merchant}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-white/30">
                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                          {t.doubleOrNothing && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${
                                t.result === 'heads'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {t.result === 'heads' ? 'FREE' : '2x'}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-mono text-sm font-bold text-white/70 flex-shrink-0 ml-3">
                        -${t.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </main>
      </div>
      <MobileNav />

      {pendingFlip && (
        <CoinFlipModal
          amount={pendingFlip.amount}
          onClose={() => setPendingFlip(null)}
          onResolved={handleFlipResolved}
        />
      )}
    </div>
  );
}
