/**
 * Pose Canvas (Root Skia Renderer)
 * FashionStore Virtual Try-On - Phase 5
 *
 * Root transparent Skia Canvas mounted on top of CameraView.
 * Renders body landmarks and skeleton bones at native 60 FPS without intercepting UI gestures.
 */

import React, { memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { ScreenLandmark } from '../../pose/types/coordinate.types';
import type { SkeletonRenderConfig } from '../types/render.types';
import type { VirtualGarment } from '../../garment/types/garment.types';
import { DEFAULT_SKELETON_CONFIG } from '../config/poseSkeletonConfig';
import { LandmarkPoints } from './LandmarkPoints';
import { PoseSkeleton } from './PoseSkeleton';
import { GarmentLayer } from '../../garment/components/GarmentLayer';

export interface PoseCanvasProps {
  readonly landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  readonly isVisible?: boolean;
  readonly showSkeleton?: boolean;
  readonly showPoints?: boolean;
  readonly garment?: VirtualGarment;
  readonly showGarment?: boolean;
  readonly config?: SkeletonRenderConfig;
  readonly children?: ReactNode;
}

export const PoseCanvas = memo(function PoseCanvas({
  landmarksShared,
  isVisible = true,
  showSkeleton = true,
  showPoints = true,
  garment,
  showGarment = true,
  config = DEFAULT_SKELETON_CONFIG,
  children,
}: PoseCanvasProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {/* 1. Capa de Prenda 2D (Fase 6) */}
      {garment && (
        <GarmentLayer
          key={garment.id}
          garment={garment}
          landmarksShared={landmarksShared}
          isVisible={showGarment}
        />
      )}

      {/* Children opcionales */}
      {children}

      {/* 2. Huesos anatómicos de esqueleto (Overlay de depuración) */}
      {showSkeleton && (
        <PoseSkeleton landmarksShared={landmarksShared} config={config} />
      )}

      {/* 17 Keypoint Dots */}
      {showPoints && (
        <LandmarkPoints landmarksShared={landmarksShared} config={config} />
      )}
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFill,
  },
});
