import { ENV } from '../config/env';
import { appStorage } from '../lib/storage';
import { TENANT_STORAGE_KEYS } from '@/entities/tenant/types';

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl = ENV.API_URL;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  private async getHeaders(customToken?: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const [token, tenantSlug] = await Promise.all([
      customToken ? Promise.resolve(customToken) : appStorage.getItem('auth_token'),
      appStorage.getItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG),
    ]);

    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const rawMessage = errBody?.message || errBody?.data?.message;
      const resolvedMessage = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || `Error HTTP ${response.status}`;
      const error: any = new Error(resolvedMessage);
      error.status = response.status;
      throw error;
    }
    const json = await response.json();
    return json && typeof json === 'object' && 'data' in json && 'statusCode' in json
      ? json.data
      : json;
  }

  private async refreshTokenRequest(): Promise<string | null> {
    const [refreshToken, tenantSlug] = await Promise.all([
      appStorage.getItem('refresh_token'),
      appStorage.getItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG),
    ]);
    if (!refreshToken) return null;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (tenantSlug) {
        headers['X-Tenant-Slug'] = tenantSlug;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) throw new Error('Refresh failed');

      const raw = await response.json();
      const data = raw?.data || raw;
      await appStorage.setItem('auth_token', data.accessToken);
      await appStorage.setItem('refresh_token', data.refreshToken);
      return data.accessToken;
    } catch (err) {
      // If refresh fails, clear tokens
      await appStorage.removeItem('auth_token');
      await appStorage.removeItem('refresh_token');
      return null;
    }
  }

  private async fetchWithInterceptor(url: string, options: RequestInit): Promise<Response> {
    let response = await fetch(url, options);

    if (response.status === 401) {
      // Intento de refrescar token
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshPromise = this.refreshTokenRequest();
        this.refreshPromise.finally(() => {
          this.isRefreshing = false;
          this.refreshPromise = null;
        });
      }

      const newToken = await this.refreshPromise;
      if (newToken) {
        // Reintentar request original con el nuevo token
        const newHeaders = await this.getHeaders(newToken);
        options.headers = newHeaders;
        response = await fetch(url, options);
      }
    }

    return response;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const headers = await this.getHeaders();
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const response = await this.fetchWithInterceptor(url, { method: 'GET', headers });
    return this.handleResponse(response);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithInterceptor(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithInterceptor(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithInterceptor(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
  }
}

export const apiClient = new ApiClient();
