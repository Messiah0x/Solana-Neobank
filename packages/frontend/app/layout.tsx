import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/react';
import { PrivyAuthProvider } from '@/components/providers/PrivyAuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './globals.css';

const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('avanor_theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`;

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // enables safe-area-inset-* on iPhone notch + home bar
  themeColor: '#0A0A0A',
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://solana-neobank-beta.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Avanor — Your money, always earning',
    template: '%s | Avanor',
  },
  description:
    'The first non-custodial private banking platform on Solana. Earn DeFi yield automatically. Spend anywhere with Visa. You hold the keys.',
  keywords: ['solana', 'neobank', 'defi', 'yield', 'usdc', 'crypto', 'avanor', 'non-custodial', 'marginfi'],
  applicationName: 'Avanor',
  openGraph: {
    type: 'website',
    siteName: 'Avanor',
    title: 'Avanor — Your money, always earning',
    description:
      'The first non-custodial neobank on Solana. Earn DeFi yield automatically. You hold the keys.',
    url: SITE_URL,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Avanor — non-custodial neobank on Solana' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avanor — Your money, always earning',
    description:
      'The first non-custodial neobank on Solana. Earn DeFi yield automatically. You hold the keys.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${GeistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-background text-white antialiased">
          <ThemeProvider>
            <PrivyAuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </PrivyAuthProvider>
          </ThemeProvider>
          <Analytics />
        </body>
    </html>
  );
}
