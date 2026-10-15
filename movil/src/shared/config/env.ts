import { Platform } from 'react-native';

// Configuración de IPs y APIs
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.218.94:3000/api/v1',
  AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL || 'http://192.168.218.94:8000/api/v1',
  // Claves para pasarelas e IA (configurables vía .env)
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_KEY || '',
};
