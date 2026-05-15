'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  principal: number;
  apyPercent: number;
  depositedAt: string;
  size?: 'sm' | 'lg';
}

const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

function calcEarned(principal: number, apy: number, depositedAtMs: number): number {
  const elapsed = (Date.now() - depositedAtMs) / 1000;
  return principal * (apy / 100) * (elapsed / SECONDS_PER_YEAR);
}

function formatEarned(n: number): string {
  if (n < 0.00001) return n.toFixed(8);
  if (n < 0.001) return n.toFixed(6);
  if (n < 0.1) return n.toFixed(5);
  if (n < 10) return n.toFixed(4);
  return n.toFixed(2);
}

// Renders a single character position. Animates vertically when the digit changes.
function Digit({ char, pos }: { char: string; pos: number }) {
  return (
    <span className="relative inline-block overflow-hidden" style={{ minWidth: char === '.' ? '0.3em' : '0.6em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="inline-block"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function YieldTicker({ principal, apyPercent, depositedAt, size = 'lg' }: Props) {
  const depositedAtMs = useRef(new Date(depositedAt).getTime());
  const [earned, setEarned] = useState(() => calcEarned(principal, apyPercent, depositedAtMs.current));

  useEffect(() => {
    const id = setInterval(() => {
      setEarned(calcEarned(principal, apyPercent, depositedAtMs.current));
    }, 80);
    return () => clearInterval(id);
  }, [principal, apyPercent]);

  const formatted = formatEarned(earned);
  const chars = `+$${formatted}`.split('');

  return (
    <div
      className={`font-mono font-bold text-success flex items-center tabular-nums ${
        size === 'lg' ? 'text-3xl' : 'text-xl'
      }`}
    >
      {chars.map((char, i) => (
        <Digit key={i} char={char} pos={i} />
      ))}
    </div>
  );
}
