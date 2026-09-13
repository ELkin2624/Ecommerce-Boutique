import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Tiempos de caché por tipo de recurso:
 *
 * ESTÁTICO (categorías, ciudades, roles, temporadas) → 10 minutos
 *   - Cambian raramente; no necesitan re-fetch en cada visita
 *
 * SEMI-DINÁMICO (sucursales, catálogo, proveedores) → 2 minutos
 *   - Cambian por acciones del admin, no en tiempo real
 *
 * DINÁMICO (inventario, órdenes, reservas, reportes) → 30 segundos (default)
 *   - Cambian frecuentemente durante el día de operación
 *
 * gcTime = 30 min: los datos se mantienen en memoria aunque el componente
 * se desmonte, para que volver a la página no dispare una llamada.
 */
export const STALE_TIMES = {
  STATIC: 10 * 60 * 1000,      // 10 minutos — categorías, ciudades, roles, temporadas
  SEMI: 2 * 60 * 1000,          // 2 minutos  — sucursales, catálogo, proveedores
  DYNAMIC: 30 * 1000,            // 30 segundos — órdenes, inventario, reservas, reportes
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.DYNAMIC, // default: datos dinámicos
      gcTime: 30 * 60 * 1000,         // 30 min en memoria (no re-fetch al volver a una pestaña)
      retry: (failureCount, error: any) => {
        // Axios envía el status en error.response.status
        const status = error?.response?.status ?? error?.statusCode;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always', // sí re-fetch al recuperar conexión de red
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
