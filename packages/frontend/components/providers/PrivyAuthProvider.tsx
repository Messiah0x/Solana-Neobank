'use client';

import { useEffect } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { setAuthTokenGetter } from '@/lib/api';

// Bridges Privy's hook-bound getAccessToken into the axios client so every
// backend request carries a verifiable Authorization header.
function AuthTokenBridge({ children }: { children: React.ReactNode }) {
  const { getAccessToken } = usePrivy();

  useEffect(() => {
    setAuthTokenGetter(getAccessToken);
    return () => setAuthTokenGetter(null);
  }, [getAccessToken]);

  return <>{children}</>;
}

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // During build or if env var is missing, render children without Privy
    // so the build doesn't fail. Auth will show an error at runtime.
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['github', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#D4A96A',
          landingHeader: 'Sign in to Avanor',
          loginMessage: 'Your non-custodial private bank on Solana.',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: true,
        },
      }}
    >
      <AuthTokenBridge>{children}</AuthTokenBridge>
    </PrivyProvider>
  );
}
