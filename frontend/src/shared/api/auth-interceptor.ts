import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { useAuthStore } from '@/app/store/auth.store';
import { ApiError } from './api-error';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

export function setupAuthInterceptors(client: AxiosInstance, baseURL: string) {
  // 1. Request Interceptor: Adjunta Access Token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().accessToken;
      if (token && config.headers) {
        if (typeof (config.headers as any).set === 'function') {
          (config.headers as any).set('Authorization', `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // 2. Response Interceptor: Manejo de 401 con cola de refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Si no es un 401 o la petición ya intentó reintentar o es el endpoint de login/refresh
      if (
        !error.response ||
        error.response.status !== 401 ||
        originalRequest._retry ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      if (isRefreshing) {
        // Encolar peticiones concurrentes mientras se completa el refresh único
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              if (typeof (originalRequest.headers as any).set === 'function') {
                (originalRequest.headers as any).set('Authorization', `Bearer ${token}`);
              } else {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
            }
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearSession();
        isRefreshing = false;
        return Promise.reject(new ApiError(401, 'Sesión expirada. Por favor inicie sesión nuevamente.'));
      }

      try {
        // Llamada directa sin interceptores al endpoint de rotación de refresh token
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // Actualizar store con los nuevos tokens rotados
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          if (typeof (originalRequest.headers as any).set === 'function') {
            (originalRequest.headers as any).set('Authorization', `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
        }

        processQueue(null, newAccessToken);
        return client(originalRequest);
      } catch (refreshError: any) {
        processQueue(new Error('Falló la renovación de token'), null);
        useAuthStore.getState().clearSession();
        // Si el refresh falló o fue revocado, forzar login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(ApiError.fromAxiosError(refreshError));
      } finally {
        isRefreshing = false;
      }
    },
  );
}
