import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerName?: string;
  primaryColor?: string;
  logoUrl?: string | null;
  settings?: {
    category?: string;
    tagline?: string;
    phone?: string;
    maxBranches?: number;
    maxProducts?: number;
  };
  createdAt?: string;
}

interface TenantState {
  currentTenant: TenantInfo | null;
  availableTenants: TenantInfo[];
  isLoadingTenants: boolean;

  setCurrentTenant: (tenant: TenantInfo) => void;
  setAvailableTenants: (tenants: TenantInfo[]) => void;
  fetchTenants: () => Promise<void>;
  switchTenantBySlug: (slug: string) => Promise<boolean>;
}

const DEFAULT_TENANT: TenantInfo = {
  id: 'boutique-elegance-default',
  name: 'Boutique Elegance',
  slug: 'boutique-elegance',
  plan: 'PRO',
  primaryColor: '#ec4899',
  settings: {
    category: 'Alta costura femenina y elegancia contemporánea',
  },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: DEFAULT_TENANT,
      availableTenants: [DEFAULT_TENANT],
      isLoadingTenants: false,

      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant });
        localStorage.setItem('fashionstore_tenant_slug', tenant.slug);
      },

      setAvailableTenants: (availableTenants) => {
        set({ availableTenants });
      },

      fetchTenants: async () => {
        set({ isLoadingTenants: true });
        try {
          const res = await axios.get(`${API_BASE}/saas/tenants`);
          const tenants: TenantInfo[] = res.data?.data || [];
          if (tenants.length > 0) {
            set({ availableTenants: tenants });
            // If currentTenant is not in fetched list, update or keep
            const current = get().currentTenant;
            const match = tenants.find((t) => t.slug === current?.slug);
            if (match) {
              set({ currentTenant: match });
            } else if (!current || current.slug === DEFAULT_TENANT.slug) {
              set({ currentTenant: tenants[0] });
            }
          }
        } catch (error) {
          console.warn('No se pudieron cargar los inquilinos desde el backend:', error);
        } finally {
          set({ isLoadingTenants: false });
        }
      },

      switchTenantBySlug: async (slug: string) => {
        const { availableTenants } = get();
        const found = availableTenants.find((t) => t.slug === slug);
        if (found) {
          set({ currentTenant: found });
          localStorage.setItem('fashionstore_tenant_slug', found.slug);
          return true;
        }

        try {
          const res = await axios.get(`${API_BASE}/saas/tenants/${slug}`);
          const tenant = res.data?.data;
          if (tenant) {
            set((state) => ({
              currentTenant: tenant,
              availableTenants: state.availableTenants.some((t) => t.slug === tenant.slug)
                ? state.availableTenants
                : [...state.availableTenants, tenant],
            }));
            localStorage.setItem('fashionstore_tenant_slug', tenant.slug);
            return true;
          }
        } catch {
          // not found
        }
        return false;
      },
    }),
    {
      name: 'fashionstore-multitenant',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
      }),
    },
  ),
);
