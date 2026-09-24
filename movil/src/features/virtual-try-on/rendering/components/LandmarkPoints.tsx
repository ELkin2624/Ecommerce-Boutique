/**
 * Landmark Points Renderer (Skia)
 * FashionStore Virtual Try-On - Phase 5
 *
 * Renders anatomical keypoint dots inside Skia Canvas.
 * - Cyan dots with glowing halo for upper body anchors (shoulders, elbows, wrists)
 * - Purple/Magenta dots for lower body anchors (hips, knees, ankles)
 * - Facial landmarks (0..4) are omitted to keep the user's face clean and natural.
 */

import React, { memo } from 'react';
import { Circle, Group } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { ScreenLandmark } from '../../pose/types/coordinate.types';
import { MOVENET_KEYPOINTS, type PoseLandmarkName } from '../../pose/types/pose.types';
import type { SkeletonRenderConfig } from '../types/render.types';

const LOWER_BODY_LANDMARKS = new Set<PoseLandmarkName>([
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
]);

// Body keypoints only (indices 5..16) — exclude nose, eyes, ears
const BODY_KEYPOINTS = MOVENET_KEYPOINTS.map((name, index) => ({ name, index })).filter(
  ({ index }) => index >= 5
);

interface SinglePointDotProps {
  readonly index: number;
  readonly name: PoseLandmarkName;
  readonly landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  readonly config: SkeletonRenderConfig;
}

const SinglePointDot = memo(function SinglePointDot({
  index,
  name,
  landmarksShared,
  config,
}: SinglePointDotProps) {
  const isLower = LOWER_BODY_LANDMARKS.has(name);
  const isShoulder = name === 'left_shoulder' || name === 'right_shoulder';

  const dotColor = isLower ? '#C084FC' : '#38BDF8';
  const haloColor = isLower ? 'rgba(192, 132, 252, 0.4)' : 'rgba(56, 189, 248, 0.4)';
  const radius = isShoulder ? config.pointRadius * 1.25 : config.pointRadius;

  const cx = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const lm = list[index];
    return lm && lm.visible ? lm.x : -100;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const lm = list[index];
    return lm && lm.visible ? lm.y : -100;
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    const list = landmarksShared.value;
    const lm = list[index];
    return lm && lm.visible ? 1.0 : 0.0;
  });

  return (
    <Group opacity={opacity}>
      {/* Outer halo */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius + 3}
        color={haloColor}
        style="stroke"
        strokeWidth={1.5}
      />
      {/* Inner solid circle */}
      <Circle cx={cx} cy={cy} r={radius} color={dotColor} />
      {/* Central bright core */}
      <Circle cx={cx} cy={cy} r={radius * 0.4} color="#FFFFFF" />
    </Group>
  );
});

export interface LandmarkPointsProps {
  readonly landmarksShared: SharedValue<readonly ScreenLandmark[]>;
  readonly config: SkeletonRenderConfig;
}

export const LandmarkPoints = memo(function LandmarkPoints({
  landmarksShared,
  config,
}: LandmarkPointsProps) {
  return (
    <Group>
      {BODY_KEYPOINTS.map(({ name, index }) => (
        <SinglePointDot
          key={`lm-dot-${index}-${name}`}
          index={index}
          name={name}
          landmarksShared={landmarksShared}
          config={config}
        />
      ))}
    </Group>
  );
});
