/**
 * Coordinate System Types
 * FashionStore Virtual Try-On - Phase 4
 *
 * Models explicit coordinate spaces:
 * - Space A: Model Space (Normalized [0.0, 1.0])
 * - Space B: Frame Space (Camera sensor buffer pixels)
 * - Space C: Preview Space (Visible preview screen coordinates)
 * - Space D: Screen Space (Window coordinates)
 */

export interface NormalizedPoint {
  readonly x: number;
  readonly y: number;
}

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

export interface FrameSize {
  readonly width: number;
  readonly height: number;
}

export interface PreviewSize {
  readonly width: number;
  readonly height: number;
}

export interface PreviewGeometry {
  /**
   * Scale factor applied to frame to fill the preview under 'cover' strategy.
   * scale = max(previewWidth / frameWidth, previewHeight / frameHeight)
   */
  readonly scale: number;
  /**
   * Rendered frame width after scaling.
   */
  readonly scaledWidth: number;
  /**
   * Rendered frame height after scaling.
   */
  readonly scaledHeight: number;
  /**
   * Horizontal offset (typically <= 0 when cropped horizontally).
   */
  readonly offsetX: number;
  /**
   * Vertical offset (typically <= 0 when cropped vertically).
   */
  readonly offsetY: number;
}

export interface ScreenLandmark {
  readonly id: number;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly score: number;
  readonly visible: boolean;
}

export interface LandmarkDebugSample {
  readonly name: string;
  readonly modelX: number;
  readonly modelY: number;
  readonly frameX: number;
  readonly frameY: number;
  readonly previewX: number;
  readonly previewY: number;
  readonly score: number;
}

export interface CoordinateDebugTelemetry {
  readonly frameSize: FrameSize;
  readonly previewSize: PreviewSize;
  readonly geometry: PreviewGeometry;
  readonly isMirrored: boolean;
  readonly samples: readonly LandmarkDebugSample[];
  readonly timestamp: number;
}
