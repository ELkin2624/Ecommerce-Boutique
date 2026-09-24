/**
 * Screen Landmarks Converter
 * FashionStore Virtual Try-On - Phase 4
 *
 * Converts normalized PoseLandmark[] from MoveNet into ScreenLandmark[]
 * positioned accurately in the preview coordinate space.
 */

import type { FrameSize, PreviewSize, ScreenLandmark } from '../types/coordinate.types';
import type { PoseLandmark } from '../types/pose.types';
import { transformLandmarkToPreview } from './coordinateTransform';

export interface ConvertLandmarksOptions {
  readonly frameSize: FrameSize;
  readonly previewSize: PreviewSize;
  readonly isMirrored: boolean;
  readonly minScore?: number;
}

const DEFAULT_MIN_SCORE = 0.25;

/**
 * Transforms an array of normalized PoseLandmarks to screen preview coordinates.
 *
 * @param landmarks Raw normalized landmarks from MoveNet
 * @param options Transformation parameters (frameSize, previewSize, isMirrored, minScore)
 * @returns Array of transformed ScreenLandmark items
 */
export function convertToScreenLandmarks(
  landmarks: readonly PoseLandmark[],
  options: ConvertLandmarksOptions
): readonly ScreenLandmark[] {
  'worklet';
  const {
    frameSize,
    previewSize,
    isMirrored,
    minScore = DEFAULT_MIN_SCORE,
  } = options;

  const count = landmarks.length;
  if (count === 0) {
    return [];
  }

  const result: ScreenLandmark[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const lm = landmarks[i]!;
    const previewPoint = transformLandmarkToPreview(
      { x: lm.x, y: lm.y },
      frameSize,
      previewSize,
      isMirrored
    );

    result[i] = {
      id: lm.id,
      name: lm.name,
      x: previewPoint.x,
      y: previewPoint.y,
      score: lm.score,
      visible: lm.score >= minScore,
    };
  }

  return result;
}
