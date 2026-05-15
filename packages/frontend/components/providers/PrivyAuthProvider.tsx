'use client';

import { PrivyProvider } from '@privy-io/react-auth';

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
      {children}
    </PrivyProvider>
  );
}
