export interface ProductImage {
  id: string;
  imageUrl: string;
  isCover: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  wholesalePrice?: number | null;
  wholesaleMinUnits?: number;
  cost: number;
  measurementsJson?: {
    image?: string;
    colorHex?: string;
    shoulders?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    fitType?: 'slim' | 'regular' | 'oversized';
  } | null;
  stock?: number;
  stocks?: Array<{
    id: string;
    quantity: number;
    locationName?: string;
    branchId?: string;
    branchName?: string;
    cityName?: string;
  }>;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  brand: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  season?: { id: string; name: string } | null;
  collection?: { id: string; name: string } | null;
  coverImage?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  priceRange?: { min: number; max: number };
  availableStock?: number;
}
