/**
 * Pose Skeleton Renderer (Skia)
 * FashionStore Virtual Try-On - Phase 5
 *
 * Renders anatomical bone connection lines on top of Skia Canvas:
 * - Upper torso and arms in vibrant cyan (#38BDF8)
 * - Central spine connection (shoulder center -> hip center)
 * - Lower body and legs in stylish purple (#C084FC)
 *
 * Excludes face keypoints to keep the user's face clean and natural.
 */

import React, { memo } from 'react';
import { Group, Line, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { ScreenLandmark } from '../../pose/types/coordinate.types';
import { MOVENET_KEYPOINTS, type PoseLandmarkName } from '../../pose/types/pose.types';
import { POSE_SKELETON_BONES } from '../config/poseSkeletonConfig';
import type { SkeletonBoneDefinition, SkeletonRenderConfig } from '../types/render.types';

const KEYPOINT_INDEX_MAP = new Map<PoseLandmarkName, number>(
  MOVENET_KEYPOINTS.map((name, idx) => [name, idx])
);

const UPPER_BODY_BONES = new Set<string>([
  'left_shoulder-right_shoulder',
  'left_shoulder-left_elbow',
  'left_elbow-left_wrist',
  'right_shoulder-right_elbow',
  'right_elbow-right_wrist',
  'left_shoulder-left_hip',
  'right_shoulder-right_hip',
]);

interface SingleBoneLineProps {
  readonly bone: SkeletonBoneDefinition;
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  readonly config: SkeletonRenderConfig;
}

const SingleBoneLine = memo(function SingleBoneLine({
  bone,
  fromIndex,
  toIndex,
  landmarksShared,
  config,
}: SingleBoneLineProps) {
  const boneKey = `${bone.from}-${bone.to}`;
  const isUpper = UPPER_BODY_BONES.has(boneKey);
  const strokeColor = isUpper
    ? 'rgba(56, 189, 248, 0.85)' // Cyan for upper body
    : 'rgba(192, 132, 252, 0.85)'; // Purple for lower body / legs

  const p1 = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const a = list[fromIndex];
    return a && a.visible ? vec(a.x, a.y) : vec(-100, -100);
  });

  const p2 = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const b = list[toIndex];
    return b && b.visible ? vec(b.x, b.y) : vec(-100, -100);
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const a = list[fromIndex];
    const b = list[toIndex];
    return a && b && a.visible && b.visible ? 0.9 : 0.0;
  });

  return (
    <Group opacity={opacity}>
      <Line
        p1={p1}
        p2={p2}
        color={strokeColor}
        strokeWidth={config.boneStrokeWidth}
        style="stroke"
        strokeCap="round"
      />
    </Group>
  );
});

/**
 * Spine line connecting shoulder midpoint to hip midpoint.
 */
const SpineLine = memo(function SpineLine({
  landmarksShared,
  config,
}: {
  landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  config: SkeletonRenderConfig;
}) {
  const leftShoulderIdx = 5;
  const rightShoulderIdx = 6;
  const leftHipIdx = 11;
  const rightHipIdx = 12;

  const p1 = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const ls = list[leftShoulderIdx];
    const rs = list[rightShoulderIdx];
    if (ls && rs && ls.visible && rs.visible) {
      return vec((ls.x + rs.x) / 2, (ls.y + rs.y) / 2);
    }
    return vec(-100, -100);
  });

  const p2 = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const lh = list[leftHipIdx];
    const rh = list[rightHipIdx];
    if (lh && rh && lh.visible && rh.visible) {
      return vec((lh.x + rh.x) / 2, (lh.y + rh.y) / 2);
    }
    return vec(-100, -100);
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const ls = list[leftShoulderIdx];
    const rs = list[rightShoulderIdx];
    const lh = list[leftHipIdx];
    const rh = list[rightHipIdx];
    return ls?.visible && rs?.visible && lh?.visible && rh?.visible ? 0.9 : 0.0;
  });

  return (
    <Group opacity={opacity}>
      <Line
        p1={p1}
        p2={p2}
        color="rgba(56, 189, 248, 0.9)"
        strokeWidth={config.boneStrokeWidth}
        style="stroke"
        strokeCap="round"
      />
    </Group>
  );
});

export interface PoseSkeletonProps {
  readonly landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  readonly config: SkeletonRenderConfig;
}

export const PoseSkeleton = memo(function PoseSkeleton({
  landmarksShared,
  config,
}: PoseSkeletonProps) {
  return (
    <Group>
      {/* Central Spine */}
      <SpineLine landmarksShared={landmarksShared} config={config} />

      {/* Anatomical Body Bones */}
      {POSE_SKELETON_BONES.map((bone, idx) => {
        const fromIndex = KEYPOINT_INDEX_MAP.get(bone.from);
        const toIndex = KEYPOINT_INDEX_MAP.get(bone.to);
        if (fromIndex === undefined || toIndex === undefined) return null;

        return (
          <SingleBoneLine
            key={`sk-bone-${idx}-${bone.from}-${bone.to}`}
            bone={bone}
            fromIndex={fromIndex}
            toIndex={toIndex}
            landmarksShared={landmarksShared}
            config={config}
          />
        );
      })}
    </Group>
  );
});
