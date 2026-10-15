// ============================================================================
// MÓDULO OFFLINE-FIRST & PWA — PUBLIC API EXPORTS
// Arquitectura modular de alta eficiencia y cero acoplamiento
// ============================================================================

// 1. Tipos de dominio y sincronización
export * from './types';

// 2. Base de datos local IndexedDB (Dexie) y Repositorios
export * from './db/app-db';
export * from './db/repositories/generic-repository';

// 3. Patrón Outbox (Cola de operaciones offline con idempotencia)
export * from './outbox/outbox-manager';

// 4. Motor de sincronización y resolución de conflictos
export * from './sync/sync-engine';
export * from './sync/conflict-resolver';
export * from './sync/sync-events';

// 5. Monitor de conectividad de red con validación activa
export * from './network/network-monitor';
export * from './network/useNetworkStatus';

// 6. Registro PWA y Service Worker
export * from './pwa/pwa-register';
export * from './pwa/usePwaInstall';

// 7. Cliente unificado Offline-First
export * from './client/offline-api-client';

// 8. Hooks reactivos de React
export * from './hooks/useOfflineSync';
export * from './hooks/useOfflineTable';

// 9. Componentes UI no invasivos
export * from './ui/OfflineBanner';
export * from './ui/OfflineBadge';
export * from './ui/PwaInstallButton';

// 10. Interceptor transparente de Axios
export * from './interceptors/offline-interceptor';

