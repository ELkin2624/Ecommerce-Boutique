import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, type CameraOutput } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import type { CameraPosition } from '../types/camera.types';

interface CameraViewProps {
  position: CameraPosition;
  isActive: boolean;
  isSystemActive: boolean;
  targetFps?: number;
  frameOutput?: CameraOutput;
  onError?: (error: Error) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  position,
  isActive,
  isSystemActive,
  targetFps = 30,
  frameOutput,
  onError,
}) => {
  const device = useCameraDevice(position);

  // Fallback si el dispositivo no posee el sensor solicitado (ej: sin cámara frontal)
  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={54} color="#f87171" />
        <Text style={styles.errorTitle}>Cámara no disponible</Text>
        <Text style={styles.errorSubtitle}>
          No se detectó un sensor para la posición seleccionada ({position}).
        </Text>
      </View>
    );
  }

  // La cámara sólo captura activamente si el usuario no la pausó y el sistema está en foco/foreground
  const effectiveActive = isActive && isSystemActive;

  return (
    <View style={styles.container}>
      <Camera
        style={styles.cameraFill}
        device={device}
        isActive={effectiveActive}
        constraints={targetFps ? [{ fps: targetFps }] : undefined}
        outputs={frameOutput ? [frameOutput] : undefined}
        mirrorMode={position === 'front' ? 'on' : 'off'}
        resizeMode="cover"
        onError={(err: Error) => {
          console.warn('[CameraView] Error de captura:', err);
          onError?.(err);
        }}
      />

      {/* Overlay cuando el usuario suspende manualmente la cámara para liberar recursos */}
      {!isActive && (
        <View style={styles.pausedOverlay}>
          <View style={styles.pausedCard}>
            <Ionicons name="pause-circle-outline" size={48} color="#ffffff" />
            <Text style={styles.pausedTitle}>Cámara en Reposo</Text>
            <Text style={styles.pausedSubtitle}>
              Captura suspendida para ahorrar batería y liberar el hardware.
            </Text>
          </View>
        </View>
      )}

      {/* Overlay cuando la app va a segundo plano */}
      {isActive && !isSystemActive && (
        <View style={styles.pausedOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.pausedSubtitle}>Reanudando sensor...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  cameraFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pausedCard: {
    alignItems: 'center',
    maxWidth: 280,
  },
  pausedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 6,
  },
  pausedSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
  },
});
