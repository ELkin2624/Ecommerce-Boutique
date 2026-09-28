import { Platform } from 'react-native';

// Configuración de IPs y APIs
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL,
  // Claves para pasarelas e IA (configurables vía .env)
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_KEY || '',
};
