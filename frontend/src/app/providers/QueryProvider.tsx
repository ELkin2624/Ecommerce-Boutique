import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 segundos por defecto
      retry: (failureCount, error: any) => {
        // No reintentar en 401, 403 o 404
        if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 404) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
