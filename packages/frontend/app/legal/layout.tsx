import Link from 'next/link';
import { AvanorLogo } from '@/components/brand/AvanorLogo';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl flex items-center px-6 justify-between">
        <Link href="/">
          <AvanorLogo size={28} showWordmark />
        </Link>
        <Link
          href="/auth/signin"
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-[#0A0A0A] text-sm font-semibold rounded-lg transition-colors"
        >
          Launch App
        </Link>
      </nav>
      <main className="pt-28 pb-20 px-6">
        <article className="max-w-2xl mx-auto prose-invert">
          {children}
        </article>
      </main>
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
