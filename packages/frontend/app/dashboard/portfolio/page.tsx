'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicKey } from '@solana/web3.js';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { NetWorthSection } from '@/components/portfolio/NetWorthSection';
import { fetchMainnetBalancesFromChain } from '@/lib/chain';
import { useSolPrice } from '@/lib/useSolPrice';
import { fmtUsd, shortAddr } from '@/lib/format';

const STORAGE_KEY = 'avanor_portfolio_wallets';

interface TrackedWallet {
  address: string;
  label: string;
}

interface WalletBalance {
  address: string;
  label: string;
  sol: number;
  usdc: number;
  error?: boolean;
}

function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address.trim());
    return true;
  } catch {
    return false;
  }
}

export default function PortfolioPage() {
  const { user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const myAddress = wallets[0]?.address ?? null;

  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const solPrice = useSolPrice();

  // Load saved wallets (and seed with the user's own wallet) on mount
  useEffect(() => {
    let saved: TrackedWallet[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    if (myAddress && !saved.some((w) => w.address === myAddress)) {
      saved = [{ address: myAddress, label: 'My Avanor Wallet' }, ...saved];
    }

    setTrackedWallets(saved);
    setHydrated(true);
  }, [myAddress]);

  const refreshBalances = useCallback(async (list: TrackedWallet[]) => {
    if (list.length === 0) {
      setBalances([]);
      return;
    }
    setLoading(true);
    setBalances([]);
    // Resolve each wallet independently so a slow lookup for one address
    // doesn't hold up the rest from appearing.
    await Promise.all(
      list.map(async (w) => {
        let result: WalletBalance;
        try {
          const b = await fetchMainnetBalancesFromChain(w.address);
          result = { address: w.address, label: w.label, sol: b.sol, usdc: b.usdc };
        } catch {
          result = { address: w.address, label: w.label, sol: 0, usdc: 0, error: true };
        }
        setBalances((prev) => [...prev.filter((p) => p.address !== w.address), result]);
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    refreshBalances(trackedWallets);
  }, [hydrated, trackedWallets, refreshBalances]);

  function persist(list: TrackedWallet[]) {
    setTrackedWallets(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  function addWallet() {
    const address = newAddress.trim();
    if (!address) return;
    if (!isValidAddress(address)) {
      setAddError('That doesn\'t look like a valid Solana address');
      return;
    }
    if (trackedWallets.some((w) => w.address === address)) {
      setAddError('Already tracking this address');
      return;
    }
    setAddError(null);
    persist([...trackedWallets, { address, label: shortAddr(address) }]);
    setNewAddress('');
  }

  function removeWallet(address: string) {
    persist(trackedWallets.filter((w) => w.address !== address));
  }

  const totalSol = balances.reduce((sum, b) => sum + b.sol, 0);
  const totalUsdc = balances.reduce((sum, b) => sum + b.usdc, 0);
  const totalUsd = totalSol * solPrice + totalUsdc;

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-2xl mx-auto space-y-5">

            <div className="mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">Portfolio</p>
              <h1 className="text-2xl font-bold text-ivory">Portfolio</h1>
            </div>

            {/* Net worth + asset calculator */}
            <NetWorthSection cryptoTotal={totalUsd} cryptoLoading={loading && balances.length === 0} />

            {/* Tracked wallets */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.3 }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-2 px-1">
                Tracked wallets
              </p>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
                {trackedWallets.length === 0 ? (
                  <div className="flex flex-col items-center py-16 px-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-white/35">No wallets tracked yet</p>
                    <p className="text-xs text-white/20 mt-1.5">Add an address above to follow its balance</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {trackedWallets.map((w) => {
                      const bal = balances.find((b) => b.address === w.address);
                      const usdValue = bal ? bal.sol * solPrice + bal.usdc : null;
                      const isMine = w.address === myAddress;
                      return (
                        <motion.div
                          key={w.address}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/70 truncate">
                              {w.label}
                              {isMine && (
                                <span className="ml-2 text-[10px] font-bold text-accent/70 uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-white/25 font-mono mt-0.5 truncate">{shortAddr(w.address)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {bal?.error ? (
                              <p className="text-xs text-error/60">Failed to load</p>
                            ) : usdValue === null ? (
                              <p className="text-xs text-white/20">Loading…</p>
                            ) : (
                              <>
                                <p className="text-sm font-bold font-mono text-white/80">{fmtUsd(usdValue)}</p>
                                <p className="text-[11px] text-white/25 font-mono mt-0.5">
                                  {bal!.sol.toFixed(3)} SOL · {bal!.usdc.toFixed(2)} USDC
                                </p>
                              </>
                            )}
                          </div>
                          {!isMine && (
                            <button
                              onClick={() => removeWallet(w.address)}
                              aria-label="Remove wallet"
                              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>

            {/* Add a wallet */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-2 px-1">
                Add a wallet
              </p>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => {
                      setNewAddress(e.target.value);
                      setAddError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addWallet();
                    }}
                    placeholder="Paste a Solana wallet address"
                    className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                  <button
                    onClick={addWallet}
                    disabled={!newAddress.trim()}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-accent text-[#0A0A0A] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    Add
                  </button>
                </div>
                {addError && <p className="text-xs text-error mt-2">{addError}</p>}
                <p className="text-[11px] text-white/25 mt-3 leading-relaxed">
                  Track any Solana wallet — yours, a cold wallet, or someone else's public address.
                  Balances (SOL + USDC) are read directly from Solana mainnet and refresh automatically.
                  Saved on this device. Note: your Avanor wallet runs on devnet, so it may show $0 here.
                </p>
              </div>
            </motion.div>

          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
