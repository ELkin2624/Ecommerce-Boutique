import { apiClient } from '@/shared/api/axios-client';
import type { LoginPayload, AuthSession } from '@/shared/types/api';

export interface ClientRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export const clientAuthApi = {
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },

  register: async (payload: ClientRegisterPayload): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },
};
