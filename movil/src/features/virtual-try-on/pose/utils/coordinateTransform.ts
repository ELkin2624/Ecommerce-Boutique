/**
 * Coordinate Transformation Pipeline
 * FashionStore Virtual Try-On - Phase 4 & Fixes
 *
 * Converts model coordinates to screen preview coordinates:
 * MODEL [0..1] (192x192 contain-scaled) -> FRAME [0..1] (sensor aspect) -> SCREEN [px] (cover-scaled)
 *
 * Mathematically exact pipeline:
 * 1. Un-maps contain-padding from the 192x192 tensor to normalized sensor frame space [0..1].
 * 2. Applies horizontal mirror if front camera is active.
 * 3. Maps from sensor frame space to preview container pixels applying uniform cover scaling and centering.
 */

import type {
  FrameSize,
  NormalizedPoint,
  PixelPoint,
  PreviewGeometry,
  PreviewSize,
} from '../types/coordinate.types';
import { calculatePreviewGeometry } from './previewGeometry';

/**
 * Maps normalized coordinates [0.0, 1.0] to frame sensor pixels.
 */
export function normalizeToFrameCoordinates(
  normPoint: NormalizedPoint,
  frameSize: FrameSize
): PixelPoint {
  'worklet';
  return {
    x: normPoint.x * frameSize.width,
    y: normPoint.y * frameSize.height,
  };
}

/**
 * Maps frame sensor pixel coordinates to preview pixels taking into account
 * the preview geometry (scaling and center cropping offset).
 */
export function frameToPreviewCoordinates(
  framePoint: PixelPoint,
  geometry: PreviewGeometry
): PixelPoint {
  'worklet';
  return {
    x: framePoint.x * geometry.scale + geometry.offsetX,
    y: framePoint.y * geometry.scale + geometry.offsetY,
  };
}

/**
 * Clamps a pixel point to the visible bounds of the preview container.
 */
export function clampToPreview(
  point: PixelPoint,
  previewSize: PreviewSize
): PixelPoint {
  'worklet';
  return {
    x: Math.max(0, Math.min(previewSize.width, point.x)),
    y: Math.max(0, Math.min(previewSize.height, point.y)),
  };
}

/**
 * Full coordinate transformation from MoveNet 192x192 (contain-mode) to screen preview pixels.
 *
 * @param normPoint Point in normalized model space [0.0, 1.0]
 * @param frameSize Sensor frame dimensions (e.g. 720x1280)
 * @param previewSize Preview container dimensions (e.g. 390x844)
 * @param isMirrored Whether horizontal mirroring is active (true for front camera)
 * @returns Final pixel coordinates within preview space
 */
export function transformLandmarkToPreview(
  normPoint: NormalizedPoint,
  frameSize: FrameSize,
  previewSize: PreviewSize,
  isMirrored: boolean
): PixelPoint {
  'worklet';
  const fw = frameSize.width > 0 ? frameSize.width : 720;
  const fh = frameSize.height > 0 ? frameSize.height : 1280;
  const resizerW = 192;
  const resizerH = 192;

  // 1. Un-map from 192x192 contain-mode tensor to normalized frame coordinates [0..1]
  const resizerScale = Math.min(resizerW / fw, resizerH / fh);
  const renderedW = fw * resizerScale;
  const renderedH = fh * resizerScale;
  const resizerOffsetX = (resizerW - renderedW) / 2;
  const resizerOffsetY = (resizerH - renderedH) / 2;

  const frameNormX = (normPoint.x * resizerW - resizerOffsetX) / renderedW;
  const frameNormY = (normPoint.y * resizerH - resizerOffsetY) / renderedH;

  // 2. Mirror in normalized space for front camera
  const effectiveFrameNormX = isMirrored ? 1.0 - frameNormX : frameNormX;

  // 3. Map frame normalized coordinates to preview screen pixels (VisionCamera cover mode)
  const pw = previewSize.width;
  const ph = previewSize.height;
  if (pw <= 0 || ph <= 0) {
    return {
      x: effectiveFrameNormX * fw,
      y: frameNormY * fh,
    };
  }

  const geometry = calculatePreviewGeometry({ width: fw, height: fh }, previewSize);

  const previewX = effectiveFrameNormX * fw * geometry.scale + geometry.offsetX;
  const previewY = frameNormY * fh * geometry.scale + geometry.offsetY;

  return {
    x: previewX,
    y: previewY,
  };
}
