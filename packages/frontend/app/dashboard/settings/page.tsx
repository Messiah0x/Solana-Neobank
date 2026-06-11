'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { getWallet } from '@/lib/api';
import { getPrivyUserInfo } from '@/lib/privy-utils';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-2 px-1">{children}</p>;
}

function SettingsRow({
  label,
  value,
  sub,
  action,
  mono,
}: {
  label: string;
  value?: string;
  sub?: string;
  action?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
        {value && (
          <p className={`text-sm font-semibold text-white/70 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
        )}
        {sub && <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-white/40 hover:text-white/70"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-[10px] font-bold text-success">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          <span className="text-[10px] font-bold">Copy</span>
        </>
      )}
    </button>
  );
}

function ProviderBadge({ provider }: { provider?: string }) {
  if (provider === 'google') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
        <svg className="w-3 h-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-[10px] font-bold text-white/50">Google</span>
      </div>
    );
  }
  if (provider === 'github') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
        <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        <span className="text-[10px] font-bold text-white/50">GitHub</span>
      </div>
    );
  }
  return null;
}

const RESERVE_WAITLIST_KEY = 'avanor_reserve_waitlist';

function ReserveCard() {
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    try {
      setJoined(localStorage.getItem(RESERVE_WAITLIST_KEY) === '1');
    } catch {
      // ignore
    }
  }, []);

  function join() {
    try {
      localStorage.setItem(RESERVE_WAITLIST_KEY, '1');
    } catch {
      // ignore
    }
    setJoined(true);
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,127,0.10) 0%, rgba(212,175,127,0.03) 100%)',
        border: '1px solid rgba(212,175,127,0.18)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm font-bold text-accent">Avanor Reserve</p>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
          style={{ background: 'rgba(212,175,127,0.12)', color: 'rgba(212,175,127,0.7)', border: '1px solid rgba(212,175,127,0.2)' }}
        >
          Coming soon
        </span>
      </div>
      <p className="text-xs text-white/40 leading-relaxed mb-4">
        Our premium tier: zero performance fees on yield, priority access to the Visa card,
        higher daily limits, and a dedicated concierge line.
      </p>
      <button
        onClick={join}
        disabled={joined}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          joined
            ? 'bg-white/[0.04] text-white/30 cursor-default'
            : 'bg-accent text-background hover:opacity-90'
        }`}
      >
        {joined ? "You're on the waitlist ✓" : 'Join the waitlist'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const userId = user?.id ?? null;
  const [signingOut, setSigningOut] = useState(false);

  const { data: wallet } = useSWR(
    userId ? `wallet-${userId}` : null,
    () => getWallet(userId!),
  );

  const { name, email, image, provider, initials } = getPrivyUserInfo(user ?? null);
  const publicKey = wallet?.publicKey ?? null;
  const shortKey = publicKey ? `${publicKey.slice(0, 6)}···${publicKey.slice(-6)}` : null;
  const createdAt = wallet?.createdAt
    ? new Date(wallet.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    router.push('/auth/signin');
  }

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-2xl mx-auto space-y-5">

            <div className="mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">Account</p>
              <h1 className="text-2xl font-bold text-ivory">Settings</h1>
            </div>

            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <SectionLabel>Profile</SectionLabel>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
                <div className="px-4 py-5 flex items-center gap-4 border-b border-white/[0.05]">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,127,0.15) 0%, rgba(212,175,127,0.05) 100%)',
                      border: '1px solid rgba(212,175,127,0.2)',
                      color: '#D4AF7F',
                    }}
                  >
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white/80 truncate">{name}</p>
                    <p className="text-xs text-white/30 mt-0.5 truncate font-mono">{email}</p>
                  </div>
                  {provider && <ProviderBadge provider={provider} />}
                </div>
                <SettingsRow
                  label="Signed in via"
                  value={provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'Unknown'}
                  sub="OAuth 2.0 · JWT session"
                />
              </div>
            </motion.div>

            {/* Wallet */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }}>
              <SectionLabel>Wallet</SectionLabel>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
                {!wallet ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm text-white/30">No wallet created yet</p>
                    <p className="text-xs text-white/20 mt-1">Go to Overview to create your wallet</p>
                  </div>
                ) : (
                  <>
                    <SettingsRow
                      label="Public Key"
                      value={shortKey ?? '—'}
                      mono
                      action={publicKey ? <CopyButton text={publicKey} /> : undefined}
                    />
                    <SettingsRow label="Created" value={createdAt ?? '—'} />
                    <SettingsRow
                      label="Network"
                      value="Solana Devnet"
                      action={
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                          <span className="text-[10px] text-white/30 font-semibold">Active</span>
                        </div>
                      }
                    />
                  </>
                )}
              </div>
            </motion.div>

            {/* Application */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.3 }}>
              <SectionLabel>Application</SectionLabel>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
                <SettingsRow label="Platform" value="Solana" sub="Devnet · Phase 1 — Core Banking" />
                <SettingsRow label="Version" value="0.1.0" sub="Avanor Private Banking" />
                <SettingsRow label="Infrastructure" value="Vercel · Railway · Solana RPC" />
                <SettingsRow
                  label="Onboarding"
                  value="Welcome tour"
                  sub="Replay the first-time setup guide"
                  action={
                    <button
                      onClick={() => {
                        localStorage.removeItem('avanor_onboarded');
                        router.push('/dashboard');
                      }}
                      className="flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-accent/20 bg-accent/[0.06] hover:bg-accent/[0.12] transition-all text-[10px] font-bold text-accent/80 hover:text-accent"
                    >
                      Replay
                    </button>
                  }
                />
              </div>
            </motion.div>

            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
              <SectionLabel>Security</SectionLabel>
              <div className="rounded-2xl border border-white/[0.06] bg-surface/30 overflow-hidden">
                <SettingsRow
                  label="Session"
                  value="Active"
                  sub="Encrypted JWT · Keys never shared"
                  action={
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success/10 border border-success/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-[10px] font-bold text-success">Secure</span>
                    </div>
                  }
                />
                <SettingsRow
                  label="Wallet Keys"
                  value="Privy MPC Enclave"
                  sub="Non-custodial · Private key never touches our servers"
                />
                <SettingsRow
                  label="Key Custody"
                  value="User-controlled"
                  sub="Privy's secure enclave · You hold your keys"
                />
              </div>
            </motion.div>

            {/* Avanor Reserve */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23, duration: 0.3 }}>
              <SectionLabel>Membership</SectionLabel>
              <ReserveCard />
            </motion.div>

            {/* Sign out */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.3 }}>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full py-3.5 rounded-xl border border-error/20 bg-error/[0.04] hover:bg-error/[0.08] hover:border-error/30 transition-all text-sm font-bold text-error/70 hover:text-error/90 disabled:opacity-50"
              >
                {signingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-error/30 border-t-error/70 rounded-full animate-spin" />
                    Signing out…
                  </span>
                ) : (
                  'Sign Out'
                )}
              </button>
            </motion.div>

            <p className="text-center text-[10px] text-white/15 pb-2">Avanor Private Banking · Solana Devnet</p>

          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
