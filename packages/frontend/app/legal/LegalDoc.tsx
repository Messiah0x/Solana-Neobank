import { ReactNode } from 'react';

export function LegalTitle({ children, updated }: { children: ReactNode; updated: string }) {
  return (
    <header className="mb-10">
      <h1 className="font-heading font-bold text-3xl md:text-4xl text-ivory mb-3">{children}</h1>
      <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Last updated: {updated}</p>
    </header>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-heading font-bold text-lg text-ivory mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-white/50 leading-relaxed">{children}</div>
    </section>
  );
}
