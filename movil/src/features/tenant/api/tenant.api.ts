import { apiClient } from '@/shared/api/api-client';
import type { TenantInfo } from '@/entities/tenant/types';

/**
 * Servicio HTTP para consultar las tiendas/tenants registradas en el ecosistema SaaS.
 * Las rutas /saas/tenants son públicas y no requieren cabecera X-Tenant-Slug previa.
 */
export const tenantApi = {
  /**
   * Obtiene todas las tiendas activas sin importar el plan (STARTER, PRO, ENTERPRISE).
   */
  async getAllTenants(): Promise<TenantInfo[]> {
    const response = await apiClient.get<TenantInfo[]>('/saas/tenants');
    if (!Array.isArray(response)) return [];
    return response.map((t) => ({
      ...t,
      category: t.category || (t.settings as any)?.category || 'Moda Femenina & Boutiques',
    }));
  },

  /**
   * Obtiene la información pública de una tienda específica por su slug.
   */
  async getTenantBySlug(slug: string): Promise<TenantInfo> {
    return apiClient.get<TenantInfo>(`/saas/tenants/${slug}`);
  },
};
