import { Connection } from '@solana/web3.js';

const NETWORK = (process.env.SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet';
const API_KEY = process.env.HELIUS_API_KEY;

function buildRpcUrl(network: 'mainnet-beta' | 'devnet'): string {
  if (!API_KEY) {
    // Fallback to public RPC during local dev without a key
    return network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';
  }
  return network === 'mainnet-beta'
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
}

function buildWsUrl(network: 'mainnet-beta' | 'devnet'): string | undefined {
  if (!API_KEY) return undefined;
  return network === 'mainnet-beta'
    ? `wss://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : `wss://devnet.helius-rpc.com/?api-key=${API_KEY}`;
}

export const connection = new Connection(buildRpcUrl(NETWORK), {
  commitment: 'confirmed',
  wsEndpoint: buildWsUrl(NETWORK),
});

export async function getPriorityFee(accountKeys: string[]): Promise<number> {
  if (!API_KEY) return 5_000;

  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'priority-fee',
        method: 'getPriorityFeeEstimate',
        params: [{ accountKeys, options: { priorityLevel: 'HIGH' } }],
      }),
    });
    const json = (await res.json()) as { result?: { priorityFeeEstimate?: number } };
    return json.result?.priorityFeeEstimate ?? 5_000;
  } catch {
    return 5_000;
  }
}

export { NETWORK };
