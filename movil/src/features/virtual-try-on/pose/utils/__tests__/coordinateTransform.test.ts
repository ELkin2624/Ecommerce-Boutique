/**
 * Mathematical Verification Tests for Coordinate Transformations
 * FashionStore Virtual Try-On
 */

import { calculatePreviewGeometry } from '../previewGeometry';
import {
  clampToPreview,
  transformLandmarkToPreview,
} from '../coordinateTransform';

function assertApprox(actual: number, expected: number, tolerance = 0.01, label = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`Assertion failed for ${label}: actual ${actual}, expected ${expected} (diff: ${diff})`);
  }
}

export function runCoordinateTransformTests(): { success: boolean; results: string[] } {
  const logs: string[] = [];

  // Mock Frame Size: 720 x 1280 (9:16 portrait)
  const frameSize = { width: 720, height: 1280 };
  // Mock Preview Size: 1080 x 2400 (9:20 portrait screen)
  const previewSize = { width: 1080, height: 2400 };

  // --- Caso Center: (0.5, 0.5) in 192x192 contain-mode tensor ---
  {
    const ptC = transformLandmarkToPreview({ x: 0.5, y: 0.5 }, frameSize, previewSize, false);
    assertApprox(ptC.x, 540, 0.01, 'Center x');
    assertApprox(ptC.y, 1200, 0.01, 'Center y');
    logs.push('Center (0.5, 0.5) passed: maps exactly to screen center (540, 1200)');
  }

  // --- Caso Mirror Symmetry (Front Camera) ---
  {
    const ptNormal = transformLandmarkToPreview({ x: 0.4, y: 0.5 }, frameSize, previewSize, false);
    const ptMirrored = transformLandmarkToPreview({ x: 0.4, y: 0.5 }, frameSize, previewSize, true);
    assertApprox(ptNormal.x + ptMirrored.x, previewSize.width, 0.01, 'Mirror symmetry');
    logs.push('Mirror symmetry passed: horizontal symmetry confirmed (normal + mirrored = preview width)');
  }

  // --- Caso Preview Geometry Cover & Crop ---
  {
    const geom = calculatePreviewGeometry(frameSize, previewSize);
    assertApprox(geom.scale, 1.875, 0.001, 'Scale');
    assertApprox(geom.offsetX, -135, 0.01, 'Crop offsetX');
    assertApprox(geom.offsetY, 0, 0.01, 'Crop offsetY');
    logs.push('Aspect Ratio & Crop passed: scale=1.875, offsetX=-135, offsetY=0');
  }

  // --- Caso Clamping ---
  {
    const clampedCenter = clampToPreview({ x: 540, y: 1200 }, previewSize);
    assertApprox(clampedCenter.x, 540, 0.01, 'Clamped center x');
    assertApprox(clampedCenter.y, 1200, 0.01, 'Clamped center y');

    const clampedUnderflow = clampToPreview({ x: -50, y: -20 }, previewSize);
    assertApprox(clampedUnderflow.x, 0, 0.01, 'Clamped underflow x');
    assertApprox(clampedUnderflow.y, 0, 0.01, 'Clamped underflow y');

    const clampedOverflow = clampToPreview({ x: 1500, y: 3000 }, previewSize);
    assertApprox(clampedOverflow.x, 1080, 0.01, 'Clamped overflow x');
    assertApprox(clampedOverflow.y, 2400, 0.01, 'Clamped overflow y');
    logs.push('Clamping passed: out-of-bounds coordinates safely bounded');
  }

  return {
    success: true,
    results: logs,
  };
}
