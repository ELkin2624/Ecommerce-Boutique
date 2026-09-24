/**
 * Garment Layer Component (Skia)
 * FashionStore Virtual Try-On - Phase 6, 7 & 8
 *
 * Renders 2D garment textures overlaid on the user's torso with:
 * - Dynamic width matching shoulder span (Escala Dinámica)
 * - Aspect ratio preserved height
 * - Angular rotation matching shoulder tilt (Rotación)
 * - Anatomical shoulder alignment (Posición precisa)
 * - Temporal Exponential Moving Average (EMA) smoothing (Seguimiento Suave)
 * - Smooth fade-in / fade-out opacity transitions
 * - Zero JS per-frame re-renders (100% GPU / Worklet driven)
 */

import React, { memo, useEffect } from 'react';
import { Group, Image, useImage } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { ScreenLandmark } from '../../pose/types/coordinate.types';
import type { VirtualGarment } from '../types/garment.types';
import { calculateGarmentGeometry } from '../utils/garmentAnchor';

export interface GarmentLayerProps {
  readonly garment: VirtualGarment;
  readonly landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  readonly isVisible?: boolean;
}

export const GarmentLayer = memo(function GarmentLayer({
  garment,
  landmarksShared,
  isVisible = true,
}: GarmentLayerProps) {
  // Load local PNG asset using Skia's native texture loader
  const skiaImage = useImage(garment.imageSource, (err) => {
    if (__DEV__) {
      console.warn('[GarmentLayer] Error loading garment texture:', err);
    }
  });

  // Reanimated SharedValues for temporal EMA smoothing (Fase 8 - Seguimiento Suave)
  const smoothAnchorX = useSharedValue(0);
  const smoothAnchorY = useSharedValue(0);
  const smoothWidth = useSharedValue(garment.baseWidth);
  const smoothRotation = useSharedValue(0);
  const smoothOpacity = useSharedValue(0);
  const isInitialized = useSharedValue(false);

  // Reset smoothing state when active garment changes
  useEffect(() => {
    isInitialized.value = false;
    smoothWidth.value = garment.baseWidth;
    smoothRotation.value = 0;
  }, [garment.id, garment.baseWidth, isInitialized, smoothWidth, smoothRotation]);

  // Transform matrix computed directly in worklet thread each frame
  const transform = useDerivedValue(() => {
    'worklet';
    if (!isVisible) {
      smoothOpacity.value = 0;
      return [{ translateX: -4000 }, { translateY: -4000 }];
    }

    const raw = calculateGarmentGeometry(landmarksShared.value, garment);

    if (!raw.isAnchored) {
      // Smooth fade-out when shoulders lose tracking
      smoothOpacity.value = smoothOpacity.value * 0.85;
      if (smoothOpacity.value < 0.02) {
        smoothOpacity.value = 0;
        isInitialized.value = false;
        return [{ translateX: -4000 }, { translateY: -4000 }];
      }
    } else {
      // Smooth fade-in when tracked
      smoothOpacity.value = smoothOpacity.value + (1.0 - smoothOpacity.value) * 0.35;
      if (smoothOpacity.value > 0.98) {
        smoothOpacity.value = 1.0;
      }
    }

    // Exponential Moving Average (EMA) filter:
    // alpha = 0.28 balances responsiveness with buttery smoothness (Snapchat style)
    const alpha = 0.28;
    if (!isInitialized.value && raw.isAnchored) {
      smoothAnchorX.value = raw.anchorX;
      smoothAnchorY.value = raw.anchorY;
      smoothWidth.value = raw.width;
      smoothRotation.value = raw.rotation;
      isInitialized.value = true;
    } else if (raw.isAnchored) {
      smoothAnchorX.value = smoothAnchorX.value * (1 - alpha) + raw.anchorX * alpha;
      smoothAnchorY.value = smoothAnchorY.value * (1 - alpha) + raw.anchorY * alpha;
      smoothWidth.value = smoothWidth.value * (1 - alpha) + raw.width * alpha;
      smoothRotation.value = smoothRotation.value * (1 - alpha) + raw.rotation * alpha;
    }

    const currentAnchorX = smoothAnchorX.value;
    const currentAnchorY = smoothAnchorY.value;
    const currentWidth = smoothWidth.value > 0 ? smoothWidth.value : garment.baseWidth;
    const currentRotation = smoothRotation.value;

    const scale = currentWidth / garment.baseWidth;
    const shoulderRatio = garment.shoulderLineRatio ?? 0.20;
    const localAnchorX = garment.baseWidth / 2;
    const localAnchorY = garment.baseHeight * shoulderRatio;

    // Skia Transform Order:
    // When multiplying transform matrices in Skia (acc * next), point P is transformed
    // by the LAST array item first:
    // 1. Shift local anchor (baseWidth/2, shoulderLineBaseY) to origin (0, 0)
    // 2. Scale uniformly by scale factor
    // 3. Rotate around origin by shoulder tilt angle
    // 4. Translate to screen anchor (currentAnchorX, currentAnchorY)
    return [
      { translateX: currentAnchorX },
      { translateY: currentAnchorY },
      { rotate: currentRotation },
      { scale: scale },
      { translateX: -localAnchorX },
      { translateY: -localAnchorY },
    ];
  });

  if (!skiaImage) {
    return null;
  }

  return (
    <Group opacity={smoothOpacity} transform={transform}>
      <Image
        image={skiaImage}
        x={0}
        y={0}
        width={garment.baseWidth}
        height={garment.baseHeight}
        fit="contain"
      />
    </Group>
  );
});
