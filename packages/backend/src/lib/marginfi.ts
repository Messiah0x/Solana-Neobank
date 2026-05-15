import { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
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
