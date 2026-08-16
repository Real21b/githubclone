import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const title = 'GitHub Clone — Modern Development Platform';
const description = 'Modern bir Git barındırma ve işbirliği platformu.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: title, template: '%s · GitHub Clone' },
  description,
  keywords: ['github', 'git', 'repository', 'collaboration', 'code review'],
  applicationName: 'GitHub Clone',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title,
    description,
    url: appUrl,
    siteName: 'GitHub Clone',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GitHub Clone' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
  // NOT: `verification.google` alanı kaldırıldı — 'your-google-verification-code'
  // yer tutucusu üretime çıkarsa doğrulama sessizce başarısız olur.
};

// Next 14+ : themeColor ve viewport `metadata` içinde değil, ayrı export'ta olmalı.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
