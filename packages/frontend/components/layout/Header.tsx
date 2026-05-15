'use client';

import { useSession, signOut } from 'next-auth/react';
import { AvanorLogo } from '@/components/brand/AvanorLogo';

export function Header() {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

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
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-8 h-8 rounded-full bg-accent-muted border border-accent-border flex items-center justify-center hover:bg-accent/20 transition-colors"
          title="Sign out"
        >
          <span className="font-heading text-accent text-xs font-bold">{initials}</span>
        </button>
      </div>
    </header>
  );
}
