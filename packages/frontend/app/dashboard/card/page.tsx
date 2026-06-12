'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import useSWR from 'swr';
import { getPrivyUserInfo } from '@/lib/privy-utils';
import { getWalletBalance, getFlipHouse, getFlipHistory, type FlipCurrency, type FlipResult } from '@/lib/api';
import { useCoinFlip } from '@/lib/useCoinFlip';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { AvanorLogo } from '@/components/brand/AvanorLogo';
import { DoubleOrNothingModal } from '@/components/card/DoubleOrNothingModal';

const BET_PRESETS: Record<FlipCurrency, number[]> = {
  USDC: [1, 5, 10, 25],
  SOL: [0.05, 0.1, 0.25, 0.5],
};

function VisaWordmark() {
  return (
    <svg viewBox="0 0 78 25" className="h-6 w-auto" aria-label="Visa">
      <path
        fill="rgba(255,255,255,0.4)"
        d="M30.5 0.8L19.8 24.2h-6.9L7.6 6.5c-.3-1.2-.6-1.7-1.7-2.2C4 3.5 1.9 2.8 0 2.4l.2-.8h11.1c1.4 0 2.7 1 3 2.6l2.7 14.5L24 1.6l6.5-.8zm25.8 15.7c0-6.3-8.7-6.7-8.7-9.5 0-.9.8-1.8 2.6-2 .9-.1 3.3-.2 6 1.1l1.1-4.9C55.9.5 53.5 0 50.6 0c-6.5 0-11 3.4-11.1 8.4-.1 3.6 3.3 5.6 5.7 6.8 2.6 1.2 3.4 2 3.4 3.1 0 1.7-2 2.4-3.9 2.4-3.3.1-5.2-.9-6.7-1.5l-1.2 5.3c1.5.7 4.4 1.3 7.4 1.3 7 0 11.5-3.4 11.5-8.3zm17.3 7.7H78L72.5.8h-6c-1.4 0-2.5.8-3 2L53.7 24.2h6.9l1.4-3.8h8.5l.8 3.8zm-7.4-9.1l3.5-9.6 2 9.6h-5.5zM37.5.8l-5.5 23.4h-6.6L31 .8h6.5z"
      />
    </svg>
  );
}

function ContactlessIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M8.5 8.5c-.9.9-1.5 2.1-1.5 3.5s.6 2.6 1.5 3.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 6.5c-1.5 1.5-2.5 3.5-2.5 5.5s1 4 2.5 5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 4.5c-2.1 2.1-3.5 5-3.5 8s1.4 5.9 3.5 8" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg className="w-10 h-8" viewBox="0 0 40 32" fill="none">
      <rect x="0.5" y="0.5" width="39" height="31" rx="5.5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
      <rect x="14" y="0" width="2" height="8" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="24" y="0" width="2" height="8" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="14" y="24" width="2" height="8" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="24" y="24" width="2" height="8" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="0" y="11" width="8" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="0" y="19" width="8" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="32" y="11" width="8" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="32" y="19" width="8" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="8" y="8" width="24" height="16" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
      <rect x="12" y="12" width="6" height="8" rx="1" fill="rgba(255,255,255,0.07)" />
      <rect x="20" y="12" width="8" height="4" rx="1" fill="rgba(255,255,255,0.05)" />
      <rect x="20" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.05)" />
    </svg>
  );
}

function fmtAmount(n: number, currency: FlipCurrency) {
  if (currency === 'USDC') {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 4 })} SOL`;
}

export default function CardPage() {
  const { user } = usePrivy();
  const { name } = getPrivyUserInfo(user ?? null);
  const displayName = (name || 'AVANOR MEMBER').toUpperCase();
  const userId = user?.id ?? null;

  const { flip, hasWallet } = useCoinFlip(userId);

  const { data: balance, mutate: mutateBalance } = useSWR(
    userId ? `balance-${userId}` : null,
    () => getWalletBalance(userId!),
    { refreshInterval: 30_000 },
  );
  const { data: house } = useSWR('flip-house', getFlipHouse, { refreshInterval: 60_000 });
  const { data: history, mutate: mutateHistory } = useSWR(
    userId ? `flips-${userId}` : null,
    () => getFlipHistory(userId!),
  );

  const [currency, setCurrency] = useState<FlipCurrency>('USDC');
  const [betAmount, setBetAmount] = useState(BET_PRESETS.USDC[1]);
  const [pendingFlip, setPendingFlip] = useState<{ currency: FlipCurrency; amount: number } | null>(null);

  const walletBalance = currency === 'USDC' ? balance?.usdc ?? 0 : balance?.sol ?? 0;
  const maxBet = house?.enabled ? house.maxBet?.[currency] ?? 0 : 0;
  const gameLive = Boolean(house?.enabled && hasWallet);
  const presets = BET_PRESETS[currency];

  const betTooHigh = betAmount > walletBalance || betAmount > maxBet;
  const canFlip = gameLive && betAmount > 0 && !betTooHigh;

  function selectCurrency(next: FlipCurrency) {
    setCurrency(next);
    setBetAmount(BET_PRESETS[next][1]);
  }

  function handleSettled(_result: FlipResult) {
    setPendingFlip(null);
    mutateBalance();
    mutateHistory();
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

            {/* Card visual — greyed out, coming soon */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl overflow-hidden mb-3 theme-invert"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a 0%, #121212 40%, #0A0A0A 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.03) inset',
                aspectRatio: '1.586',
                filter: 'grayscale(1)',
              }}
            >
              <div className="relative h-full p-6 flex flex-col justify-between opacity-40">
                <div className="flex items-start justify-between">
                  <AvanorLogo size={22} showWordmark />
                  <ContactlessIcon />
                </div>
                <div className="flex items-center gap-4">
                  <ChipIcon />
                </div>
                <div className="space-y-3">
                  <div className="font-mono text-base tracking-[0.18em] text-white/40">
                    ••••  ••••  ••••  ••••
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">Card Holder</p>
                      <p className="text-xs font-semibold text-white/40 tracking-wider">{displayName}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">Expires</p>
                      <p className="text-xs font-mono font-semibold text-white/40">••/••</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">CVV</p>
                      <p className="text-xs font-mono font-semibold text-white/40">•••</p>
                    </div>
                    <VisaWordmark />
                  </div>
                </div>
              </div>

              {/* Coming soon overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(10,10,10,0.45)', backdropFilter: 'blur(2px)' }}
              >
                <span
                  className="text-[10px] font-bold px-3 py-1 rounded-full tracking-[0.15em] uppercase"
                  style={{ background: 'rgba(212,175,127,0.12)', color: 'rgba(212,175,127,0.85)', border: '1px solid rgba(212,175,127,0.25)' }}
                >
                  Coming soon
                </span>
                <p className="text-sm font-semibold text-white/60 tracking-wide">The Avanor Card is on its way</p>
              </div>
            </motion.div>

            {/* Launch notice */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
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
                  <p className="text-sm font-semibold text-accent/90 mb-1">Virtual card — coming soon</p>
                  <p className="text-xs text-white/30 leading-relaxed">
                    Spend your Solana balance anywhere Visa is accepted. Zero FX fees, instant settlement, real-time notifications.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Double or Nothing */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="rounded-2xl p-4 mb-6 border border-white/[0.06] bg-surface/40"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-ivory">Double or Nothing</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${
                    gameLive ? '' : 'opacity-60'
                  }`}
                  style={
                    gameLive
                      ? { background: 'rgba(34,197,94,0.1)', color: 'rgba(74,222,128,0.9)', border: '1px solid rgba(34,197,94,0.2)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  {gameLive ? 'Live · real funds' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-white/30 mb-4 leading-relaxed">
                Bet real SOL or USDC from your wallet on a fair 50/50 coin flip. Win pays double your
                bet straight back to your wallet; lose and the house keeps it. Settled on-chain on Solana devnet.
              </p>

              {/* Currency toggle */}
              <div className="flex gap-2 mb-4">
                {(['USDC', 'SOL'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => selectCurrency(c)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      currency === c
                        ? 'bg-accent text-[#0A0A0A]'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Balance */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-0.5">Wallet balance</p>
                  <p className="font-mono text-lg font-bold text-white/75">
                    {balance ? fmtAmount(walletBalance, currency) : '—'}
                  </p>
                </div>
                {house?.enabled && (
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-0.5">Max bet</p>
                    <p className="font-mono text-sm font-semibold text-white/45">{fmtAmount(maxBet, currency)}</p>
                  </div>
                )}
              </div>

              {/* Bet presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    disabled={!gameLive || amt > walletBalance || amt > maxBet}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      betAmount === amt
                        ? 'bg-accent text-[#0A0A0A]'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    } ${!gameLive || amt > walletBalance || amt > maxBet ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {currency === 'USDC' ? `$${amt}` : `${amt} SOL`}
                  </button>
                ))}
              </div>

              <button
                onClick={() => canFlip && setPendingFlip({ currency, amount: betAmount })}
                disabled={!canFlip}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-opacity ${
                  canFlip ? 'bg-accent text-[#0A0A0A] hover:opacity-90' : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {!house?.enabled
                  ? 'Game offline — house wallet not configured'
                  : !hasWallet
                  ? 'Connect a wallet to play'
                  : betAmount > walletBalance
                  ? 'Insufficient wallet balance'
                  : betAmount > maxBet
                  ? `Max bet is ${fmtAmount(maxBet, currency)} right now`
                  : `Flip for ${fmtAmount(betAmount, currency)}`}
              </button>
            </motion.div>

            {/* Flip stats */}
            {history && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.4 }}
                className="rounded-2xl p-4 mb-6 border border-white/[0.06] bg-surface/40"
              >
                {(() => {
                  const wins = history.filter((h) => h.result === 'win').length;
                  const losses = history.length - wins;
                  const winPct = Math.round((wins / history.length) * 100);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-ivory">Your flip record</p>
                        <p className="text-[11px] text-white/30">{history.length} flip{history.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06] mb-3">
                        <div className="bg-green-400/70" style={{ width: `${winPct}%` }} />
                        <div className="bg-red-400/60" style={{ width: `${100 - winPct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-green-400/80 font-semibold">{wins} won</span>
                        <span className="text-white/25">fair 50/50 odds</span>
                        <span className="text-red-400/80 font-semibold">{losses} lost</span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Flip history */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-3">Flip history</p>
              {!history || history.length === 0 ? (
                <div
                  className="rounded-2xl border border-white/[0.06] py-12 px-6 flex flex-col items-center text-center"
                  style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)' }}
                >
                  <div className="relative mb-5 w-16 h-16 rounded-full border border-accent/15 flex items-center justify-center" style={{ background: 'linear-gradient(145deg, rgba(212,175,127,0.1) 0%, rgba(212,175,127,0.02) 100%)' }}>
                    <span className="text-xl font-black text-accent/40">2x</span>
                  </div>
                  <p className="text-sm font-semibold text-white/30">No flips yet</p>
                  <p className="text-xs text-white/18 mt-1.5 leading-relaxed">
                    Place a bet above and flip the coin to see it here
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.05] overflow-hidden">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white/75">
                            {h.result === 'win' ? 'Won' : 'Lost'} · {h.currency}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${
                              h.result === 'win'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {h.result === 'win' ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          {' · '}
                          <a
                            href={`https://explorer.solana.com/tx/${h.betSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/50 underline underline-offset-2"
                          >
                            bet tx
                          </a>
                          {h.payoutSignature && (
                            <>
                              {' · '}
                              <a
                                href={`https://explorer.solana.com/tx/${h.payoutSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white/50 underline underline-offset-2"
                              >
                                payout tx
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                      <p className={`font-mono text-sm font-bold flex-shrink-0 ml-3 ${h.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                        {h.result === 'win' ? '+' : '-'}{fmtAmount(h.amount, h.currency)}
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

      <AnimatePresence>
        {pendingFlip && (
          <DoubleOrNothingModal
            amount={pendingFlip.amount}
            currency={pendingFlip.currency}
            executeFlip={() => flip(pendingFlip.currency, pendingFlip.amount)}
            onClose={() => setPendingFlip(null)}
            onSettled={handleSettled}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
