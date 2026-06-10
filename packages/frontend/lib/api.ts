import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('[API] baseURL:', API_BASE);
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ?? err.message ?? 'Request failed';
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
  },
);

export async function registerWallet(
  userId: string,
  publicKey: string,
): Promise<{ id: string; publicKey: string; createdAt: string }> {
  const { data } = await api.post('/api/wallet/register', { userId, publicKey });
  return data.data;
}

export async function createWallet(userId: string): Promise<{ id: string; publicKey: string; createdAt: string }> {
  const { data } = await api.post('/api/wallet/create', { userId });
  return data.data;
}

export async function getWallet(userId: string): Promise<{ id: string; publicKey: string; createdAt: string }> {
  const { data } = await api.get(`/api/wallet/${encodeURIComponent(userId)}`);
  return data.data;
}

export async function getWalletBalance(userId: string): Promise<{ publicKey: string; usdc: number; sol: number }> {
  const { data } = await api.get(`/api/wallet/${encodeURIComponent(userId)}/balance`);
  return data.data;
}

export async function getWalletTransactions(userId: string, limit = 10) {
  const { data } = await api.get(`/api/wallet/${encodeURIComponent(userId)}/transactions`, { params: { limit } });
  return data.data;
}

export async function getYieldApy(): Promise<number> {
  const { data } = await api.get('/api/yield/apy');
  return data.data.apy;
}

export async function getYieldData(userId: string): Promise<{
  hasPosition: boolean;
  apy: number;
  depositedAmount: number;
  earnedYield: number;
  depositedAt: string | null;
  protocol: string;
}> {
  const { data } = await api.get(`/api/yield/${encodeURIComponent(userId)}`);
  return data.data;
}

export async function depositUsdc(userId: string, amountUsdc: number) {
  const { data } = await api.post('/api/yield/deposit', { userId, amountUsdc });
  return data.data;
}

export async function withdrawUsdc(userId: string, amountUsdc: number) {
  const { data } = await api.post('/api/yield/withdraw', { userId, amountUsdc });
  return data.data;
}
