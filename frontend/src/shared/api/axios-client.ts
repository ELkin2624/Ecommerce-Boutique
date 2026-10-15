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
  timeout: 15000,
});

// Interceptor de Inquilino (Multi-Tenant Header)
apiClient.interceptors.request.use((config) => {
  let tenantSlug = 'boutique-elegance';

  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const queryTenant = urlParams.get('tenant') || urlParams.get('tenant_slug');
    const storedTenant = localStorage.getItem('fashionstore_tenant_slug');

    tenantSlug = queryTenant || storedTenant || 'boutique-elegance';
  }

  if (tenantSlug) {
    config.headers['x-tenant-slug'] = tenantSlug;
  }

  return config;
});

// Registrar interceptor offline primero para capturar fallos de red antes de que se transformen en errores genéricos
setupOfflineInterceptor(apiClient);
setupAuthInterceptors(apiClient, BASE_URL);

export default apiClient;
