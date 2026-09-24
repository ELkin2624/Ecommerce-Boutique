/**
 * Pose Render Data Hook
 * FashionStore Virtual Try-On - Phase 5
 *
 * Transforms raw normalized MoveNet landmarks into preview screen coordinates
 * and applies Exponential Moving Average (EMA) smoothing to eliminate high-frequency jitter.
 * Operates purely on Reanimated SharedValues for zero-JS-overhead 60 FPS rendering.
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { PoseLandmark } from '../../pose/types/pose.types';
import type { FrameSize, PreviewSize, ScreenLandmark } from '../../pose/types/coordinate.types';
import { convertToScreenLandmarks } from '../../pose/utils/screenLandmarks';
import { DEFAULT_SKELETON_CONFIG } from '../config/poseSkeletonConfig';

export interface UsePoseRenderDataProps {
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  readonly previewSize: PreviewSize;
  readonly isMirrored: boolean;
  readonly frameSize?: FrameSize;
  readonly minScore?: number;
  readonly smoothingAlpha?: number;
}

export interface UsePoseRenderDataReturn {
  readonly screenLandmarksShared: SharedValue<readonly ScreenLandmark[]>;
}

export function usePoseRenderData({
  landmarksShared,
  previewSize,
  isMirrored,
  frameSize = { width: 720, height: 1280 },
  minScore = DEFAULT_SKELETON_CONFIG.minScore,
  smoothingAlpha = DEFAULT_SKELETON_CONFIG.smoothingFactor,
}: UsePoseRenderDataProps): UsePoseRenderDataReturn {
  // Shared memory for previous frame's coordinates (for EMA smoothing)
  const previousPointsShared = useSharedValue<Record<number, { x: number; y: number }>>({});

  // Reset smoothing memory if preview container changes or resets
  useEffect(() => {
    previousPointsShared.value = {};
  }, [previewSize.width, previewSize.height, isMirrored, previousPointsShared]);

  // High-frequency derived value running in worklet thread
  const screenLandmarksShared = useDerivedValue<readonly ScreenLandmark[]>(() => {
    'worklet';
    const rawLandmarks = landmarksShared.value;
    if (!rawLandmarks || rawLandmarks.length === 0 || previewSize.width === 0 || previewSize.height === 0) {
      return [];
    }

    // 1. Convert normalized coordinates to preview screen pixels (Phase 4)
    const rawScreen = convertToScreenLandmarks(rawLandmarks, {
      frameSize,
      previewSize,
      isMirrored,
      minScore,
    });

    const prevMap = previousPointsShared.value;
    const nextMap: Record<number, { x: number; y: number }> = {};
    const smoothedResult: ScreenLandmark[] = new Array(rawScreen.length);

    // 2. Apply EMA smoothing per landmark
    for (let i = 0; i < rawScreen.length; i++) {
      const current = rawScreen[i]!;
      const prev = prevMap[current.id];

      let smoothX = current.x;
      let smoothY = current.y;

      if (prev && current.visible) {
        smoothX = prev.x * (1 - smoothingAlpha) + current.x * smoothingAlpha;
        smoothY = prev.y * (1 - smoothingAlpha) + current.y * smoothingAlpha;
      }

      nextMap[current.id] = { x: smoothX, y: smoothY };

      smoothedResult[i] = {
        id: current.id,
        name: current.name,
        x: smoothX,
        y: smoothY,
        score: current.score,
        visible: current.visible,
      };
    }

    previousPointsShared.value = nextMap;
    return smoothedResult;
  }, [landmarksShared, previewSize, isMirrored, frameSize, minScore, smoothingAlpha]);

  return {
    screenLandmarksShared,
  };
}
