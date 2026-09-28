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

import React, { memo, useEffect, useMemo } from 'react';
import { Group, Image, Skia, useImage, type SkImage } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { ScreenLandmark } from '../../pose/types/coordinate.types';
import type { VirtualGarment } from '../types/garment.types';
import { calculateGarmentGeometry } from '../utils/garmentAnchor';
import { DEFAULT_GARMENT } from '../data/garmentAssets';

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
  // Check if garment has a base64 data URL (output from backend-python /remove-background)
  const isBase64 =
    typeof garment.imageSource === 'string' &&
    (garment.imageSource.startsWith('data:') || garment.imageSource.includes(';base64,'));

  // 1. Decode base64 synchronously using Skia native C++ factory
  const base64SkiaImage = useMemo<SkImage | null>(() => {
    if (!isBase64 || typeof garment.imageSource !== 'string') return null;
    try {
      const raw = garment.imageSource.includes(';base64,')
        ? garment.imageSource.split(';base64,')[1]
        : garment.imageSource;
      let clean = raw.trim();
      if (clean.includes('%')) {
        try {
          clean = decodeURIComponent(clean);
        } catch {}
      }
      clean = clean.replace(/[\r\n\s]/g, '');
      if (!clean) return null;
      const data = Skia.Data.fromBase64(clean);
      if (!data) return null;
      const img = Skia.Image.MakeImageFromEncoded(data);
      if (__DEV__ && img) {
        console.log(`[GarmentLayer] Successfully loaded AI transparent texture: ${img.width()}x${img.height()}px`);
      }
      return img;
    } catch (err) {
      if (__DEV__) {
        console.warn('[GarmentLayer] Error decoding base64 garment texture:', err);
      }
      return null;
    }
  }, [isBase64, garment.imageSource]);

  // 2. Load standard network URL (http/https) or local asset number via Skia useImage hook
  // When isBase64 is true, pass null to avoid unsupported fetch() calls in Skia on Android
  const standardSkiaImage = useImage(isBase64 ? null : garment.imageSource, (err) => {
    if (__DEV__) {
      console.warn('[GarmentLayer] Error loading garment texture via useImage:', err);
    }
  });

  // 3. Always keep fallback texture loaded to prevent invisible garment while remote image is loading
  const fallbackSource = garment.fallbackImageSource ?? DEFAULT_GARMENT.imageSource;
  const fallbackSkiaImage = useImage(fallbackSource);

  // Multi-tier texture resolution:
  // 1. AI cutout base64 texture (WebP with alpha channel from FastAPI)
  // 2. Standard Skia image (HTTP URL or local require asset)
  // 3. Fallback preset texture (ensures AR garment is always visible)
  const effectiveImage = base64SkiaImage ?? standardSkiaImage ?? fallbackSkiaImage;

  // Reanimated SharedValues for temporal EMA smoothing (Fase 8 - Seguimiento Suave)
  const smoothAnchorX = useSharedValue(0);
  const smoothAnchorY = useSharedValue(0);
  const smoothWidth = useSharedValue(garment.baseWidth);
  const smoothRotation = useSharedValue(0);
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
      return [{ translateX: -9999 }, { translateY: -9999 }];
    }

    const raw = calculateGarmentGeometry(landmarksShared.value, garment);

    if (!raw.isAnchored) {
      isInitialized.value = false;
      return [{ translateX: -9999 }, { translateY: -9999 }];
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

  if (!effectiveImage) {
    return null;
  }

  return (
    <Group transform={transform}>
      <Image
        image={effectiveImage}
        x={0}
        y={0}
        width={garment.baseWidth}
        height={garment.baseHeight}
        fit="contain"
      />
    </Group>
  );
});
