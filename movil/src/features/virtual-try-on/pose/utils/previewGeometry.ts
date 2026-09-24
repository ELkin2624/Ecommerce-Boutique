/**
 * Preview Geometry Utility
 * FashionStore Virtual Try-On - Phase 4
 *
 * Computes scaling, crop, and centering offsets for the camera preview
 * under the VisionCamera 'resizeMode="cover"' strategy.
 */

import type { FrameSize, PreviewGeometry, PreviewSize } from '../types/coordinate.types';

/**
 * Computes the preview geometry mapping a camera frame to a preview container
 * using a uniform 'cover' strategy (fills container, crops overflowing dimension, centered).
 *
 * @param frameSize Frame sensor dimensions (width, height in portrait orientation)
 * @param previewSize Preview view dimensions (width, height in screen pixels)
 * @returns PreviewGeometry containing scale, scaled dimensions, and centering offsets
 */
export function calculatePreviewGeometry(
  frameSize: FrameSize,
  previewSize: PreviewSize
): PreviewGeometry {
  'worklet';
  const { width: fWidth, height: fHeight } = frameSize;
  const { width: pWidth, height: pHeight } = previewSize;

  if (fWidth <= 0 || fHeight <= 0 || pWidth <= 0 || pHeight <= 0) {
    return {
      scale: 1,
      scaledWidth: pWidth,
      scaledHeight: pHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  // Cover strategy: scale by the maximum dimension ratio so the preview is completely covered
  const scaleX = pWidth / fWidth;
  const scaleY = pHeight / fHeight;
  const scale = Math.max(scaleX, scaleY);

  const scaledWidth = fWidth * scale;
  const scaledHeight = fHeight * scale;

  // Center crop: negative or zero offset
  const offsetX = (pWidth - scaledWidth) / 2;
  const offsetY = (pHeight - scaledHeight) / 2;

  return {
    scale,
    scaledWidth,
    scaledHeight,
    offsetX,
    offsetY,
  };
}
