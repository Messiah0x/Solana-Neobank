import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
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

export const metadata: Metadata = {
  title: 'Avanor — Your money, always earning',
  description:
    'The first non-custodial private banking platform on Solana. Earn DeFi yield automatically. Spend anywhere with Visa. You hold the keys.',
  keywords: ['solana', 'neobank', 'defi', 'yield', 'usdc', 'crypto', 'avanor'],
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
        </body>
    </html>
  );
}
