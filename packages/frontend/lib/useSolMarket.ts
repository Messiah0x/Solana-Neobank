import useSWR from 'swr';

export interface SolMarket {
  price: number;
  marketCap: number;
  change24h: number;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch SOL market data');
    return r.json();
  });

export function useSolMarket(): SolMarket {
  const { data } = useSWR<{
    solana: { usd: number; usd_market_cap: number; usd_24h_change: number };
  }>(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
    fetcher,
    { refreshInterval: 60_000 },
  );

  return {
    price: data?.solana?.usd ?? 0,
    marketCap: data?.solana?.usd_market_cap ?? 0,
    change24h: data?.solana?.usd_24h_change ?? 0,
  };
}
