import { useState, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from 'expo-router';

/**
 * Hook de ciclo de vida para suspender la cámara automáticamente
 * cuando la app va a segundo plano o cuando se navega a otra pantalla.
 */
export function useCameraLifecycle() {
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // La cámara sólo debe recibir energía del sensor si la pantalla está enfocada y en primer plano
  const isSystemActive = isFocused && appState === 'active';

  return {
    isSystemActive,
    appState,
    isFocused,
  };
}
