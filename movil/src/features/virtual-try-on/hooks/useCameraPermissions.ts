import { useState, useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import type { PermissionStatus } from '../types/camera.types';

export function useCameraPermissions() {
  const { hasPermission, requestPermission: requestNativePermission } = useCameraPermission();
  const [status, setStatus] = useState<PermissionStatus>(
    hasPermission ? 'granted' : 'not-determined'
  );

  // Sincronizar estado cuando hasPermission cambie
  useEffect(() => {
    if (hasPermission) {
      setStatus('granted');
    }
  }, [hasPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestNativePermission();
      setStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.warn('[useCameraPermissions] Error solicitando permiso:', error);
      setStatus('denied');
      return false;
    }
  }, [requestNativePermission]);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.warn('[useCameraPermissions] No se pudo abrir ajustes:', error);
    }
  }, []);

  return {
    hasPermission,
    status,
    requestPermission,
    openSettings,
  };
}
