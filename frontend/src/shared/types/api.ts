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
  branches?: Branch[];
  _count?: {
    branches?: number;
  };
}

export interface Branch {
  id: string;
  cityId: string;
  name: string;
  address: string;
  phone?: string | null;
  isActive?: boolean;
  city?: City;
  locations?: InventoryLocation[];
  sharedWarehouses?: InventoryLocation[];
  _count?: {
    reservations?: number;
    orders?: number;
  };
}

export type LocationType = 'WAREHOUSE' | 'SALES_FLOOR';

export interface InventoryLocation {
  id: string;
  branchId: string;
  name: string;
  type: LocationType;
  isActive?: boolean;
  branch?: Branch;
  sharedByBranches?: Branch[];
  _count?: {
    stocks?: number;
  };
}

// ==========================================
// 3. CATÁLOGO, VARIANTES Y PRODUCTOS
// ==========================================
export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products?: number;
  };
}

export interface Season {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  _count?: {
    products?: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    products?: number;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  cost: number;
  measurementsJson?: Record<string, any> | null;
  isActive: boolean;
  stock?: number;
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
  collectionId?: string | null;
  supplierId?: string | null;
  isActive: boolean;
  category?: Category;
  season?: Season | null;
  collection?: Collection | null;
  supplier?: Supplier | null;
  variants: ProductVariant[];
  images?: ProductImage[];
  coverImage?: string | null;
  arImageUrl?: string | null;
  variantsCount?: number;
  availableStock?: number;
  priceRange?: { min: number; max: number };
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  productsCount?: number;
  _count?: {
    products?: number;
  };
  products?: Array<{
    id: string;
    name: string;
    brand: string;
    isActive: boolean;
    variantsCount: number;
  }>;
}

export interface CreateSupplierPayload {
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
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

export interface RoleInfo {
  id: string;
  name: string;
  description?: string | null;
  permissions?: { id: string; permission: { id: string; code: string; description?: string } }[];
  _count?: { users: number };
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  isActive: boolean;
  roles: string[];
  rolesDetails?: { id: string; name: string; description?: string }[];
  reservationsCount?: number;
  ordersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleNames?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  roleNames?: string[];
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
}

export interface CreateSeasonPayload {
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
}

export interface CreateSupplierPayload {
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
}

export interface CreateBranchPayload {
  name: string;
  address: string;
  phone?: string;
  cityId: string;
  locations?: { name: string; type: LocationType }[];
  warehouseId?: string;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string;
  phone?: string;
  cityId?: string;
}

export interface CreateCityPayload {
  name: string;
}

export interface CreateLocationPayload {
  name: string;
  type: LocationType;
}

export interface UpdateLocationPayload {
  name?: string;
  branchId?: string;
  type?: LocationType;
}

// ==========================================
// 7. REPORTES INTELIGENTES (IA POR VOZ / TEXTO)
// ==========================================

export type ChartSuggestion = 'BAR' | 'PIE' | 'LINE' | 'AREA' | 'TABLE' | 'BAR_CHART' | 'PIE_CHART' | 'LINE_CHART';

export interface ReportDataPoint {
  [key: string]: any;
}

export interface ReportResponse {
  rawQuery?: string;
  metric?: string;
  chartType?: string;
  executiveSummary?: string;
  confidenceScore?: number;
  dateRange?: { start_date?: string; end_date?: string };
  filtersApplied?: Record<string, any>;
  data: ReportDataPoint[];
  summary_text?: string;
  chart_suggestion?: string;
  generatedAt?: string;
  meta?: {
    confidence?: number;
    metric?: string;
    groupBy?: string;
    period?: string;
    [key: string]: any;
  };
}

export interface QueryReportPayload {
  queryText: string;
}

export interface DashboardKpis {
  activeProducts?: number;
  branchesCount?: number;
  totalReservations?: number;
  totalStockUnits?: number;
  salesToday?: number;
  salesMonth?: number;
  activeReservations?: number;
  criticalStockCount?: number;
  recentOrders?: Order[];
  timestamp?: string;
}

// ==========================================
// 8. PROMOCIONES Y DESCUENTOS
// ==========================================
export interface Promotion {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  discountPercent: number;
  minPurchaseAmount?: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionPayload {
  name: string;
  code: string;
  description?: string;
  discountPercent: number;
  minPurchaseAmount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdatePromotionPayload {
  name?: string;
  code?: string;
  description?: string;
  discountPercent?: number;
  minPurchaseAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CreateMovementPayload {
  variantId: string;
  locationId: string;
  quantity: number;
  type: MovementType;
  reason?: string;
}

