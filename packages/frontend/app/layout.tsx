import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Solbank — Your money, always earning',
  description:
    'The first non-custodial neobank on Solana. Earn DeFi yield automatically. Spend anywhere with Visa. You hold the keys.',
  keywords: ['solana', 'neobank', 'defi', 'yield', 'usdc', 'crypto'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${GeistMono.variable}`}
    >
      <body className="bg-background text-white antialiased">{children}</body>
    </html>
  );
}
