/**
 * Pose Decoder Utility
 * FashionStore Virtual Try-On - Phase 3
 *
 * Decodes the raw Float32Array output from MoveNet SinglePose Lightning [1, 1, 17, 3]
 * into structured PoseLandmark objects.
 */

import { MOVENET_KEYPOINTS, type PoseLandmark } from '../types/pose.types';
import { normalizeCoordinates } from './poseNormalizer';

export const TOTAL_KEYPOINTS = 17;
export const VALUES_PER_KEYPOINT = 3;
export const EXPECTED_OUTPUT_LENGTH = TOTAL_KEYPOINTS * VALUES_PER_KEYPOINT; // 51 floats

/**
 * Decodes raw MoveNet output buffer into structured landmarks.
 *
 * @param outputBuffer Float32Array or ArrayBuffer containing 51 floats
 * @returns Array of 17 PoseLandmark objects
 */
export function decodeMoveNetOutput(
  outputBuffer: Float32Array | ArrayBuffer
): PoseLandmark[] {
  'worklet';
  const floatArray =
    outputBuffer instanceof Float32Array
      ? outputBuffer
      : new Float32Array(outputBuffer);

  if (floatArray.length < EXPECTED_OUTPUT_LENGTH) {
    return [];
  }

  const landmarks: PoseLandmark[] = [];

  for (let i = 0; i < TOTAL_KEYPOINTS; i++) {
    const offset = i * VALUES_PER_KEYPOINT;
    const rawY = floatArray[offset] ?? 0;
    const rawX = floatArray[offset + 1] ?? 0;
    const rawScore = floatArray[offset + 2] ?? 0;

    const { y, x } = normalizeCoordinates(rawY, rawX);
    const score = Math.max(0, Math.min(1, rawScore));

    landmarks.push({
      id: i,
      name: MOVENET_KEYPOINTS[i]!,
      x,
      y,
      score,
    });
  }

  return landmarks;
}
