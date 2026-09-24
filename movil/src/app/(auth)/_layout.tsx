import { Stack } from 'expo-router';
import { BoutiquePalette } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BoutiquePalette.men.surface },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="register" options={{ title: 'Crear cuenta' }} />
    </Stack>
  );
}
