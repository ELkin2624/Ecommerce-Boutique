/**
 * Unit Tests for Garment Anchor & Geometry Calculations (Phase 6 & 7)
 */

import {
  calculateShoulderCenter,
  calculateGarmentHeight,
  calculateGarmentGeometry,
} from '../garmentAnchor';
import type { VirtualGarment } from '../../types/garment.types';
import type { ScreenLandmark } from '../../../pose/types/coordinate.types';

export function runGarmentAnchorTests(): { success: boolean; results: string[] } {
  const logs: string[] = [];

  const mockGarment: VirtualGarment = {
    id: 'test-blouse',
    name: 'Blusa Test',
    category: 'TOP',
    price: '$29.99',
    imageSource: 1,
    originalWidth: 800,
    originalHeight: 1200, // 2:3 aspect ratio
    baseWidth: 300,
    baseHeight: 450,
    topOffset: 50,
    topOffsetFactor: 0.08,
    shoulderLineRatio: 0.20,
    horizontalOffset: 0,
    minShoulderScore: 0.3,
    // Phase 7 fields
    shoulderWidthFactor: 0, // 0 = rigid fallback (same as Phase 6 behaviour)
    minRenderWidth: 140,
    maxRenderWidth: 480,
    applyRotation: false,
  };

  // Test 1: Shoulder Center
  const left = { x: 100, y: 200 };
  const right = { x: 300, y: 200 };
  const center = calculateShoulderCenter(left, right);
  if (center.x !== 200 || center.y !== 200) {
    throw new Error(`Test 1 Failed: Expected (200, 200), got (${center.x}, ${center.y})`);
  }
  logs.push('Test 1 (Shoulder Center) passed: (100,200) & (300,200) -> (200,200)');

  // Test 2: Aspect Ratio Preservation
  const computedHeight = calculateGarmentHeight(300, 800, 1200);
  if (Math.abs(computedHeight - 450) > 0.01) {
    throw new Error(`Test 2 Failed: Expected 450, got ${computedHeight}`);
  }
  logs.push('Test 2 (Aspect Ratio) passed: 300 * (1200 / 800) = 450');

  // Test 3: Valid Landmark Anchoring
  const validLandmarks: ScreenLandmark[] = [
    { id: 11, name: 'left_shoulder', x: 100, y: 200, score: 0.85, visible: true },
    { id: 12, name: 'right_shoulder', x: 300, y: 200, score: 0.9, visible: true },
  ];
  const geomValid = calculateGarmentGeometry(validLandmarks, mockGarment);
  if (!geomValid.isAnchored) {
    throw new Error('Test 3 Failed: Should be anchored');
  }
  if (geomValid.anchorX !== 200 || geomValid.anchorY !== 200) {
    throw new Error(`Test 3 Failed: Expected anchor (200, 200), got (${geomValid.anchorX}, ${geomValid.anchorY})`);
  }
  logs.push('Test 3 (Valid Anchoring) passed: Anchored at (200, 200), width=300, height=450');

  // Test 4: Missing or Low Confidence Fallback
  const lowScoreLandmarks: ScreenLandmark[] = [
    { id: 11, name: 'left_shoulder', x: 100, y: 200, score: 0.15, visible: false },
    { id: 12, name: 'right_shoulder', x: 300, y: 200, score: 0.9, visible: true },
  ];
  const geomLow = calculateGarmentGeometry(lowScoreLandmarks, mockGarment);
  if (geomLow.isAnchored) {
    throw new Error('Test 4 Failed: Should NOT be anchored when shoulder score is below minShoulderScore');
  }
  logs.push('Test 4 (Low Confidence Fallback) passed: isAnchored is false when confidence drops');

  return { success: true, results: logs };
}
