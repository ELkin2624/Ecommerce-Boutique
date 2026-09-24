/**
 * Mirror Transformation Utility
 * FashionStore Virtual Try-On - Phase 4
 *
 * Provides explicit horizontal axis inversion for front-facing camera selfie mode.
 *
 * Coordinate Systems:
 * - Un-mirrored (Sensor/AI Space): x = 0 is camera sensor left (user's anatomical right).
 * - Mirrored (Preview/Visual Space): x = 0 is screen left (matches selfie mirror reflection).
 */

/**
 * Inverts a normalized horizontal coordinate [0.0, 1.0] across the center axis.
 *
 * @param normX Normalized x coordinate in [0.0, 1.0]
 * @returns Mirrored normalized x coordinate (1.0 - normX)
 */
export function mirrorNormalizedX(normX: number): number {
  'worklet';
  return 1.0 - normX;
}

/**
 * Inverts a pixel coordinate across the container width.
 *
 * @param pixelX Pixel x coordinate in [0, containerWidth]
 * @param containerWidth Total width of the container in pixels
 * @returns Mirrored pixel x coordinate (containerWidth - pixelX)
 */
export function mirrorPixelX(pixelX: number, containerWidth: number): number {
  'worklet';
  return containerWidth - pixelX;
}

/**
 * Conditionally mirrors a normalized x coordinate depending on whether mirror mode is enabled.
 *
 * @param normX Normalized x coordinate in [0.0, 1.0]
 * @param isMirrored Whether horizontal mirroring is active (true for front camera in selfie preview)
 * @returns Mirrored or original normalized x coordinate
 */
export function applyNormalizedMirror(normX: number, isMirrored: boolean): number {
  'worklet';
  return isMirrored ? mirrorNormalizedX(normX) : normX;
}

/**
 * Conditionally mirrors a pixel x coordinate depending on whether mirror mode is enabled.
 *
 * @param pixelX Pixel x coordinate in [0, containerWidth]
 * @param containerWidth Total width of the container in pixels
 * @param isMirrored Whether horizontal mirroring is active
 * @returns Mirrored or original pixel x coordinate
 */
export function applyPixelMirror(
  pixelX: number,
  containerWidth: number,
  isMirrored: boolean
): number {
  'worklet';
  return isMirrored ? mirrorPixelX(pixelX, containerWidth) : pixelX;
}
