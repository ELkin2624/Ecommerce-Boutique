import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FrameProcessorMetrics } from '../types/frame-processor.types';

// Habilitar en desarrollo o pruebas controladas
export const DEBUG_FRAME_PROCESSOR = true;

interface FrameProcessorDebugOverlayProps {
  metrics: FrameProcessorMetrics;
  isCameraActive: boolean;
}

/**
 * Componente de depuración para la Fase 2: Muestra métricas de procesamiento
 * de frames en tiempo real sobre la vista de cámara.
 *
 * Se desactiva completamente en builds de producción.
 */
export const FrameProcessorDebugOverlay: React.FC<FrameProcessorDebugOverlayProps> = ({
  metrics,
  isCameraActive,
}) => {
  const showDebug = __DEV__ || DEBUG_FRAME_PROCESSOR;

  if (!showDebug) {
    return null;
  }

  const isActuallyActive = isCameraActive && metrics.isProcessorActive;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.headerRow}>
        <View
          style={[
            styles.indicatorDot,
            isActuallyActive ? styles.indicatorActive : styles.indicatorInactive,
          ]}
        />
        <Text style={styles.title}>FRAME PROCESSOR (FASE 2)</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>ESTADO:</Text>
        <Text
          style={[
            styles.value,
            { color: isActuallyActive ? '#4ade80' : '#f87171' },
          ]}
        >
          {isActuallyActive ? 'ACTIVO (WORKLET)' : 'EN REPOSO'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>PROCESS FPS:</Text>
        <Text style={styles.value}>
          {isActuallyActive ? metrics.processingFps.toFixed(1) : '0.0'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>FRAMES:</Text>
        <Text style={styles.value}>{metrics.framesProcessed}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>DIMENSIONES:</Text>
        <Text style={styles.value}>
          {metrics.frameWidth > 0 && metrics.frameHeight > 0
            ? `${metrics.frameWidth} × ${metrics.frameHeight}`
            : 'ESPERANDO...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 185,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    minWidth: 175,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  indicatorActive: {
    backgroundColor: '#38bdf8',
  },
  indicatorInactive: {
    backgroundColor: '#64748b',
  },
  title: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  label: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  value: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
