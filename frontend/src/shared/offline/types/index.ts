// ============================================================================
// MODULO OFFLINE-FIRST & PWA — DEFINICIÓN DE TIPOS DE DOMINIO Y SINCRONIZACIÓN
// ============================================================================

export type OutboxAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PATCH';

export type OutboxStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';

export type ConflictStrategy = 'SERVER_WINS' | 'CLIENT_WINS' | 'LAST_WRITE_WINS';

/**
 * Representa una operación encolada en el Outbox para ser sincronizada con el backend.
 */
export interface OutboxItem<T = any> {
  id?: number;
  idempotencyKey: string;
  entity: string;
  action: OutboxAction;
  entityId?: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  headers?: Record<string, string>;
  status: OutboxStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Item para caché genérico Clave-Valor en IndexedDB con tiempo de vida (TTL).
 */
export interface KVCacheItem<T = any> {
  key: string;
  data: T;
  expiresAt: number;
  updatedAt: number;
}

/**
 * Metadatos comunes para entidades almacenadas localmente.
 */
export interface OfflineEntityMetadata {
  isLocalOnly?: boolean;
  syncedAt?: number;
  updatedAt?: number;
}

/**
 * Entidades específicas del negocio cacheadas localmente para acceso instantáneo
 */
export interface OfflineProduct extends OfflineEntityMetadata {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  isActive: boolean;
  variants?: any[];
  images?: any[];
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  rawData?: any;
}

export interface OfflineCategory extends OfflineEntityMetadata {
  id: string;
  name: string;
  slug: string;
}

export interface OfflineBranch extends OfflineEntityMetadata {
  id: string;
  cityId: string;
  name: string;
  address: string;
  phone?: string | null;
  isActive?: boolean;
  locations?: any[];
}

export interface OfflineCustomer extends OfflineEntityMetadata {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface OfflineOrder extends OfflineEntityMetadata {
  id: string;
  orderNumber?: string;
  customerId?: string;
  branchId?: string;
  status: string;
  paymentMethod: string;
  items: any[];
  total: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  createdAt: number | string;
  offlinePendingSync?: boolean;
}

export interface OfflineInventory extends OfflineEntityMetadata {
  id: string;
  variantId: string;
  locationId: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
}

/**
 * Resultados del ciclo de sincronización
 */
export interface SyncItemResult {
  id?: number;
  idempotencyKey: string;
  entity: string;
  action: OutboxAction;
  status: 'SUCCESS' | 'FAILED' | 'CONFLICT';
  error?: string;
  serverData?: any;
}

export interface SyncCycleResult {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  conflicts: number;
  startedAt: number;
  completedAt: number;
  items: SyncItemResult[];
}

/**
 * Estado de conectividad de la aplicación
 */
export interface NetworkState {
  isOnline: boolean;
  isServerReachable: boolean;
  lastCheckedAt: number;
  latencyMs?: number;
}

/**
 * Estrategia de lectura de datos
 */
export type QueryStrategy = 'CACHE_FIRST' | 'NETWORK_FIRST' | 'NETWORK_ONLY' | 'STALE_WHILE_REVALIDATE';
