import useSWR from 'swr';
export interface StockQuote {
  symbol: string;
  xSymbol: string;
  name: string;
  price: number;
  marketCap: number | null;
  change24h: number;
  stale?: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json());

export function useXStocks() {
  const { data, error, isLoading } = useSWR<{ stocks: StockQuote[]; error?: string }>(
    '/api/market-data',
    fetcher,
    { refreshInterval: 60_000 },
  );

  return {
    stocks: data?.stocks ?? [],
    isLoading,
    error: error ?? (data?.error ? new Error(data.error as string) : null),
  };
}
