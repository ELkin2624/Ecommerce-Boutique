/**
 * Fábrica centralizada de Query Keys para TanStack Query.
 * Previene inconsistencias en nombres de caché e invalidaciones.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  branches: {
    all: ['branches'] as const,
    locations: (branchId?: string) => ['branches', 'locations', branchId] as const,
  },
  catalog: {
    products: (filters?: Record<string, any>) => ['catalog', 'products', filters] as const,
    product: (id: string) => ['catalog', 'product', id] as const,
    categories: ['catalog', 'categories'] as const,
    seasons: ['catalog', 'seasons'] as const,
  },
  inventory: {
    stocks: (branchId?: string, locationId?: string) => ['inventory', 'stocks', branchId, locationId] as const,
    movements: (variantId?: string) => ['inventory', 'movements', variantId] as const,
  },
  reservations: {
    queue: (branchId?: string, status?: string) => ['reservations', 'queue', branchId, status] as const,
    detail: (id: string) => ['reservations', id] as const,
  },
  orders: {
    list: (filters?: Record<string, any>) => ['orders', filters] as const,
    detail: (id: string) => ['orders', id] as const,
  },
  reports: {
    dashboard: (branchId?: string) => ['reports', 'dashboard', branchId] as const,
  },
};
