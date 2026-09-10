import type { paths, components } from './api.generated';

export type { paths, components };

// ==========================================
// 1. SEGURIDAD Y AUTH (RBAC)
// ==========================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

// ==========================================
// 2. SUCURSALES Y UBICACIONES
// ==========================================

export interface City {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  cityId: string;
  name: string;
  address: string;
  phone?: string | null;
  city?: City;
}

export type LocationType = 'WAREHOUSE' | 'SALES_FLOOR';

export interface InventoryLocation {
  id: string;
  branchId: string;
  name: string;
  type: LocationType;
}

// ==========================================
// 3. CATÁLOGO, VARIANTES Y PRODUCTOS
// ==========================================

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Season {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  cost: number;
  isActive: boolean;
  product?: Product;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isCover: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  brand: string;
  categoryId: string;
  seasonId?: string | null;
  isActive: boolean;
  category?: Category;
  season?: Season | null;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  brand?: string;
  categoryId: string;
  seasonId?: string;
}

export interface CreateVariantPayload {
  sku: string;
  size: string;
  color: string;
  price: number;
  cost: number;
}

// ==========================================
// 4. INVENTARIO Y MOVIMIENTOS
// ==========================================

export interface InventoryStock {
  id: string;
  variantId: string;
  locationId: string;
  quantity: number;
  minStock: number;
  updatedAt: string;
  variant: ProductVariant & { product: { name: string } };
  location: InventoryLocation & { branch: { id: string; name: string } };
}

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'TRANSFER'
  | 'RESERVATION_HOLD'
  | 'RESERVATION_RELEASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT';

export interface InventoryMovement {
  id: string;
  variantId: string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  quantity: number;
  type: MovementType;
  reason?: string | null;
  userId: string;
  createdAt: string;
  variant: ProductVariant & { product: { name: string } };
  fromLocation?: InventoryLocation | null;
  toLocation?: InventoryLocation | null;
  user: { firstName: string; lastName: string; email: string };
}

export interface AdjustStockPayload {
  variantId: string;
  locationId: string;
  quantityDelta: number;
  reason: string;
}

export interface TransferStockPayload {
  variantId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason?: string;
}

// ==========================================
// 5. RESERVAS EN PROBADOR FÍSICO
// ==========================================

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARED'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface ReservationItem {
  id: string;
  reservationId: string;
  variantId: string;
  quantity: number;
  variant: ProductVariant & { product: { name: string } };
}

export interface Reservation {
  id: string;
  userId: string;
  branchId: string;
  status: ReservationStatus;
  expiresAt: string;
  notes?: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone?: string | null };
  branch: { id: string; name: string; address: string };
  items: ReservationItem[];
}

export interface UpdateReservationStatusPayload {
  status: ReservationStatus;
}

// ==========================================
// 6. VENTAS Y POS (PUNTO DE VENTA)
// ==========================================

export type OrderType = 'ONLINE' | 'IN_STORE';
export type OrderStatus = 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'GATEWAY';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface OrderItem {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionRef?: string | null;
}

export interface Order {
  id: string;
  userId: string;
  branchId: string;
  type: OrderType;
  status: OrderStatus;
  total: number;
  createdAt: string;
  branchName?: string;
  branch?: { id: string; name: string };
  items: OrderItem[];
  payments: Payment[];
  client?: string;
  email?: string;
  idempotentReplay?: boolean;
}

export interface CheckoutPayload {
  branchId: string;
  type: OrderType;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  fromReservationId?: string;
  items?: { variantId: string; quantity: number }[];
}

// ==========================================
// 7. REPORTES INTELIGENTES (IA POR VOZ / TEXTO)
// ==========================================

export type ChartSuggestion = 'BAR_CHART' | 'PIE_CHART' | 'LINE_CHART' | 'AREA_CHART' | 'TABLE';

export interface ReportDataPoint {
  [key: string]: any;
}

export interface ReportMeta {
  metric?: string;
  groupBy?: string;
  period?: string;
  filters?: Record<string, any>;
  confidence?: number;
}

export interface ReportResponse {
  summary_text: string;
  chart_suggestion: ChartSuggestion;
  data: ReportDataPoint[];
  meta?: ReportMeta;
}

export interface QueryReportPayload {
  queryText: string;
}

export interface DashboardKpis {
  salesToday: number;
  salesMonth: number;
  activeReservations: number;
  criticalStockCount: number;
  recentOrders: Order[];
}
