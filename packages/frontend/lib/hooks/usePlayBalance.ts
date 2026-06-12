'use client';

import { useCallback, useEffect, useState } from 'react';

export type PlayCurrency = 'usdc' | 'sol';

export interface FlipRecord {
  id: string;
  currency: PlayCurrency;
  amount: number;
  result: 'win' | 'lose';
  balanceAfter: number;
  date: string;
}

interface PlayState {
  balances: Record<PlayCurrency, number>;
  history: FlipRecord[];
}

const STORAGE_KEY = 'avanor_play_v1';
const HISTORY_LIMIT = 25;

// Starting "play money" balances for the Double or Nothing game. This
// balance is entirely separate from the user's real wallet — it never
// touches actual SOL/USDC and exists purely for the game.
export const STARTING_BALANCES: Record<PlayCurrency, number> = { usdc: 1000, sol: 5 };

function loadState(): PlayState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayState;
      if (parsed?.balances && parsed?.history) return parsed;
    }
  } catch {
    // ignore
  }
  return { balances: { ...STARTING_BALANCES }, history: [] };
}

export function usePlayBalance() {
  const [state, setState] = useState<PlayState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const persist = useCallback((next: PlayState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore — game still works in-memory for this session
    }
  }, []);

  const resolveFlip = useCallback(
    (currency: PlayCurrency, amount: number, result: 'win' | 'lose') => {
      const current = state ?? loadState();
      const delta = result === 'win' ? amount : -amount;
      const balanceAfter = Math.max(0, current.balances[currency] + delta);
      const record: FlipRecord = {
        id: crypto.randomUUID(),
        currency,
        amount,
        result,
        balanceAfter,
        date: new Date().toISOString(),
      };
      persist({
        balances: { ...current.balances, [currency]: balanceAfter },
        history: [record, ...current.history].slice(0, HISTORY_LIMIT),
      });
    },
    [state, persist],
  );

  const reset = useCallback(() => {
    persist({ balances: { ...STARTING_BALANCES }, history: [] });
  }, [persist]);

  return {
    balances: state?.balances ?? STARTING_BALANCES,
    history: state?.history ?? [],
    ready: state !== null,
    resolveFlip,
    reset,
  };
}
