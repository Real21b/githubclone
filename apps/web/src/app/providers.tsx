'use client';

/**
 * Uygulama genelindeki istemci tarafı sağlayıcıları (provider).
 *
 * Next.js App Router'da `layout.tsx` bir **Server Component**'tir; React context
 * kullanan hiçbir sağlayıcı orada doğrudan render edilemez. Bu dosya o sınırı
 * çizer: layout sunucuda kalır, context ağacı buradan aşağısı istemcide çalışır.
 */

import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ApolloWrapper } from '@/lib/apollo-wrapper';
import { theme } from '@/theme/theme';

export function Providers({ children }: { children: ReactNode }) {
  // QueryClient bileşen durumunda tutulur: modül kapsamında oluşturulursa
  // sunucuda tüm istekler arasında paylaşılır ve kullanıcı verisi sızabilir.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <ApolloWrapper>
            <SocketProvider>
              <AuthProvider>
                {children}
                <Toaster position="bottom-right" />
              </AuthProvider>
            </SocketProvider>
          </ApolloWrapper>
        </QueryClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
