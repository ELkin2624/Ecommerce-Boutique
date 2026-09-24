/**
 * Rendering Types
 * FashionStore Virtual Try-On - Phase 5 (Skia Renderer)
 */

import type { PoseLandmarkName } from '../../pose/types/pose.types';

export interface RenderPoint {
  readonly x: number;
  readonly y: number;
  readonly score: number;
  readonly visible: boolean;
}

export interface SkeletonBoneDefinition {
  readonly from: PoseLandmarkName;
  readonly to: PoseLandmarkName;
}

export interface SkeletonRenderConfig {
  readonly minScore: number;
  readonly pointRadius: number;
  readonly pointColor: string;
  readonly shoulderPointColor: string;
  readonly boneStrokeWidth: number;
  readonly boneColor: string;
  readonly smoothingFactor: number; // 0.0 (infinite smooth) to 1.0 (no smoothing)
}

export interface RenderMetrics {
  readonly renderFps: number;
  readonly validPointsCount: number;
  readonly timestamp: number;
}
