/**
 * Pose Normalizer Utility
 * FashionStore Virtual Try-On - Phase 3
 *
 * NOTE: Phase 3 maintains coordinates strictly in normalized model space [0.0, 1.0].
 * DO NOT apply mirror inversion (e.g. x = 1 - x) or screen projection here.
 * Screen aspect ratio mapping and mirror transformations belong exclusively to Phase 4.
 */

/**
 * Clamps a numeric value to the range [0.0, 1.0].
 */
export function clampNormalized(value: number): number {
  'worklet';
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Normalizes raw MoveNet coordinates by clamping to [0.0, 1.0].
 * MoveNet outputs y, x directly as normalized floats [0.0, 1.0].
 */
export function normalizeCoordinates(
  rawY: number,
  rawX: number
): { readonly y: number; readonly x: number } {
  'worklet';
  return {
    y: clampNormalized(rawY),
    x: clampNormalized(rawX),
  };
}
