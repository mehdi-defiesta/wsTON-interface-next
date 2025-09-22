import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WSTON UI',
  description: 'Wrapped Staked TON UI',
  icons: {
    icon: '/favicon.ico?v=1',
    shortcut: '/favicon.ico?v=1',
    apple: '/favicon.ico?v=1',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=1" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}