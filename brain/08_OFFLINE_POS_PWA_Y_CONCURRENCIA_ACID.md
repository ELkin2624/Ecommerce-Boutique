---
title: Arquitectura Offline-First, PWA, Sincronización Outbox y Concurrencia ACID en POS
aliases: [Offline, PWA, Dexie, Sincronizacion, ACID, Idempotencia]
tags: [fashionstore, offline, pwa, dexie, postgresql, acid, idempotency, si2]
created: 2026-10-16
status: Verificado y Probado
---

# 🌐 ARQUITECTURA OFFLINE-FIRST, PWA Y CONCURRENCIA ACID (SI2 - 2026)

> **Módulo Crítico de Alta Disponibilidad:** Garantiza la continuidad comercial ininterrumpida en cajas y mostradores de venta aún sin acceso a Internet, con almacenamiento local en IndexedDB (Dexie.js), sincronización asíncrona mediante el patrón Outbox, protección de idempotencia ante reintentos de red y resolución determinista de colisiones bajo la regla **SERVER_WINS** con integridad transaccional ACID en PostgreSQL.

---

## 📌 1. Casos de Uso y Retos de Negocio

En el entorno de tiendas físicas de ropa y puntos de venta (POS):
1. **Pérdida imprevista de conexión:** Las cajeras deben poder seguir escaneando prendas, cobrando en efectivo o QR local y emitiendo comprobantes sin bloqueos.
2. **Reintentos y Doble Click (Idempotencia):** Al regresar la red o ante presiones reiteradas del botón de cobro, el sistema jamás debe cobrar dos veces ni decrementar dos veces el stock de una misma venta.
3. **Colisión de Stock Crítico ("1 Unidad Restante" / Race Condition):**
   - Dos terminales o tiendas están offline y ambas venden la última unidad en existencia de una prenda exclusiva (`stock = 1`).
   - Al restablecerse la conectividad y ejecutarse la sincronización con la base de datos de la nube, el sistema debe garantizar de forma atómica que **solo una venta sea aceptada** y la otra sea rechazada limpiamente, sin dejar inventarios en negativo (`stock < 0`) ni inconsistencias en Kardex.
4. **Experiencia PWA (Progressive Web App):** Instalable en escritorio y dispositivos móviles con service workers de precarga (Workbox).

---

## 🏛️ 2. Arquitectura Técnica y Flujo de Datos

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   TERMINAL POS (FRONTEND PWA / REACT)                   │
│                                                                        │
│   [Catálogo / Código de Barras] ──▶ [Carrito de Venta Mostrador]       │
│                                                   │                    │
│                                                   ▼                    │
│                                         [handleCheckout()]             │
│                                                   │                    │
│                        ┌──────────────────────────┴──────────────┐     │
│                        ▼                                         ▼     │
│               ¿Hay Internet Activo?                         ¿Offline?  │
│                        │                                         │     │
│            ┌───────────┴───────────┐                             │     │
│            ▼                       ▼                             ▼     │
│       [Online HTTP]       [Falla de Red (0/503)]   [Dexie IndexedDB]   │
│            │                       │               • orders (local)    │
│            ▼                       ▼               • kvCache (stock -) │
│    [Servidor NestJS]      [Encolar en Outbox] ◀─── [outbox items]      │
│                                    │                                   │
│                        [Reconexión Automática]                         │
│                                    │                                   │
│                                    ▼                                   │
│                           [OfflineSyncEngine]                          │
│                                    │                                   │
│                                    ▼                                   │
│                      POST /api/v1/orders/checkout                      │
│                      Headers: X-Tenant-Slug, Idempotency-Key           │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  NUBE CENTRALIZADA (NESTJS + POSTGRESQL)               │
│                                                                        │
│   1. Verificación de Idempotencia:                                     │
│      prisma.order.findUnique({ where: { idempotencyKey } })            │
│      └── Si existe ──▶ Retorna orden previa (idempotentReplay: true)   │
│                                                                        │
│   2. Transacción ACID con Bloqueo de Fila (Row-Level Locking):         │
│      tx.inventoryStock.updateMany({                                    │
│        where: { variantId, locationId, quantity: { gte: requested } }, │
│        data: { quantity: { decrement: requested } }                    │
│      })                                                                │
│      ├── Si count === 1 ──▶ COMMIT (Orden PAID + Kardex SALE)          │
│      └── Si count === 0 ──▶ ROLLBACK total + 400 'Stock insuficiente'  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FEEDBACK DETERMINISTA AL CAJERO                    │
│                                                                        │
│   • Venta 1: Aceptada ──▶ Recibo confirmado en servidor                │
│   • Venta 2: Rechazada ──▶ [PosSyncModal] / [OfflineBadge Alert]        │
│     "Atención: 1 venta rechazada por conflicto de inventario.          │
│      La prenda fue vendida previamente en otro terminal o canal."      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 3. Mecanismos de Integridad Implementados

### A. Idempotencia Robusta
- **Generación de Claves Únicas:** En cada inicio de cobro se genera una clave UUID v4 (`crypto.randomUUID()`) o fallback de alta entropía `POS-${branchId}-${Date.now()}-${random}`.
- **Deduplicación en Servidor:**
  ```typescript
  if (dto.idempotencyKey) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { items: true, payments: true, branch: true }
    });
    if (existingOrder) {
      return { ...existingOrder, total: Number(existingOrder.total), idempotentReplay: true };
    }
  }
  ```
- **Resultado:** Si la red vacila tras el cobro y la cola Outbox retransmite la petición 5 veces, el servidor responderá en todas con el registro original sin realizar cobros dobles ni restar unidades adicionales del inventario.

### B. Prevención de Venta Fantasma ("1 Stock Restante" Race Condition)
- **Principio ACID:** PostgreSQL ejecuta la actualización condicional atómica:
  ```sql
  UPDATE inventory_stocks
  SET quantity = quantity - $requested
  WHERE variant_id = $variantId 
    AND location_id = $locationId 
    AND quantity >= $requested;
  ```
- Si dos terminales compiten simultáneamente por la última unidad (`quantity = 1`):
  1. El primer hilo adquiere el bloqueo de fila exclusivo, verifica `1 >= 1`, actualiza `quantity = 0` y efectúa el `COMMIT`.
  2. El segundo hilo, al liberarse el cerrojo, lee la fila actualizada: ahora `quantity = 0`. La cláusula `WHERE quantity >= 1` evalúa a falso.
  3. El número de filas afectadas (`count`) es `0`.
  4. NestJS lanza `BadRequestException('Stock insuficiente para la variante...')`, lo que dispara un `ROLLBACK` total de la transacción Prisma.
  5. El inventario en la base de datos queda estrictamente en `0` (nunca `-1`).

### C. Actualización Optimista Local y Caché KV en POS
- Cuando se cobra offline, el frontend:
  1. Registra el recibo provisional con prefijo `OFF-` en la tabla `orders` de IndexedDB.
  2. Decrementa inmediatamente el stock en el caché `kvCache` (`pos_stock_${branchId}`) y en la memoria de React Query.
  3. Esto impide que el mismo terminal vuelva a vender la prenda agotada mientras sigue offline.

### D. Interfaz de Gestión de Conflictos (`PosSyncModal`)
- Si una venta offline es rechazada por el servidor durante la sincronización (debido a que otro canal vendió la última unidad primero):
  - El componente `OfflineBadge` cambia a estado de advertencia animada: `Conflictos (1)`.
  - Aparece un banner contextual en el encabezado del Punto de Venta.
  - Al abrir `PosSyncModal`, la cajera puede inspeccionar el detalle del ticket rechazado, ver el motivo devuelto por PostgreSQL ("Stock insuficiente en la nube"), reintentar la operación o descartarla de la cola local.

---

## 🧪 4. Pruebas Automatizadas y Evidencia de Verificación

Se desarrolló y ejecutó la suite de pruebas automatizadas:
`backend/src/modules/orders/orders-offline-acid.spec.ts`

### Resultados de Ejecución

```text
PASS src/modules/orders/orders-offline-acid.spec.ts (15.65 s)
  Offline-First, Idempotencia & Concurrencia ACID en Ventas POS (OrdersService)
    1. Idempotencia en Checkout (Prevención de cobros y decrementos duplicados)
      √ la primera petición debe crear la orden y decrementar el stock exactamente una vez (89 ms)
      √ una segunda petición con la MISMA idempotencyKey debe responder con la orden existente (idempotentReplay: true) SIN volver a decrementar stock ni duplicar cobros (47 ms)
    2. Concurrencia ACID ("1 Stock Restante"): Dos terminales intentan vender la última unidad
      √ exactamente 1 venta debe ser aceptada (PAID) y la otra debe ser rechazada atómicamente por falta de stock (76 ms)
    3. Reversión Atómica (Rollback) cuando una prenda de la cesta no tiene stock
      √ si una cesta contiene una prenda con stock disponible (5 unid) y otra agotada (0 unid), la transacción completa debe abortarse y el stock disponible no debe tocarse (67 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
```

### Compilación PWA Frontend

```text
✓ built in 6.79s
PWA v1.3.0
mode      generateSW
precache  72 entries (3438.03 KiB)
files generated
  dist/sw.js
  dist/workbox-a81cbbba.js
```

---

## 📁 5. Archivos Principales del Módulo

| Módulo | Archivo | Responsabilidad |
|---|---|---|
| **Frontend PWA** | `frontend/vite.config.ts` | Configuración de Workbox, precaching offline y webmanifest instalable |
| **Frontend DB** | `frontend/src/shared/offline/db/app-db.ts` | Base de datos local IndexedDB Dexie (tablas `orders`, `outbox`, `kvCache`) |
| **Frontend Outbox** | `frontend/src/shared/offline/outbox/outbox-manager.ts` | Cola de operaciones salientes con inyección de cabecera `X-Tenant-Slug` |
| **Frontend Sync** | `frontend/src/shared/offline/sync/sync-engine.ts` | Motor de sincronización en segundo plano con reintentos exponenciales |
| **Frontend Conflict**| `frontend/src/shared/offline/sync/conflict-resolver.ts`| Regla `SERVER_WINS` para inventario y órdenes |
| **Frontend UI POS** | `frontend/src/pages/pos/PosPage.tsx` | Cobro POS con decremento optimista y clave de idempotencia UUID |
| **Frontend Modal** | `frontend/src/features/pos/ui/PosSyncModal.tsx` | Bandeja de inspección de transacciones pendientes y resolución de conflictos |
| **Backend Service**| `backend/src/modules/orders/services/orders.service.ts`| Verificación de idempotencia y transacción ACID con `updateMany` condicional |
| **Backend Tests**  | `backend/src/modules/orders/orders-offline-acid.spec.ts`| Pruebas de estrés y concurrencia contra PostgreSQL real |

---

## 🛡️ 6. Aislamiento del Plano de Control SaaS y UX Silenciosa (Actualización)

A partir de pruebas en navegador creando nuevas tiendas (`POST /saas/my-tenants`), se detectaron y corrigieron los siguientes puntos críticos:

1. **Exclusión Estricta de Rutas del Plano de Control (`/saas/*`, `/auth/*`) del Interceptor Offline**:
   - `offline-interceptor.ts` excluye explícitamente `/saas/` y `/auth/`, y solo activa el modo offline cuando existe una desconexión real de red (`!navigator.onLine`, `ERR_NETWORK`), nunca por `ECONNABORTED` (timeout).
   - `outbox-manager.ts` incorpora `purgeControlPlaneItems()` para limpiar automáticamente cualquier petición `/saas` o `/auth` que hubiera quedado encolada previamente en `IndexedDB`.
2. **Optimización de Aprovisionamiento DDL (`pg_catalog.pg_constraint`)**:
   - En `tenant-provisioning.service.ts`, se reemplazó el join de 4 vistas de `information_schema` (que escaneaba todos los esquemas de PostgreSQL y demoraba >15s) por una consulta directa sobre `pg_catalog.pg_constraint`, reduciendo a la mitad el tiempo de aprovisionamiento de tiendas nuevas y evitando timeouts del cliente HTTP.
3. **Precarga Condicionada a Contexto de Tienda Activo y Verificación Limpia de Slugs**:
   - `offlineApi.preloadCriticalData()` y `App.tsx` verifican que exista una tienda activa (`fashionstore_tenant_slug`) antes de precargar `/branches` o `/catalog/*`, eliminando los errores `400 Bad Request` al iniciar sesión sin tienda seleccionada.
   - `LoginPage.tsx` utiliza `GET /saas/domains/check/:slug` (`200 OK { available }`) en lugar de `GET /saas/tenants/:slug`, eliminando los `404 Not Found` en consola mientras el usuario escribe el nombre de su tienda.
4. **UX Offline Exclusiva en el Icono de Conexión (`OfflineBadge`) y Sincronización Automática**:
   - Se desactivó el banner flotante manual (`OfflineBanner.tsx`) y el botón secundario `Cola Outbox` en `PosPage.tsx`.
   - Todo el estado de conectividad se refleja únicamente en el icono de conexión (`OfflineBadge.tsx`): **`En línea`** (verde), **`Offline`** (ámbar cuando se pierde la señal) y **`Sincronizando...`** (azul cuando vuelve la red y `useOfflineSync` + `syncEngine` sincronizan automáticamente en segundo plano).

