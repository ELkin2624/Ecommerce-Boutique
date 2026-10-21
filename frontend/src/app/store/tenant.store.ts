import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { apiClient } from '@/shared/api/axios-client';
import { queryClient } from '@/app/providers/QueryProvider';
import { offlineApi } from '@/shared/offline/client/offline-api-client';
import { useAuthStore } from './auth.store';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerName?: string;
  ownerEmail?: string;
  phone?: string;
  primaryColor?: string;
  logoUrl?: string | null;
  category?: string;
  domain?: string;
  membershipRole?: string;
  settings?: {
    category?: string;
    tagline?: string;
    phone?: string;
    maxStores?: number;
    maxBranches?: number;
    maxProducts?: number;
  };
  createdAt?: string;
}

export interface PlanQuotaInfo {
  effectivePlan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  planName: string;
  ownedCount: number;
  maxStores: number;
  remainingStores: number;
  canCreateMore: boolean;
}

export interface CreateStoreInPanelPayload {
  name: string;
  slug: string;
  category?: string;
  phone?: string;
  primaryColor?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  phone?: string;
  category?: string;
  tagline?: string;
  announcement?: string;
  address?: string;
  hero?: {
    headlinePrefix?: string;
    headlineHighlight?: string;
    description?: string;
    bannerUrl?: string;
    primaryCtaText?: string;
  };
  contact?: {
    whatsapp?: string;
    email?: string;
    instagram?: string;
    address?: string;
  };
}

interface TenantState {
  currentTenant: TenantInfo | null;
  availableTenants: TenantInfo[];
  myTenants: TenantInfo[];
  planQuota: PlanQuotaInfo | null;
  isLoadingTenants: boolean;
  isSwitchingTenant: boolean;

  setCurrentTenant: (tenant: TenantInfo | null) => void;
  setAvailableTenants: (tenants: TenantInfo[]) => void;
  fetchTenants: () => Promise<void>;
  fetchMyTenants: () => Promise<void>;
  switchTenantBySlug: (slug: string) => Promise<boolean>;
  switchActiveTenant: (slug: string) => Promise<TenantInfo>;
  createStoreFromPanel: (
    payload: CreateStoreInPanelPayload,
    autoSwitch?: boolean,
  ) => Promise<{ tenant: TenantInfo; planQuota: PlanQuotaInfo }>;
  updateStoreProfile: (payload: UpdateTenantPayload) => Promise<TenantInfo>;
  clearTenantContext: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      availableTenants: [],
      myTenants: [],
      planQuota: null,
      isLoadingTenants: false,
      isSwitchingTenant: false,

      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant });
        if (tenant?.slug) {
          localStorage.setItem('fashionstore_tenant_slug', tenant.slug);
        } else {
          localStorage.removeItem('fashionstore_tenant_slug');
        }
      },

      setAvailableTenants: (availableTenants) => {
        set({ availableTenants });
      },

      clearTenantContext: () => {
        set({
          currentTenant: null,
          myTenants: [],
          planQuota: null,
        });
        localStorage.removeItem('fashionstore_tenant_slug');
      },

      fetchTenants: async () => {
        set({ isLoadingTenants: true });
        try {
          const res = await axios.get(`${API_BASE}/saas/tenants`);
          const tenants: TenantInfo[] = res.data?.data || [];
          set({ availableTenants: tenants });

          const storedSlug = localStorage.getItem('fashionstore_tenant_slug');
          if (storedSlug && tenants.length > 0) {
            const match = tenants.find((t) => t.slug === storedSlug);
            if (match) {
              set({ currentTenant: match });
            }
          }
        } catch (error) {
          console.warn('No se pudieron cargar los inquilinos desde el backend:', error);
        } finally {
          set({ isLoadingTenants: false });
        }
      },

      fetchMyTenants: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        set({ isLoadingTenants: true });
        try {
          const res = await apiClient.get('/saas/my-tenants');
          const data = res.data?.data || res.data;
          const myTenants: TenantInfo[] = data?.tenants || [];
          const planQuota: PlanQuotaInfo | null = data?.planQuota || null;

          set({
            myTenants,
            availableTenants: myTenants,
            planQuota,
          });

          const current = get().currentTenant;
          const storedSlug = localStorage.getItem('fashionstore_tenant_slug');
          const activeSlug = current?.slug || storedSlug;

          if (activeSlug && myTenants.length > 0) {
            const match = myTenants.find((t) => t.slug === activeSlug);
            if (match) {
              set({ currentTenant: match });
              localStorage.setItem('fashionstore_tenant_slug', match.slug);
            }
          }
        } catch (error) {
          console.warn('No se pudieron cargar las tiendas del usuario autenticado:', error);
        } finally {
          set({ isLoadingTenants: false });
        }
      },

      switchTenantBySlug: async (slug: string) => {
        const { availableTenants, myTenants } = get();
        const found =
          myTenants.find((t) => t.slug === slug) ||
          availableTenants.find((t) => t.slug === slug);

        if (found) {
          await offlineApi.clearTenantCache();
          queryClient.clear();
          set({ currentTenant: found });
          localStorage.setItem('fashionstore_tenant_slug', found.slug);
          return true;
        }

        try {
          const res = await axios.get(`${API_BASE}/saas/tenants/${slug}`);
          const tenant = res.data?.data;
          if (tenant) {
            await offlineApi.clearTenantCache();
            queryClient.clear();
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

      switchActiveTenant: async (slug: string) => {
        set({ isSwitchingTenant: true });
        try {
          const res = await apiClient.post('/saas/switch-tenant', { slug });
          const data = res.data?.data || res.data;

          // 1. Limpiar cachés de React Query e IndexedDB del tenant anterior
          await offlineApi.clearTenantCache();
          queryClient.clear();

          // 2. Actualizar contexto de tienda activa
          const targetTenant: TenantInfo = data.tenant;
          localStorage.setItem('fashionstore_tenant_slug', targetTenant.slug);
          set({ currentTenant: targetTenant });

          // 3. Actualizar sesión autenticada con el usuario y tokens del esquema destino
          if (data.user && data.accessToken) {
            useAuthStore.getState().setSession({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            });
          }

          return targetTenant;
        } finally {
          set({ isSwitchingTenant: false });
        }
      },

      createStoreFromPanel: async (
        payload: CreateStoreInPanelPayload,
        autoSwitch = true,
      ) => {
        const res = await apiClient.post('/saas/my-tenants', payload, {
          timeout: 60000,
        });
        const data = res.data?.data || res.data;

        const createdTenant: TenantInfo | undefined = data?.tenant;
        if (!createdTenant?.slug) {
          throw new Error(
            data?.message || 'No se recibió la información de la tienda creada desde el servidor.',
          );
        }
        const updatedQuota: PlanQuotaInfo = data.planQuota;
        const session = data.session;

        set((state) => ({
          myTenants: [
            createdTenant,
            ...state.myTenants.filter((t) => t.slug !== createdTenant.slug),
          ],
          availableTenants: [
            createdTenant,
            ...state.availableTenants.filter((t) => t.slug !== createdTenant.slug),
          ],
          planQuota: updatedQuota || state.planQuota,
        }));

        if (autoSwitch && createdTenant) {
          await offlineApi.clearTenantCache();
          queryClient.clear();
          localStorage.setItem('fashionstore_tenant_slug', createdTenant.slug);
          set({ currentTenant: createdTenant });

          if (session?.user && session?.accessToken) {
            useAuthStore.getState().setSession({
              user: session.user,
              accessToken: session.accessToken,
              refreshToken: session.refreshToken,
            });
          }
        }

        return {
          tenant: createdTenant,
          planQuota: updatedQuota,
        };
      },

      updateStoreProfile: async (payload: UpdateTenantPayload) => {
        const current = get().currentTenant;
        if (!current?.slug) {
          throw new Error('No hay una tienda activa seleccionada.');
        }

        const res = await apiClient.patch(`/saas/tenants/${current.slug}/profile`, payload);
        const updatedTenant: TenantInfo = res.data?.data || res.data;

        set((state) => ({
          currentTenant: updatedTenant,
          myTenants: state.myTenants.map((t) =>
            t.slug === updatedTenant.slug ? { ...t, ...updatedTenant } : t,
          ),
          availableTenants: state.availableTenants.map((t) =>
            t.slug === updatedTenant.slug ? { ...t, ...updatedTenant } : t,
          ),
        }));

        return updatedTenant;
      },
    }),
    {
      name: 'fashionstore-multitenant',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        myTenants: state.myTenants,
        planQuota: state.planQuota,
      }),
    },
  ),
);
