import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { MarginfiClient, getConfig } from '@mrgnlabs/marginfi-client-v2';
import { connection, NETWORK } from './helius';

export function createServerWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,

    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if ('version' in tx) {
        (tx as VersionedTransaction).sign([keypair]);
      } else {
        (tx as Transaction).sign(keypair);
      }
      return tx;
    },

    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      for (const tx of txs) {
        if ('version' in tx) {
          (tx as VersionedTransaction).sign([keypair]);
        } else {
          (tx as Transaction).sign(keypair);
        }
      }
      return txs;
    },
  };
}

export async function createMarginfiClient(keypair: Keypair) {
  const env = NETWORK === 'mainnet-beta' ? 'production' : 'dev';
  const config = getConfig(env as Parameters<typeof getConfig>[0]);
  const wallet = createServerWallet(keypair);
  return MarginfiClient.fetch(config, wallet, connection);
}

// Read-only wallet for building unsigned transactions on behalf of a user
// whose private key we never hold (Privy embedded wallets). Signing happens
// client-side, so any server-side sign attempt is a bug.
export function createReadonlyWallet(publicKey: PublicKey) {
  return {
    publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(_tx: T): Promise<T> {
      throw new Error('Read-only wallet cannot sign — client-side signing required');
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(_txs: T[]): Promise<T[]> {
      throw new Error('Read-only wallet cannot sign — client-side signing required');
    },
  };
}

export async function createMarginfiClientForPubkey(publicKey: PublicKey) {
  const env = NETWORK === 'mainnet-beta' ? 'production' : 'dev';
  const config = getConfig(env as Parameters<typeof getConfig>[0]);
  return MarginfiClient.fetch(config, createReadonlyWallet(publicKey), connection);
}
