import axios from 'axios';
import { setupAuthInterceptors } from './auth-interceptor';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

setupAuthInterceptors(apiClient, BASE_URL);

export default apiClient;
