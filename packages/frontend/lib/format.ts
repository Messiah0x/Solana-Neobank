export function shortAddr(address: string, chars = 4): string {
  return `${address.slice(0, chars)}···${address.slice(-chars)}`;
}

export function fmtUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
