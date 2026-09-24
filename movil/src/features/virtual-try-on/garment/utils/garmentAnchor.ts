/**
 * Garment Anchor & Geometry Utilities
 * FashionStore Virtual Try-On - Phase 6 & 7
 *
 * Computes dynamic garment width (shoulderWidth × factor), height preserving aspect ratio,
 * rotation (atan2 of shoulder tilt), and placement anchored directly at the anatomical neck/shoulders.
 *
 * All functions are 'worklet'-safe for use in Reanimated derived values.
 */

import type { ScreenLandmark } from '../../pose/types/coordinate.types';
import type { GarmentRenderGeometry, VirtualGarment } from '../types/garment.types';

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * Calculates the midpoint between left and right shoulders.
 */
export function calculateShoulderCenter(
  leftShoulder: Point2D,
  rightShoulder: Point2D
): Point2D {
  'worklet';
  return {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return value < min ? min : value > max ? max : value;
}

/**
 * Computes garment height preserving the original image aspect ratio from a given rendered width.
 */
export function calculateGarmentHeight(
  renderedWidth: number,
  originalWidth: number,
  originalHeight: number
): number {
  'worklet';
  if (originalWidth <= 0 || originalHeight <= 0) {
    return renderedWidth;
  }
  return renderedWidth * (originalHeight / originalWidth);
}

/**
 * Computes the 2D bounding box, anchor point, and tilt rotation for rendering a top garment.
 *
 * @param landmarks Transformed screen landmarks
 * @param garment Virtual garment specification
 * @returns GarmentRenderGeometry
 */
export function calculateGarmentGeometry(
  landmarks: readonly ScreenLandmark[],
  garment: VirtualGarment
): GarmentRenderGeometry {
  'worklet';

  const defaultShoulderLineY = garment.baseHeight * (garment.shoulderLineRatio ?? 0.20);

  const notAnchored: GarmentRenderGeometry = {
    anchorX: 0,
    anchorY: 0,
    x: 0,
    y: 0,
    width: garment.baseWidth,
    height: garment.baseHeight,
    shoulderLineY: defaultShoulderLineY,
    rotation: 0,
    isAnchored: false,
  };

  if (!landmarks || landmarks.length === 0) {
    return notAnchored;
  }

  // MoveNet keypoint indices: left_shoulder = 5, right_shoulder = 6
  let leftShoulder: ScreenLandmark | null = null;
  let rightShoulder: ScreenLandmark | null = null;

  if (landmarks.length > 5 && landmarks[5] && landmarks[5].name === 'left_shoulder') {
    leftShoulder = landmarks[5];
  }
  if (landmarks.length > 6 && landmarks[6] && landmarks[6].name === 'right_shoulder') {
    rightShoulder = landmarks[6];
  }

  // Worklet-safe fallback linear scan (avoids Array.prototype.find on SharedValue proxies)
  if (!leftShoulder || !rightShoulder) {
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm) {
        if (lm.name === 'left_shoulder') leftShoulder = lm;
        else if (lm.name === 'right_shoulder') rightShoulder = lm;
      }
    }
  }

  // Verify both shoulders exist and satisfy confidence threshold
  const minScore = garment.minShoulderScore ?? 0.15;
  if (
    !leftShoulder ||
    !rightShoulder ||
    leftShoulder.score < minScore ||
    rightShoulder.score < minScore
  ) {
    return notAnchored;
  }

  // ── 1. Determine screen-left and screen-right shoulders ─────────────────────
  // This guarantees dx is always positive (>= 0), preventing any 180° upside-down flips
  const screenLeftShoulder = leftShoulder.x <= rightShoulder.x ? leftShoulder : rightShoulder;
  const screenRightShoulder = leftShoulder.x <= rightShoulder.x ? rightShoulder : leftShoulder;

  const dx = screenRightShoulder.x - screenLeftShoulder.x;
  const dy = screenRightShoulder.y - screenLeftShoulder.y;
  const shoulderWidth = Math.sqrt(dx * dx + dy * dy);

  if (shoulderWidth <= 15) {
    return notAnchored;
  }

  // ── 2. Dynamic Scale from Anatomical Shoulder Distance ─────────────────────
  const factor = garment.shoulderWidthFactor > 0 ? garment.shoulderWidthFactor : 1.85;
  const rawWidth = garment.shoulderWidthFactor === 0 ? garment.baseWidth : shoulderWidth * factor;
  const garmentWidth = clamp(rawWidth, garment.minRenderWidth, garment.maxRenderWidth);
  const garmentHeight = calculateGarmentHeight(garmentWidth, garment.originalWidth, garment.originalHeight);

  // ── 3. Rotation from Shoulder Tilt ─────────────────────────────────────────
  // Strictly clamped to [-35deg, +35deg] (-0.6 rad to +0.6 rad) to prevent unnatural warping
  const rawRotation = garment.applyRotation ? Math.atan2(dy, dx) : 0;
  const rotation = clamp(rawRotation, -0.6, 0.6);

  // ── 4. Anchor Position at Anatomical Shoulder Center ───────────────────────
  const centerX = (leftShoulder.x + rightShoulder.x) / 2;
  const centerY = (leftShoulder.y + rightShoulder.y) / 2;

  // Distance from top of garment image to its shoulder seam line
  const shoulderLineRatio = garment.shoulderLineRatio ?? 0.20;
  const shoulderLineY = garmentHeight * shoulderLineRatio;

  const topOffsetPx =
    garment.topOffsetFactor != null
      ? garmentHeight * garment.topOffsetFactor
      : garment.topOffset;

  const x = centerX - garmentWidth / 2 + garment.horizontalOffset;
  const y = centerY - topOffsetPx;

  return {
    anchorX: centerX + garment.horizontalOffset,
    anchorY: centerY,
    shoulderLineY,
    x,
    y,
    width: garmentWidth,
    height: garmentHeight,
    rotation,
    isAnchored: true,
  };
}
