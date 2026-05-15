export interface Wallet {
  id: string;
  publicKey: string;
  createdAt: string;
}

export interface WalletBalance {
  publicKey: string;
  usdc: number;
  sol: number;
}

export interface Transaction {
  signature: string;
  timestamp: number | null;
  status: 'success' | 'failed';
  slot: number;
}

export type Network = 'mainnet-beta' | 'devnet';
