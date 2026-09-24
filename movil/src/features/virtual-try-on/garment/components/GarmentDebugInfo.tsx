/**
 * Garment Debug Info Component
 * FashionStore Virtual Try-On - Phase 6
 *
 * Displays live debug metrics for garment state, anchoring, and dimensions.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GarmentStatus, VirtualGarment } from '../types/garment.types';

export interface GarmentDebugInfoProps {
  readonly isVisible?: boolean;
  readonly garment: VirtualGarment;
  readonly status: GarmentStatus;
}

export const GarmentDebugInfo = memo(function GarmentDebugInfo({
  isVisible = true,
  garment,
  status,
}: GarmentDebugInfoProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.badge} pointerEvents="none">
      <View style={styles.header}>
        <Text style={styles.title}>PRENDA 2D (FASE 6)</Text>
        <Text style={[styles.status, status === 'GARMENT_READY' ? styles.ready : styles.error]}>
          {status}
        </Text>
      </View>
      <Text style={styles.name}>{garment.name}</Text>
      <Text style={styles.meta}>
        Anchor: SHOULDER_CENTER | Size: {garment.baseWidth}×{garment.baseHeight} | Offset: -{garment.topOffset}px
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 96,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    maxWidth: 240,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  status: {
    fontSize: 8,
    fontWeight: '800',
  },
  ready: {
    color: '#4ade80',
  },
  error: {
    color: '#f87171',
  },
  name: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    color: '#94a3b8',
    fontSize: 8,
    marginTop: 2,
  },
});
