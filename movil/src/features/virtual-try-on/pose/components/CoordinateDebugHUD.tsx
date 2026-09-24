/**
 * Coordinate Debug HUD Component
 * FashionStore Virtual Try-On - Phase 4
 *
 * Displays live numeric inspection of Model, Frame, and Preview coordinates
 * for critical keypoints (nose, shoulders) without console flooding.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LandmarkDebugSample } from '../types/coordinate.types';

export interface CoordinateDebugHUDProps {
  readonly isVisible?: boolean;
  readonly isMirrored: boolean;
  readonly previewWidth: number;
  readonly previewHeight: number;
  readonly samples: readonly LandmarkDebugSample[];
}

export const CoordinateDebugHUD = memo(function CoordinateDebugHUD({
  isVisible = true,
  isMirrored,
  previewWidth,
  previewHeight,
  samples,
}: CoordinateDebugHUDProps) {
  if (!isVisible || samples.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.header}>
        <Text style={styles.title}>TELEMETRÍA COORDENADAS (FASE 4)</Text>
        <Text style={styles.meta}>
          Preview: {Math.round(previewWidth)}×{Math.round(previewHeight)} | Mirror:{' '}
          {isMirrored ? 'ON' : 'OFF'}
        </Text>
      </View>

      {samples.map((sample) => (
        <View key={sample.name} style={styles.sampleCard}>
          <View style={styles.sampleHeader}>
            <Text style={styles.sampleName}>{sample.name.toUpperCase()}</Text>
            <Text
              style={[
                styles.sampleScore,
                { color: sample.score >= 0.5 ? '#34d399' : '#fbbf24' },
              ]}
            >
              conf: {Math.round(sample.score * 100)}%
            </Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>MODEL [0..1]</Text>
              <Text style={styles.colVal}>
                x: {sample.modelX.toFixed(2)}
              </Text>
              <Text style={styles.colVal}>
                y: {sample.modelY.toFixed(2)}
              </Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.colLabel}>FRAME [px]</Text>
              <Text style={styles.colVal}>
                x: {Math.round(sample.frameX)}
              </Text>
              <Text style={styles.colVal}>
                y: {Math.round(sample.frameY)}
              </Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.colLabel}>PREVIEW [px]</Text>
              <Text style={[styles.colVal, styles.previewHighlight]}>
                x: {Math.round(sample.previewX)}
              </Text>
              <Text style={[styles.colVal, styles.previewHighlight]}>
                y: {Math.round(sample.previewY)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 4,
  },
  title: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  meta: {
    color: '#94a3b8',
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  sampleCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sampleName: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '700',
  },
  sampleScore: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 1,
  },
  colVal: {
    color: '#cbd5e1',
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  previewHighlight: {
    color: '#38bdf8',
    fontWeight: '700',
  },
});
