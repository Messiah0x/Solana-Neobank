import axios from 'axios';

// All API calls go through the same-origin proxy (/api/backend/* is rewritten
// to the backend in next.config.mjs). Same-origin avoids CORS entirely and
// shields mobile clients from cross-domain/DNS issues with the backend host.
const API_BASE = '/api/backend';
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('[API] baseURL:', API_BASE, '→', process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000');
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Privy's getAccessToken is hook-bound, so the provider registers it here
// once on mount (see AuthTokenBridge) and the interceptor attaches a fresh
// token to every request. Privy refreshes the token internally when stale.
type TokenGetter = () => Promise<string | null>;
let getAuthToken: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter | null) {
  getAuthToken = getter;
}

api.interceptors.request.use(async (config) => {
  if (getAuthToken) {
    try {
      const token = await getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed (e.g. logged out) — send without and let the
      // backend respond 401.
    }
  }
  return config;
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

export interface PreparedYieldTx {
  step: 'createAccount' | 'deposit' | 'withdraw';
  marginfiAccountPk: string;
  transaction: string; // base64-serialized, unsigned (user is fee payer)
  blockhash: string;
  lastValidBlockHeight: number;
}

export async function prepareDeposit(userId: string, amountUsdc: number): Promise<PreparedYieldTx> {
  const { data } = await api.post('/api/yield/deposit/prepare', { userId, amountUsdc });
  return data.data;
}

export async function confirmDeposit(
  userId: string,
  amountUsdc: number,
  signature: string,
  marginfiAccountPk: string,
) {
  const { data } = await api.post('/api/yield/deposit/confirm', {
    userId,
    amountUsdc,
    signature,
    marginfiAccountPk,
  });
  return data.data;
}

export async function prepareWithdraw(userId: string, amountUsdc: number): Promise<PreparedYieldTx> {
  const { data } = await api.post('/api/yield/withdraw/prepare', { userId, amountUsdc });
  return data.data;
}

export async function confirmWithdraw(userId: string, amountUsdc: number, signature: string) {
  const { data } = await api.post('/api/yield/withdraw/confirm', { userId, amountUsdc, signature });
  return data.data;
}

// ─── Coin flip (Double or Nothing) ──────────────────────────────────────────

export type FlipCurrency = 'SOL' | 'USDC';

export interface FlipHouseStatus {
  enabled: boolean;
  housePublicKey?: string;
  maxBet?: { SOL: number; USDC: number };
}

export interface PreparedFlipTx {
  transaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
  housePublicKey: string;
}

export interface FlipResult {
  result: 'win' | 'lose';
  payout: number;
  payoutSignature: string | null;
}

export interface FlipRecord {
  id: string;
  currency: FlipCurrency;
  amount: number;
  result: 'win' | 'lose';
  betSignature: string;
  payoutSignature: string | null;
  createdAt: string;
}

export async function getFlipHouse(): Promise<FlipHouseStatus> {
  const { data } = await api.get('/api/flip/house');
  return data.data;
}

export async function prepareFlip(userId: string, currency: FlipCurrency, amount: number): Promise<PreparedFlipTx> {
  const { data } = await api.post('/api/flip/prepare', { userId, currency, amount });
  return data.data;
}

export async function resolveFlip(
  userId: string,
  currency: FlipCurrency,
  amount: number,
  betSignature: string,
): Promise<FlipResult> {
  // Resolution waits for on-chain confirmation and (on a win) the payout
  // transaction, which can exceed the default 15s timeout.
  const { data } = await api.post(
    '/api/flip/resolve',
    { userId, currency, amount, betSignature },
    { timeout: 90_000 },
  );
  return data.data;
}

export async function getFlipHistory(userId: string): Promise<FlipRecord[]> {
  const { data } = await api.get(`/api/flip/history/${encodeURIComponent(userId)}`);
  return data.data;
}
