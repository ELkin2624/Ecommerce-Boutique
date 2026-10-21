import axios from 'axios';
import { setupAuthInterceptors } from './auth-interceptor';
import { setupOfflineInterceptor } from '@/shared/offline';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Interceptor de Inquilino (Multi-Tenant Header con soporte de subdominios y query params)
apiClient.interceptors.request.use((config) => {
  let tenantSlug: string | null = null;

  if (typeof window !== 'undefined') {
    // 1. Detección automática por subdominio en producción (ej. tienda1.fashionstore.com)
    const host = window.location.hostname;
    const parts = host.split('.');
    if (
      parts.length > 2 &&
      parts[0] !== 'www' &&
      parts[0] !== 'api' &&
      parts[0] !== 'localhost'
    ) {
      tenantSlug = parts[0];
    } else {
      // 2. Detección por query param o localStorage en desarrollo local
      const urlParams = new URLSearchParams(window.location.search);
      const queryTenant = urlParams.get('tenant') || urlParams.get('tenant_slug');
      const storedTenant = localStorage.getItem('fashionstore_tenant_slug');

      tenantSlug = queryTenant || storedTenant || null;
    }
  }

  // Rutas SaaS centrales no requieren header de inquilino
  const isSaasUrl =
    config.url?.includes('/saas') || config.url?.includes('/docs');

  if (tenantSlug && !isSaasUrl) {
    config.headers['x-tenant-slug'] = tenantSlug;
  }

  return config;
});

// Registrar interceptor offline primero para capturar fallos de red antes de que se transformen en errores genéricos
setupOfflineInterceptor(apiClient);
setupAuthInterceptors(apiClient, BASE_URL);

export default apiClient;
