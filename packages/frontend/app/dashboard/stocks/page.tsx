'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { XStocksSection } from '@/components/portfolio/XStocksSection';

export default function StocksPage() {
  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-10">
          <div className="px-4 pt-5 lg:px-8 lg:pt-8 max-w-2xl mx-auto space-y-5">

            <div className="mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">Markets</p>
              <h1 className="text-2xl font-bold text-ivory">Stocks</h1>
            </div>

            <XStocksSection />

          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
