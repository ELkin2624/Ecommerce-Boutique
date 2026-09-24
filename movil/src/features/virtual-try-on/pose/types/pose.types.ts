/**
 * Pose Estimation Types (MoveNet SinglePose Lightning)
 * FashionStore Virtual Try-On - Phase 3
 */

export const MOVENET_KEYPOINTS = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export type PoseLandmarkName = (typeof MOVENET_KEYPOINTS)[number];

export interface PoseLandmark {
  readonly id: number;
  readonly name: PoseLandmarkName;
  readonly x: number; // Normalized [0, 1] relative to model space (NOT mirrored in Phase 3)
  readonly y: number; // Normalized [0, 1] relative to model space
  readonly score: number; // Confidence [0, 1]
}

export type PoseStatus =
  | 'idle'
  | 'loading-model'
  | 'ready'
  | 'no-pose'
  | 'low-confidence'
  | 'error';

export interface PoseConfig {
  readonly minKeypointScore: number;
  readonly minPoseScore: number;
  readonly throttleMetricsMs: number;
}

export const DEFAULT_POSE_CONFIG: PoseConfig = {
  minKeypointScore: 0.25,
  minPoseScore: 0.2,
  throttleMetricsMs: 500,
};

export interface PoseMetrics {
  readonly inferenceTimeMs: number;
  readonly inferenceFps: number;
  readonly validLandmarksCount: number;
  readonly poseScore: number;
  readonly timestamp: number;
}

export const INITIAL_POSE_METRICS: PoseMetrics = {
  inferenceTimeMs: 0,
  inferenceFps: 0,
  validLandmarksCount: 0,
  poseScore: 0,
  timestamp: 0,
};

export interface PoseResult {
  readonly landmarks: readonly PoseLandmark[];
  readonly score: number;
  readonly status: PoseStatus;
  readonly isValid: boolean;
}

export interface SkeletonBone {
  readonly from: PoseLandmarkName;
  readonly to: PoseLandmarkName;
}

export const SKELETON_BONES: readonly SkeletonBone[] = [
  // Face
  { from: 'left_ear', to: 'left_eye' },
  { from: 'left_eye', to: 'nose' },
  { from: 'nose', to: 'right_eye' },
  { from: 'right_eye', to: 'right_ear' },
  // Upper body
  { from: 'left_shoulder', to: 'right_shoulder' },
  { from: 'left_shoulder', to: 'left_hip' },
  { from: 'right_shoulder', to: 'right_hip' },
  { from: 'left_hip', to: 'right_hip' },
  // Arms
  { from: 'left_shoulder', to: 'left_elbow' },
  { from: 'left_elbow', to: 'left_wrist' },
  { from: 'right_shoulder', to: 'right_elbow' },
  { from: 'right_elbow', to: 'right_wrist' },
  // Legs
  { from: 'left_hip', to: 'left_knee' },
  { from: 'left_knee', to: 'left_ankle' },
  { from: 'right_hip', to: 'right_knee' },
  { from: 'right_knee', to: 'right_ankle' },
] as const;
