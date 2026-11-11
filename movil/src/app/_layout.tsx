import { DefaultTheme, ThemeProvider, Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTenantStore } from '@/features/tenant/store/tenant.store';
import { BoutiquePalette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'stores',
  initialRouteName: 'stores',
};

const BoutiqueTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BoutiquePalette.men.primary,
    background: BoutiquePalette.men.surface,
    card: '#ffffff',
    text: BoutiquePalette.men.navy,
    border: '#e2e8f0',
  },
};

export default function RootLayout() {
  const { hydrate } = useAuth();
  const { currentTenant, isHydrated: isTenantHydrated, hydrateTenant } = useTenantStore();
  const segments = useSegments();

  useEffect(() => {
    hydrateTenant().then(() => {
      hydrate();
    });
  }, [hydrateTenant, hydrate]);

  // Redirigir automáticamente al Directorio de Tiendas si aún no eligió una tienda
  useEffect(() => {
    if (!isTenantHydrated) return;

    const inStoresScreen = segments[0] === 'stores';
    if (!currentTenant && !inStoresScreen) {
      router.replace('/stores' as any);
    }
  }, [isTenantHydrated, currentTenant, segments]);

  return (
    <ThemeProvider value={BoutiqueTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="stores" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
