export interface Promotion {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  discountPercent: number | string;
  minPurchaseAmount?: number | string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
