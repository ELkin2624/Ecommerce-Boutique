/**
 * Coordinate Sampling Hook
 * FashionStore Virtual Try-On - Phase 4
 *
 * Samples key landmarks (nose, left_shoulder, right_shoulder) for the
 * numeric debug HUD at a throttled interval without affecting 60 FPS camera preview.
 */

import { useState, useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { PoseLandmark } from '../types/pose.types';
import type {
  FrameSize,
  LandmarkDebugSample,
  PreviewSize,
} from '../types/coordinate.types';
import { transformLandmarkToPreview } from '../utils/coordinateTransform';
import { applyNormalizedMirror } from '../utils/mirrorTransform';

const TARGET_KEYPOINTS = ['nose', 'left_shoulder', 'right_shoulder'] as const;

export interface UseCoordinateSamplingProps {
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  readonly previewSize: PreviewSize;
  readonly frameSize?: FrameSize;
  readonly isMirrored: boolean;
  readonly throttleMs?: number;
}

export function useCoordinateSampling({
  landmarksShared,
  previewSize,
  frameSize = { width: 720, height: 1280 },
  isMirrored,
  throttleMs = 400,
}: UseCoordinateSamplingProps): readonly LandmarkDebugSample[] {
  const [samples, setSamples] = useState<readonly LandmarkDebugSample[]>([]);
  const lastSampledRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSampledRef.current < throttleMs) return;
      lastSampledRef.current = now;

      const current = landmarksShared.value;
      if (!current || current.length === 0 || previewSize.width === 0) {
        return;
      }

      const extracted: LandmarkDebugSample[] = [];

      for (const name of TARGET_KEYPOINTS) {
        const lm = current.find((item) => item.name === name);
        if (!lm) continue;

        const effectiveNormX = applyNormalizedMirror(lm.x, isMirrored);
        const frameX = effectiveNormX * frameSize.width;
        const frameY = lm.y * frameSize.height;

        const previewPt = transformLandmarkToPreview(
          { x: lm.x, y: lm.y },
          frameSize,
          previewSize,
          isMirrored
        );

        extracted.push({
          name: lm.name,
          modelX: lm.x,
          modelY: lm.y,
          frameX,
          frameY,
          previewX: previewPt.x,
          previewY: previewPt.y,
          score: lm.score,
        });
      }

      if (extracted.length > 0) {
        setSamples(extracted);
      }
    }, throttleMs);

    return () => clearInterval(interval);
  }, [landmarksShared, previewSize, frameSize, isMirrored, throttleMs]);

  return samples;
}
