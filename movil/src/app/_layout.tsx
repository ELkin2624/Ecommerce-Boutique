import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { BoutiquePalette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <ThemeProvider value={BoutiqueTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
