import type { Promotion } from '@/shared/types/api';

export type { Promotion };

export interface PromotionStats {
  activeCount: number;
  maxDiscount: number;
  totalCount: number;
}

export interface PromotionsFilterParams {
  searchTerm: string;
  onlyActive: boolean;
}
