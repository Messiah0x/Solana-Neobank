'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolanaWallets } from '@privy-io/react-auth';
import { useToast } from '@/lib/useToast';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_DECIMALS = 6;

const RPC_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HELIUS_RPC) ||
  'https://api.devnet.solana.com';

interface Props {
  usdcBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type Phase = 'idle' | 'sending' | 'success' | 'error';

function isValidPublicKey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function SendModal({ usdcBalance, onClose, onSuccess }: Props) {
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0] ?? null;
  const { toast } = useToast();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const sendingRef = useRef(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recipientInvalid = recipient.length > 0 && !isValidPublicKey(recipient);
  const amountNum = parseFloat(amount);
  const amountInvalid = amount.length > 0 && (isNaN(amountNum) || amountNum <= 0 || amountNum > usdcBalance);
  const canSubmit =
    phase === 'idle' &&
    recipient.length > 0 &&
    !recipientInvalid &&
    amount.length > 0 &&
    !amountInvalid &&
    !!wallet;

  function handleSendMax() {
    setAmount(usdcBalance.toFixed(6).replace(/\.?0+$/, '') || '0');
  }

  async function handleSend() {
    if (!canSubmit || !wallet || sendingRef.current) return;
    sendingRef.current = true;
    setPhase('sending');
    setErrorMsg(null);

    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const senderPubkey = new PublicKey(wallet.address);
      const recipientPubkey = new PublicKey(recipient);

      // Derive token accounts
      const senderATA = await getAssociatedTokenAddress(USDC_MINT, senderPubkey);
      const recipientATA = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

      const tx = new Transaction();

      // Create recipient ATA if it doesn't exist
      try {
        await getAccount(connection, recipientATA);
      } catch {
        // Account doesn't exist — add create instruction
        tx.add(
          createAssociatedTokenAccountInstruction(
            senderPubkey,   // payer
            recipientATA,   // ata to create
            recipientPubkey, // owner
            USDC_MINT,
          ),
        );
      }

      // Amount in micro-USDC (6 decimals)
      const lamports = BigInt(Math.round(amountNum * 10 ** USDC_DECIMALS));

      tx.add(
        createTransferInstruction(
          senderATA,
          recipientATA,
          senderPubkey,
          lamports,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );

      // Set recent blockhash and fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = senderPubkey;

      // Sign and send via Privy embedded wallet
      const sig = await wallet.sendTransaction(tx, connection);

      setTxSig(sig);
      setPhase('success');
      toast.success(`Sent ${amountNum} USDC successfully`);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setErrorMsg(msg);
      setPhase('error');
      toast.error(`Send failed: ${msg}`);
    } finally {
      sendingRef.current = false;
    }
  }

  function handleReset() {
    setPhase('idle');
    setErrorMsg(null);
    setRecipient('');
    setAmount('');
    setTxSig(null);
  }

  const explorerUrl = txSig
    ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl p-6 max-h-[90dvh] overflow-y-auto"
          style={{
            background: 'linear-gradient(145deg, #161310 0%, #0F0D0A 100%)',
            border: '1px solid rgba(212,175,127,0.12)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
                Solana · Devnet
              </p>
              <h3 className="text-lg font-bold text-ivory mt-0.5">Send USDC</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.07] flex items-center justify-center hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white/70"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Success state */}
            {phase === 'success' && txSig ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-base font-bold text-white mb-1">Sent!</p>
                <p className="text-sm text-white/40 mb-5">
                  {amountNum} USDC sent successfully.
                </p>

                <div
                  className="rounded-2xl p-4 mb-4 text-left"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">
                    Transaction
                  </p>
                  <p className="font-mono text-xs text-white/50 break-all">{txSig}</p>
                </div>

                <a
                  href={explorerUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3.5 rounded-xl font-bold text-sm text-center mb-3 transition-all bg-accent hover:bg-accent/90 text-white"
                >
                  View on Explorer
                </a>
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Send another
                </button>
              </motion.div>
            ) : phase === 'error' ? (
              /* Error state */
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-white mb-1">Transaction Failed</p>
                <p className="text-sm text-white/40 mb-5 break-words">{errorMsg}</p>
                <button
                  onClick={handleReset}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.10] transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              /* Form state (idle or sending) */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Available balance */}
                <div
                  className="rounded-2xl p-3 mb-4 flex items-center justify-between"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/25">
                    Available
                  </span>
                  <span className="text-sm font-semibold text-white/60">
                    {usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </div>

                {/* Recipient input */}
                <div className="mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5 block">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    placeholder="Solana public key"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value.trim())}
                    disabled={phase === 'sending'}
                    className={`w-full rounded-xl px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/20 bg-white/[0.04] border outline-none transition-all disabled:opacity-50 ${
                      recipientInvalid
                        ? 'border-error/40 focus:border-error/70'
                        : 'border-white/[0.08] focus:border-accent/40'
                    }`}
                  />
                  {recipientInvalid && (
                    <p className="text-[11px] text-error mt-1.5">Invalid Solana address</p>
                  )}
                </div>

                {/* Amount input */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5 block">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      max={usdcBalance}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={phase === 'sending'}
                      className={`w-full rounded-xl px-4 py-3 pr-24 text-sm text-white/80 placeholder:text-white/20 bg-white/[0.04] border outline-none transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        amountInvalid
                          ? 'border-error/40 focus:border-error/70'
                          : 'border-white/[0.08] focus:border-accent/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSendMax}
                      disabled={phase === 'sending' || usdcBalance <= 0}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Send Max
                    </button>
                  </div>
                  {amountInvalid && (
                    <p className="text-[11px] text-error mt-1.5">
                      {amountNum > usdcBalance
                        ? 'Exceeds available balance'
                        : 'Enter a valid amount'}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  whileTap={canSubmit ? { scale: 0.97 } : undefined}
                  onClick={handleSend}
                  disabled={!canSubmit}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    canSubmit
                      ? 'bg-accent hover:bg-accent/90 text-white cursor-pointer'
                      : 'bg-white/[0.06] border border-white/[0.08] text-white/25 cursor-not-allowed'
                  }`}
                >
                  {phase === 'sending' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Send USDC
                    </>
                  )}
                </motion.button>

                {!wallet && (
                  <p className="text-center text-[11px] text-white/20 mt-3">
                    No wallet connected
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
