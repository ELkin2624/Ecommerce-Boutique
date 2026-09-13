export type CatalogTab =
  | 'products'
  | 'categories'
  | 'sizes-colors'
  | 'seasons'
  | 'collections'
  | 'suppliers';

export type MasterEntityType = 'categories' | 'seasons' | 'collections' | 'suppliers';

export interface DeleteTarget {
  type: 'product' | 'variant' | 'category' | 'season' | 'collection' | 'supplier';
  id: string;
  name: string;
}

export interface VariantVisualMetadata {
  colorHex?: string;
  imageUrl?: string;
  notes?: string;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    length?: number;
  };
}

export interface ColorPreset {
  name: string;
  hex: string;
}
