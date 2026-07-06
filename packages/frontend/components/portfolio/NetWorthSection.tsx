'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtUsd } from '@/lib/format';

const STORAGE_KEY = 'avanor_networth_assets';

type AssetCategory = 'Cash' | 'Real Estate' | 'Vehicle' | 'Investments' | 'Other';

const CATEGORIES: AssetCategory[] = ['Cash', 'Real Estate', 'Vehicle', 'Investments', 'Other'];

interface Asset {
  id: string;
  label: string;
  category: AssetCategory;
  value: number;
}

interface NetWorthSectionProps {
  cryptoTotal: number;
  cryptoLoading: boolean;
}

export function NetWorthSection({ cryptoTotal, cryptoLoading }: NetWorthSectionProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Cash');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      // Only accept a well-formed array; corrupt/non-array JSON would crash
      // the `.map()`/`.reduce()` below.
      if (Array.isArray(parsed)) setAssets(parsed);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  function persist(list: Asset[]) {
    setAssets(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  function addAsset() {
    const trimmed = label.trim();
    const num = parseFloat(value);
    if (!trimmed) {
      setError('Give this asset a name');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a value greater than $0');
      return;
    }
    persist([...assets, { id: crypto.randomUUID(), label: trimmed, category, value: num }]);
    setLabel('');
    setValue('');
    setCategory('Cash');
    setError(null);
    setShowForm(false);
  }

  function removeAsset(id: string) {
    persist(assets.filter((a) => a.id !== id));
  }

  const otherTotal = assets.reduce((sum, a) => sum + a.value, 0);
  const grandTotal = cryptoTotal + otherTotal;

  return (
    <div>
      {/* Net worth hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl p-6 relative overflow-hidden theme-invert mb-3"
        style={{
          background: 'var(--gradient-card-dark)',
          border: '1px solid rgba(212,175,127,0.18)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,127,0.12) 0%, transparent 65%)', transform: 'translate(25%, -25%)' }}
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-2">
            Total Net Worth
          </p>
          <p className="text-4xl font-bold font-mono text-white tabular-nums">
            {cryptoLoading && otherTotal === 0 ? '—' : fmtUsd(grandTotal)}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-white/40 font-mono flex-wrap">
            <span>Crypto {fmtUsd(cryptoTotal)}</span>
            <span className="text-white/15">·</span>
            <span>Other assets {fmtUsd(otherTotal)}</span>
            {cryptoLoading && <span className="text-accent/60">Refreshing…</span>}
          </div>
        </div>
      </motion.div>

      {/* Asset calculator */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.3 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-2 px-1">
          Other assets
        </p>
        <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
          {hydrated && assets.length === 0 && !showForm ? (
            <div className="flex flex-col items-center py-10 px-6 text-center">
              <p className="text-sm font-semibold text-white/35">No other assets added</p>
              <p className="text-xs text-white/20 mt-1.5">
                Add cash, real estate, vehicles, or other holdings to see your full net worth
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {assets.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/70 truncate">{a.label}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{a.category}</p>
                  </div>
                  <p className="text-sm font-bold font-mono text-white/80 flex-shrink-0">{fmtUsd(a.value)}</p>
                  <button
                    onClick={() => removeAsset(a.id)}
                    aria-label="Remove asset"
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          <div className="p-4 border-t border-white/[0.04]">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-accent/80 border border-accent/20 hover:bg-accent/5 transition-colors"
              >
                + Add an asset
              </button>
            ) : (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Savings account, Toyota Camry, Home equity"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent/40 transition-colors"
                />
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AssetCategory)}
                    className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-accent/40 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-surface text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addAsset();
                      }}
                      placeholder="0.00"
                      className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-7 pr-3.5 py-2.5 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                </div>
                {error && <p className="text-xs text-error">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={addAsset}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent text-[#0A0A0A] hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setError(null);
                      setLabel('');
                      setValue('');
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-white/20 mt-2 px-1 leading-relaxed">
          Manually tracked assets are saved on this device only — they're not financial accounts and aren't verified against any external source.
        </p>
      </motion.div>
    </div>
  );
}
