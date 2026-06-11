'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { AvanorLogo } from '@/components/brand/AvanorLogo';
import { getPrivyUserInfo } from '@/lib/privy-utils';

export function Header() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const { initials } = getPrivyUserInfo(user ?? null);

  async function handleSignOut() {
    await logout();
    router.push('/auth/signin');
  }

  return (
    <header
      className="h-14 border-b border-white/[0.06] flex items-center px-4 lg:px-8 justify-between flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-xl z-30"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Logo — mobile only */}
      <div className="lg:hidden">
        <AvanorLogo size={26} showWordmark />
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse lg:hidden" />
        <button
          onClick={handleSignOut}
          className="w-8 h-8 rounded-full bg-accent-muted border border-accent-border flex items-center justify-center hover:bg-accent/20 transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <span className="font-heading text-accent text-xs font-bold">{initials}</span>
        </button>
      </div>
    </header>
  );
}
