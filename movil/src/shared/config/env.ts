import { Platform } from 'react-native';

// Configuración de IPs y APIs
// La IP de la máquina anfitriona en la red Wi-Fi local es 192.168.8.94
const DEFAULT_HOST = 'http://192.168.8.94:3000';

export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || `${DEFAULT_HOST}/api/v1`,
  AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL || 'http://192.168.8.94:8000/api/v1',
  // Claves para pasarelas e IA (configurables vía .env)
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || 'pk_test_placeholder_coloca_tu_clave_publica_aqui',
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_KEY || 'AIzaSy_placeholder_coloca_tu_clave_gemini_aqui',
};
