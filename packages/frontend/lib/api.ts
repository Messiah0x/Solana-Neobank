import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
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

export async function createWallet(userId: string): Promise<{ id: string; publicKey: string; createdAt: string }> {
  const { data } = await api.post('/api/wallet/create', { userId });
  return data.data;
}

export async function getWallet(userId: string): Promise<{ id: string; publicKey: string; createdAt: string }> {
  const { data } = await api.get(`/api/wallet/${userId}`);
  return data.data;
}

export async function getWalletBalance(userId: string): Promise<{ publicKey: string; usdc: number; sol: number }> {
  const { data } = await api.get(`/api/wallet/${userId}/balance`);
  return data.data;
}

export async function getWalletTransactions(userId: string, limit = 10) {
  const { data } = await api.get(`/api/wallet/${userId}/transactions`, { params: { limit } });
  return data.data;
}
