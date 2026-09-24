/**
 * Pose Debug Overlay
 * FashionStore Virtual Try-On - Phase 3
 *
 * Visual HUD displaying local AI inference latency, FPS, valid keypoints,
 * and detection status for development and verification.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PoseMetrics, PoseStatus } from '../types/pose.types';

export interface PoseDebugOverlayProps {
  readonly metrics: PoseMetrics;
  readonly status: PoseStatus;
  readonly isVisible?: boolean;
}

const STATUS_LABELS: Record<PoseStatus, { label: string; color: string; bg: string }> = {
  idle: { label: 'En Pausa', color: '#9CA3AF', bg: 'rgba(55, 65, 81, 0.7)' },
  'loading-model': { label: 'Cargando IA...', color: '#60A5FA', bg: 'rgba(30, 58, 138, 0.7)' },
  ready: { label: 'Cuerpo Detectado', color: '#34D399', bg: 'rgba(6, 78, 59, 0.7)' },
  'no-pose': { label: 'Sin Pose', color: '#FBBF24', bg: 'rgba(120, 53, 15, 0.7)' },
  'low-confidence': { label: 'Baja Confianza', color: '#F97316', bg: 'rgba(124, 45, 18, 0.7)' },
  error: { label: 'Error IA', color: '#F87171', bg: 'rgba(127, 29, 29, 0.7)' },
};

export const PoseDebugOverlay = memo(function PoseDebugOverlay({
  metrics,
  status,
  isVisible = __DEV__,
}: PoseDebugOverlayProps) {
  if (!isVisible) {
    return null;
  }

  const statusConfig = STATUS_LABELS[status] ?? STATUS_LABELS.idle;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.card}>
        {/* Header: Model & Status Badge */}
        <View style={styles.row}>
          <Text style={styles.title}>MoveNet Lightning (Local IA)</Text>
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.indicator, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.badgeText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.grid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Inferencia</Text>
            <Text style={styles.metricValue}>
              {metrics.inferenceTimeMs.toFixed(1)} <Text style={styles.unit}>ms</Text>
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>FPS IA</Text>
            <Text style={styles.metricValue}>
              {metrics.inferenceFps.toFixed(1)} <Text style={styles.unit}>fps</Text>
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Landmarks</Text>
            <Text style={styles.metricValue}>
              {metrics.validLandmarksCount} <Text style={styles.unit}>/ 17</Text>
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Confianza</Text>
            <Text style={styles.metricValue}>
              {Math.round(metrics.poseScore * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.4)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  unit: {
    fontSize: 9,
    fontWeight: '400',
    color: '#9CA3AF',
  },
});
