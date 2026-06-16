import { FastifyInstance } from 'fastify';

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'SPY', 'COIN', 'MSTR'];

const FALLBACK: Record<string, { xSymbol: string; name: string; price: number; marketCap: number }> = {
  NVDA:  { xSymbol: 'NVDAx',  name: 'NVIDIA',        price: 135,   marketCap: 3.3e12 },
  AAPL:  { xSymbol: 'AAPLx',  name: 'Apple',          price: 211,   marketCap: 3.2e12 },
  MSFT:  { xSymbol: 'MSFTx',  name: 'Microsoft',      price: 449,   marketCap: 3.34e12 },
  AMZN:  { xSymbol: 'AMZNx',  name: 'Amazon',         price: 224,   marketCap: 2.36e12 },
  GOOGL: { xSymbol: 'GOOGLx', name: 'Alphabet',       price: 178,   marketCap: 2.19e12 },
  META:  { xSymbol: 'METAx',  name: 'Meta',           price: 673,   marketCap: 1.69e12 },
  TSLA:  { xSymbol: 'TSLAx',  name: 'Tesla',          price: 348,   marketCap: 1.12e12 },
  SPY:   { xSymbol: 'SPYx',   name: 'S&P 500 ETF',   price: 592,   marketCap: 614e9   },
  COIN:  { xSymbol: 'COINx',  name: 'Coinbase',       price: 278,   marketCap: 71e9    },
  MSTR:  { xSymbol: 'MSTRx',  name: 'MicroStrategy',  price: 421,   marketCap: 58e9    },
};

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchYahooFinance() {
  const url =
    `https://query1.finance.yahoo.com/v7/finance/quote` +
    `?symbols=${SYMBOLS.join(',')}&lang=en-US&region=US&corsDomain=finance.yahoo.com`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://finance.yahoo.com/',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);
  return res.json();
}

export default async function marketRoutes(fastify: FastifyInstance) {
  fastify.get('/stocks', { config: { public: true } }, async (_req, reply) => {
    // Serve from cache if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return reply.send(cache.data);
    }

    let liveData: Record<string, unknown>[] = [];
    let fromCache = false;

    try {
      const json = await fetchYahooFinance();
      liveData = json?.quoteResponse?.result ?? [];
    } catch (err) {
      fastify.log.warn({ err }, '[market] Yahoo Finance fetch failed, serving fallback');
      fromCache = true;
    }

    const stocks = SYMBOLS.map((sym) => {
      const q = liveData.find((r) => r.symbol === sym) ?? {};
      const fb = FALLBACK[sym];
      return {
        symbol: sym,
        xSymbol: fb.xSymbol,
        name: (q.shortName as string) || (q.longName as string) || fb.name,
        price: (q.regularMarketPrice as number) || fb.price,
        marketCap: (q.marketCap as number) || fb.marketCap,
        change24h: (q.regularMarketChangePercent as number) ?? 0,
        stale: fromCache,
      };
    });

    const payload = { stocks };
    if (!fromCache) cache = { data: payload, ts: Date.now() };
    return reply.send(payload);
  });
}
