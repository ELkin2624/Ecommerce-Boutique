/**
 * Pose Skeleton Debug Renderer (Provisional - Phase 3)
 * FashionStore Virtual Try-On
 *
 * Renders provisional keypoint dots and bone lines via React Native Reanimated Animated.View.
 * Used strictly for functional validation of local AI inference before Phase 4/5.
 */

import React, { memo } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  MOVENET_KEYPOINTS,
  SKELETON_BONES,
  type PoseLandmark,
  type PoseLandmarkName,
} from '../types/pose.types';

const DOT_SIZE = 8;
const LINE_THICKNESS = 2;
const DEFAULT_MIN_SCORE = 0.25;

export interface PoseSkeletonProps {
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  readonly minScore?: number;
  readonly dotColor?: string;
  readonly boneColor?: string;
}

interface KeypointDotProps {
  readonly index: number;
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  readonly widthShared: SharedValue<number>;
  readonly heightShared: SharedValue<number>;
  readonly minScore: number;
  readonly color: string;
}

const KeypointDot = memo(function KeypointDot({
  index,
  landmarksShared,
  widthShared,
  heightShared,
  minScore,
  color,
}: KeypointDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const lm = landmarksShared.value[index];
    const w = widthShared.value;
    const h = heightShared.value;

    if (!lm || lm.score < minScore || w === 0 || h === 0) {
      return {
        opacity: 0,
      };
    }

    const posX = lm.x * w - DOT_SIZE / 2;
    const posY = lm.y * h - DOT_SIZE / 2;

    return {
      opacity: 1,
      transform: [{ translateX: posX }, { translateY: posY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
});

interface BoneLineProps {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  readonly widthShared: SharedValue<number>;
  readonly heightShared: SharedValue<number>;
  readonly minScore: number;
  readonly color: string;
}

const BoneLine = memo(function BoneLine({
  fromIndex,
  toIndex,
  landmarksShared,
  widthShared,
  heightShared,
  minScore,
  color,
}: BoneLineProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const lmA = landmarksShared.value[fromIndex];
    const lmB = landmarksShared.value[toIndex];
    const w = widthShared.value;
    const h = heightShared.value;

    if (
      !lmA ||
      !lmB ||
      lmA.score < minScore ||
      lmB.score < minScore ||
      w === 0 ||
      h === 0
    ) {
      return {
        opacity: 0,
      };
    }

    const ax = lmA.x * w;
    const ay = lmA.y * h;
    const bx = lmB.x * w;
    const by = lmB.y * h;

    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;

    return {
      opacity: 0.75,
      width: length,
      transform: [
        { translateX: midX - length / 2 },
        { translateY: midY - LINE_THICKNESS / 2 },
        { rotateZ: `${angle}rad` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bone,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
});

const KEYPOINT_INDEX_MAP = new Map<PoseLandmarkName, number>(
  MOVENET_KEYPOINTS.map((name, idx) => [name, idx])
);

export const PoseSkeleton = memo(function PoseSkeleton({
  landmarksShared,
  minScore = DEFAULT_MIN_SCORE,
  dotColor = '#10B981', // Emerald green
  boneColor = '#34D399', // Mint green
}: PoseSkeletonProps) {
  const widthShared = useSharedValue(0);
  const heightShared = useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    widthShared.value = width;
    heightShared.value = height;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {/* Bones (Rendered below dots) */}
      {SKELETON_BONES.map((bone, idx) => {
        const fromIndex = KEYPOINT_INDEX_MAP.get(bone.from);
        const toIndex = KEYPOINT_INDEX_MAP.get(bone.to);
        if (fromIndex === undefined || toIndex === undefined) return null;

        return (
          <BoneLine
            key={`bone-${idx}-${bone.from}-${bone.to}`}
            fromIndex={fromIndex}
            toIndex={toIndex}
            landmarksShared={landmarksShared}
            widthShared={widthShared}
            heightShared={heightShared}
            minScore={minScore}
            color={boneColor}
          />
        );
      })}

      {/* 17 Keypoint Dots */}
      {MOVENET_KEYPOINTS.map((name, idx) => (
        <KeypointDot
          key={`dot-${idx}-${name}`}
          index={idx}
          landmarksShared={landmarksShared}
          widthShared={widthShared}
          heightShared={heightShared}
          minScore={minScore}
          color={dotColor}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bone: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: LINE_THICKNESS,
    borderRadius: LINE_THICKNESS / 2,
  },
});
