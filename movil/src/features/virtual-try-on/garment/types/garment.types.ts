import type { DataSourceParam } from '@shopify/react-native-skia';

export type GarmentCategory = 'TOP' | 'DRESS' | 'BOTTOM' | 'OUTERWEAR';

export type GarmentStatus =
  | 'NO_GARMENT_SELECTED'
  | 'GARMENT_LOADING'
  | 'GARMENT_READY'
  | 'GARMENT_ERROR';

export interface GarmentAnchorConfig {
  readonly leftShoulderIndex: number;
  readonly rightShoulderIndex: number;
}

export interface VirtualGarment {
  readonly id: string;
  readonly name: string;
  readonly category: GarmentCategory;
  readonly price: string;
  readonly description?: string;
  readonly imageSource: DataSourceParam;
  readonly originalWidth: number;
  readonly originalHeight: number;
  /** Rigid base width (fallback when shoulders not detected). */
  readonly baseWidth: number;
  /** Rigid base height (fallback). */
  readonly baseHeight: number;
  /** Vertical distance in pixels from the shoulder midpoint up to the garment top neckline. */
  readonly topOffset: number;
  /** Relative collar offset factor (ratio of collar top above shoulder center to garment height). */
  readonly topOffsetFactor?: number;
  /** Vertical ratio [0..1] in the garment texture where the anatomical shoulder line lies.
   * E.g. 0.22 means the shoulder seam line is 22% down from the top edge of the image. */
  readonly shoulderLineRatio?: number;
  /** Horizontal calibration offset in pixels. */
  readonly horizontalOffset: number;
  /** Minimum confidence score required on shoulders to anchor the garment. */
  readonly minShoulderScore: number;
  /**
   * Multiplier applied to the pixel shoulder width to determine garment width.
   * garmentWidth = shoulderWidth * shoulderWidthFactor
   */
  readonly shoulderWidthFactor: number;
  /** Minimum allowed rendered garment width in pixels (clamp guard). */
  readonly minRenderWidth: number;
  /** Maximum allowed rendered garment width in pixels (clamp guard). */
  readonly maxRenderWidth: number;
  /** If true, applies angular rotation from shoulder tilt. */
  readonly applyRotation: boolean;
  /** Real product photograph URI for HUD previews (top card and selector rail) */
  readonly previewUri?: string;
  /** Underlying catalog product ID if linked to a store item */
  readonly productId?: string;
  /** Underlying cart variant ID if linked to a cart item */
  readonly variantId?: string;
  /** True if this garment represents an item currently in the user's cart */
  readonly isFromCart?: boolean;
  /** True if this garment is sourced from the store catalog */
  readonly isFromCatalog?: boolean;
}

export interface GarmentRenderGeometry {
  /** X coordinate of the shoulder anchor point in screen pixels */
  readonly anchorX: number;
  /** Y coordinate of the shoulder anchor point in screen pixels */
  readonly anchorY: number;
  /** Rendered width of the garment in screen pixels */
  readonly width: number;
  /** Rendered height of the garment in screen pixels */
  readonly height: number;
  /** Distance in pixels from the top of the garment to the shoulder line */
  readonly shoulderLineY: number;
  /** Rotation angle in radians (tilt). Strictly between -PI/2 and PI/2 */
  readonly rotation: number;
  /** Whether shoulders are tracked with sufficient confidence */
  readonly isAnchored: boolean;
  /** Legacy x position (top-left) */
  readonly x: number;
  /** Legacy y position (top-left) */
  readonly y: number;
}
