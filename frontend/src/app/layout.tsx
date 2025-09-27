import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ApolloWrapper } from '@/lib/apollo-wrapper';
import { SocketProvider } from '@/contexts/SocketContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { theme } from '@/theme/theme';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GitHub Clone - Modern Development Platform',
  description: 'A modern GitHub clone built with Next.js, React, and microservices architecture',
  keywords: ['github', 'clone', 'development', 'git', 'repository', 'collaboration'],
  authors: [{ name: 'GitHub Clone Team' }],
  creator: 'GitHub Clone',
  publisher: 'GitHub Clone',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'GitHub Clone - Modern Development Platform',
    description: 'A modern GitHub clone built with Next.js, React, and microservices architecture',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'GitHub Clone',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GitHub Clone',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GitHub Clone - Modern Development Platform',
    description: 'A modern GitHub clone built with Next.js, React, and microservices architecture',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ApolloWrapper>
            <SocketProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </SocketProvider>
          </ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}