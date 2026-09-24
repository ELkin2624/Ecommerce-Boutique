/**
 * Pose Validation Utility
 * FashionStore Virtual Try-On - Phase 3
 *
 * Evaluates pose confidence using configurable thresholds.
 */

import {
  type PoseConfig,
  type PoseLandmark,
  type PoseResult,
  type PoseStatus,
} from '../types/pose.types';

export interface ValidationMetrics {
  readonly validLandmarksCount: number;
  readonly poseScore: number;
  readonly status: PoseStatus;
  readonly isValid: boolean;
}

/**
 * Validates decoded landmarks against configurable thresholds.
 *
 * @param landmarks Array of decoded landmarks
 * @param config PoseConfig containing minKeypointScore and minPoseScore
 * @returns ValidationMetrics with status, valid count, and average score
 */
export function validatePose(
  landmarks: readonly PoseLandmark[],
  config: PoseConfig
): ValidationMetrics {
  'worklet';
  if (landmarks.length === 0) {
    return {
      validLandmarksCount: 0,
      poseScore: 0,
      status: 'no-pose',
      isValid: false,
    };
  }

  let totalScore = 0;
  let validCount = 0;

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]!;
    totalScore += lm.score;
    if (lm.score >= config.minKeypointScore) {
      validCount++;
    }
  }

  const avgScore = totalScore / landmarks.length;

  // If no landmarks meet the minimum keypoint score, no person is detected
  if (validCount === 0) {
    return {
      validLandmarksCount: 0,
      poseScore: avgScore,
      status: 'no-pose',
      isValid: false,
    };
  }

  // If overall confidence is below the minimum pose score
  if (avgScore < config.minPoseScore) {
    return {
      validLandmarksCount: validCount,
      poseScore: avgScore,
      status: 'low-confidence',
      isValid: false,
    };
  }

  return {
    validLandmarksCount: validCount,
    poseScore: avgScore,
    status: 'ready',
    isValid: true,
  };
}

/**
 * Creates a structured PoseResult from decoded landmarks.
 */
export function buildPoseResult(
  landmarks: readonly PoseLandmark[],
  config: PoseConfig
): PoseResult {
  'worklet';
  const validation = validatePose(landmarks, config);
  return {
    landmarks,
    score: validation.poseScore,
    status: validation.status,
    isValid: validation.isValid,
  };
}
