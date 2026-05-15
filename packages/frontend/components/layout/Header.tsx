'use client';

export function Header() {
  return (
    <header className="h-14 border-b border-white/[0.06] flex items-center px-4 lg:px-8 justify-between flex-shrink-0 sticky top-0 bg-background/90 backdrop-blur-xl z-30"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Logo — visible on mobile only (sidebar hidden) */}
      <span className="lg:hidden font-heading font-bold text-lg tracking-tight">
        sol<span className="text-accent">bank</span>
      </span>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse lg:hidden" />
        <button className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center hover:bg-accent/20 transition-colors">
          <span className="font-heading text-accent text-xs font-bold">D</span>
        </button>
      </div>
    </header>
  );
}
