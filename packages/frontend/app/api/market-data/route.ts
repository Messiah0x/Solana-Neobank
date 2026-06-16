import { NextResponse } from 'next/server';

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'SPY', 'COIN', 'MSTR'];

export interface StockQuote {
  symbol: string;
  xSymbol: string;
  name: string;
  price: number;
  marketCap: number | null;
  change24h: number;
  stale?: boolean;
}

// Approximate values shown when all external sources are unreachable.
const FALLBACK: Record<string, StockQuote> = {
  NVDA:  { symbol: 'NVDA',  xSymbol: 'NVDAx',  name: 'NVIDIA',       price: 135,  marketCap: 3.3e12,  change24h: 0, stale: true },
  AAPL:  { symbol: 'AAPL',  xSymbol: 'AAPLx',  name: 'Apple',        price: 211,  marketCap: 3.2e12,  change24h: 0, stale: true },
  MSFT:  { symbol: 'MSFT',  xSymbol: 'MSFTx',  name: 'Microsoft',    price: 449,  marketCap: 3.34e12, change24h: 0, stale: true },
  AMZN:  { symbol: 'AMZN',  xSymbol: 'AMZNx',  name: 'Amazon',       price: 224,  marketCap: 2.36e12, change24h: 0, stale: true },
  GOOGL: { symbol: 'GOOGL', xSymbol: 'GOOGLx', name: 'Alphabet',     price: 178,  marketCap: 2.19e12, change24h: 0, stale: true },
  META:  { symbol: 'META',  xSymbol: 'METAx',  name: 'Meta',         price: 673,  marketCap: 1.69e12, change24h: 0, stale: true },
  TSLA:  { symbol: 'TSLA',  xSymbol: 'TSLAx',  name: 'Tesla',        price: 348,  marketCap: 1.12e12, change24h: 0, stale: true },
  SPY:   { symbol: 'SPY',   xSymbol: 'SPYx',   name: 'S&P 500 ETF',  price: 592,  marketCap: 614e9,   change24h: 0, stale: true },
  COIN:  { symbol: 'COIN',  xSymbol: 'COINx',  name: 'Coinbase',     price: 278,  marketCap: 71e9,    change24h: 0, stale: true },
  MSTR:  { symbol: 'MSTR',  xSymbol: 'MSTRx',  name: 'MicroStrategy',price: 421,  marketCap: 58e9,    change24h: 0, stale: true },
};

async function fetchFromBackend(): Promise<StockQuote[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${backendUrl}/api/market/stocks`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  const json = await res.json();
  return json.stocks;
}

async function fetchFromYahoo(): Promise<StockQuote[]> {
  const url =
    `https://query1.finance.yahoo.com/v7/finance/quote` +
    `?symbols=${SYMBOLS.join(',')}&lang=en-US&region=US&corsDomain=finance.yahoo.com`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json',
      Referer: 'https://finance.yahoo.com/',
    },
    signal: AbortSignal.timeout(8000),
  } as RequestInit);

  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);
  const json = await res.json();
  const results: Record<string, unknown>[] = json?.quoteResponse?.result ?? [];

  return SYMBOLS.map((sym) => {
    const q = results.find((r) => r.symbol === sym) ?? {};
    const fb = FALLBACK[sym];
    return {
      symbol: sym,
      xSymbol: fb.xSymbol,
      name: fb.name,
      price: (q.regularMarketPrice as number) || fb.price,
      marketCap: (q.marketCap as number) || fb.marketCap,
      change24h: (q.regularMarketChangePercent as number) ?? 0,
    };
  });
}

export async function GET() {
  // Try backend proxy first (works when the backend is reachable),
  // then fall back to direct Yahoo Finance call (works on Vercel),
  // then fall back to hardcoded approximate data.
  for (const source of [fetchFromBackend, fetchFromYahoo]) {
    try {
      const stocks = await source();
      return NextResponse.json({ stocks });
    } catch {
      // try next source
    }
  }

  return NextResponse.json({ stocks: SYMBOLS.map((s) => FALLBACK[s]) });
}
