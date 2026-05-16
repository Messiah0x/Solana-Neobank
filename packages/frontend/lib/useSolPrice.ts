import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch SOL price');
    return res.json();
  });

export function useSolPrice(): number {
  const { data } = useSWR<{ solana: { usd: number } }>(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    fetcher,
    { refreshInterval: 60_000 },
  );

  return data?.solana?.usd ?? 0;
}
