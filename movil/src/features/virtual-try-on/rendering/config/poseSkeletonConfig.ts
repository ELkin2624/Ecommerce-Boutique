/**
 * Pose Skeleton Anatomical Configuration
 * FashionStore Virtual Try-On - Phase 5
 *
 * Defines anatomical bone connections and premium color styles for body landmarks.
 * NOTE: Facial keypoints (eyes, nose, ears) are deliberately excluded so the user's
 * face remains natural, clear, and unobstructed during clothing try-on.
 */

import type { SkeletonBoneDefinition, SkeletonRenderConfig } from '../types/render.types';

export const POSE_SKELETON_BONES: readonly SkeletonBoneDefinition[] = [
  // Torso / Upper Body (Cyan)
  { from: 'left_shoulder', to: 'right_shoulder' },
  { from: 'left_shoulder', to: 'left_hip' },
  { from: 'right_shoulder', to: 'right_hip' },
  { from: 'left_hip', to: 'right_hip' },

  // Arms (Cyan)
  { from: 'left_shoulder', to: 'left_elbow' },
  { from: 'left_elbow', to: 'left_wrist' },
  { from: 'right_shoulder', to: 'right_elbow' },
  { from: 'right_elbow', to: 'right_wrist' },

  // Legs (Purple / Magenta)
  { from: 'left_hip', to: 'left_knee' },
  { from: 'left_knee', to: 'left_ankle' },
  { from: 'right_hip', to: 'right_knee' },
  { from: 'right_knee', to: 'right_ankle' },
] as const;

export const DEFAULT_SKELETON_CONFIG: SkeletonRenderConfig = {
  minScore: 0.25,
  pointRadius: 6,
  pointColor: '#38BDF8', // Vivid Sky Blue / Cyan
  shoulderPointColor: '#38BDF8', // Cyan accent for garment anchors
  boneStrokeWidth: 2.5,
  boneColor: 'rgba(56, 189, 248, 0.85)', // Cyan semi-transparent
  smoothingFactor: 0.35, // EMA alpha: 35% new, 65% previous
};
