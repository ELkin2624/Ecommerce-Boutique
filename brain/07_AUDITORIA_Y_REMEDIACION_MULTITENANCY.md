---
title: Auditoría, Arquitectura y Remediación de Multitenancy SaaS
aliases: [Multitenancy, Provisioning, Planes, Tiendas]
tags: [fashionstore, multitenancy, saas, postgresql, arquitectura, si2]
created: 2026-10-16
---

# 🏢 07. AUDITORÍA, ARQUITECTURA Y REMEDIACIÓN DEL MULTITENANCY SAAS

> **Fuente de Verdad Documental**: Esta nota registra las reglas de negocio del modelo SaaS multitenant por esquema PostgreSQL, el diagnóstico basado en evidencias del código real, las decisiones de arquitectura, el plan de trabajo y la bitácora de implementación y pruebas automatizadas.
> Relacionado con: [[00_INDEX_CEREBRO]] | [[01_ARQUITECTURA_Y_REGLAS]] | [[02_MODELO_DATOS_PRISMA]]

---

## 1. CONTEXTO Y REGLAS FUNDAMENTALES DEL PRODUCTO

FashionStore opera como una plataforma **SaaS de comercio electrónico multitenant con aislamiento físico/lógico por esquema de PostgreSQL (`schema-per-tenant`)**.

### 1.1 Distinción de Conceptos del Dominio
1. **Usuario Global (`public.users`)**:
   - Representa la identidad única de una persona dentro de la plataforma (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`).
   - Una misma persona puede crear y administrar múltiples tiendas independientes bajo una única cuenta global sin tener que registrarse con otro correo ni cerrar sesión para crear una nueva tienda.
2. **Tenant / Tienda (`public.tenants`)**:
   - Representa una tienda o negocio independiente dentro del SaaS (`id`, `name`, `slug`, `schema_name`, `plan`, `status`, `owner_email`, `primary_color`, `category`).
   - Cada tienda posee su propio aislamiento comercial total (clientes, productos, variantes, categorías, sucursales, almacenes, pisos de venta/POS, ciudades/departamentos, pedidos, reservas, carritos y movimientos de inventario).
3. **Membresía (`public.tenant_memberships`)**:
   - Representa la autorización explícita de un usuario global sobre un tenant específico (`user_id`, `tenant_id`, `role`, `status = 'ACTIVE'`).
   - Estar autenticado globalmente **NO** otorga acceso a cualquier tienda: tanto el login contextual como el cambio de tienda (`switch-tenant`) y cada petición autenticada validan la membresía activa entre `req.user` y el tenant resuelto.
4. **Plan y Suscripción (`STARTER`, `PRO`, `ENTERPRISE`)**:
   - Condiciones comerciales que determinan cuántas tiendas puede poseer un usuario propietario y qué capacidades operativas tiene cada tienda:
     - **`STARTER`**: Máximo **1 tienda** (`maxStores: 1`), 1 sucursal, 500 productos, 2 usuarios.
     - **`PRO`**: Máximo **3 tiendas** (`maxStores: 3`), 5 sucursales, 5,000 productos, 10 usuarios.
     - **`ENTERPRISE`**: Máximo **10 tiendas** (`maxStores: 10`), sucursales, productos y usuarios ilimitados (`999`/`999999`).
   - La política se aplica obligatoriamente en el **backend** bajo bloqueo transaccional por usuario (`pg_advisory_xact_lock`) y nunca confía ciegamente en parámetros enviados desde el navegador para eludir el cupo del plan vigente del propietario.
5. **Esquema PostgreSQL (`tenant_<slug_sanitizado>`)**:
   - Espacio aislado donde residen las tablas operativas y comerciales de cada tienda.
   - Se resuelve en el backend (`TenantContextMiddleware` + `PrismaService` con `AsyncLocalStorage` y `SET LOCAL search_path TO "<schemaName>"`) exclusivamente a partir del registro oficial de `public.tenants`.

---

## 2. DIAGNÓSTICO DE PROBLEMAS ENCONTRADOS (EVIDENCIA EN CÓDIGO)

Tras auditar el repositorio (`backend` y `frontend`) y contrastar con las 15 pruebas existentes en `backend/src/modules/saas/multitenancy-acceptance.spec.ts`, se identificaron las causas raíz exactas de los problemas reportados:

### 2.1 Causa Raíz del Problema 1: Ausencia de flujo en el panel para crear otra tienda o cambiar de tienda directamente
- **Evidencia en Frontend (`frontend/src/widgets/topbar/Topbar.tsx`, líneas 99–104 y 195–204)**:
  - La barra superior (`Topbar`) solo mostraba una etiqueta estática con `currentTenant.name` y un botón `"Cambiar de Tienda"` que cerraba el contexto y redirigía a `/admin/login`.
  - Cuando un usuario con 1 sola tienda iniciaba sesión, entraba directamente a `/dashboard`, pero no disponía de ningún botón, selector ni modal `"Crear nueva tienda"` / `"Añadir tienda"` dentro del panel administrativo.
- **Evidencia en Frontend (`frontend/src/app/store/tenant.store.ts`, líneas 56–79)**:
  - `fetchTenants()` consultaba el endpoint público `GET /saas/tenants` (que listaba todos los tenants públicos en lugar de las tiendas autorizadas del usuario autenticado) y aplicaba un fallback inseguro a `tenants[0]`.
- **Evidencia en Backend (`backend/src/modules/saas/saas.controller.ts` y `saas.service.ts`)**:
  - Solo existía `POST /api/v1/saas/tenants` (endpoint público de onboarding inicial que exige `ownerName`, `ownerEmail` y `password`).
  - No existían endpoints autenticados (`@UseGuards(JwtAuthGuard)`) para:
    1. Consultar las tiendas propias/autorizadas del usuario en sesión y el cupo de su plan (`GET /api/v1/saas/my-tenants`).
    2. Crear una nueva tienda usando la identidad global del usuario ya autenticado sin pedirle registrarse de nuevo (`POST /api/v1/saas/my-tenants`).
    3. Cambiar de tienda activa desde el panel emitiendo tokens con alcance del nuevo tenant tras verificar membresía (`POST /api/v1/saas/switch-tenant`).

### 2.2 Causa Raíz de la Sección 4: Límites del Plan al Crear Tiendas
- **Evidencia en Backend (`backend/src/modules/saas/tenant-provisioning.service.ts` y `saas.service.ts`)**:
  - Aunque `LoginPage.tsx` (línea 748) indicaba visualmente `Límite según tu plan: Starter (1), Pro (3), Enterprise (10)`, el backend en `TenantProvisioningService.createTenant()` **no verificaba** cuántas tiendas poseía ya el usuario ni cuál era el límite (`maxStores`) de su plan autorizado.
  - Cualquier usuario en plan `STARTER` podía enviar múltiples peticiones `POST /api/v1/saas/tenants` o llamadas concurrentes y aprovisionar tiendas ilimitadas.

### 2.3 Causa Raíz del Problema 2: Sucursal, Almacén, POS y Ciudades precreados al crear una tienda nueva + Contaminación de Caché Frontend
1. **Aprovisionamiento Backend (`backend/src/modules/saas/tenant-provisioning.service.ts`)**:
   - **Línea 250**: Ejecutaba `INSERT INTO "${schemaName}".cities SELECT * FROM public.cities ON CONFLICT DO NOTHING;`, copiando automáticamente 3 ciudades (`La Paz`, `Santa Cruz`, `Cochabamba`) en toda tienda nueva.
   - **Líneas 281–307**: El paso 11 insertaba explícitamente en cada nuevo esquema:
     - 1 sucursal en `"${schemaName}".branches`: `'Casa Matriz - ' + dto.name` (`'Av. Principal #100'`).
     - 1 piso de venta / POS en `"${schemaName}".inventory_locations`: `'Piso de Venta'` (`type = 'SALES_FLOOR'`).
     - 1 almacén en `"${schemaName}".inventory_locations`: `'Almacén Central'` (`type = 'WAREHOUSE'`).
2. **Creación implícita de recursos auxiliares en servicios comerciales**:
   - **`backend/src/modules/branches/services/branches.service.ts` (líneas 167–185)**: Cuando el usuario creaba una sucursal sin enviar `dto.locations`, un bloque `else` creaba automáticamente dos ubicaciones (`Piso de Ventas <nombre>` y `Almacén Principal <nombre>`).
   - **`backend/src/modules/catalog/services/catalog.service.ts` (líneas 286–294)**: Cuando se llamaba a `createProduct()` sin `categoryId`, creaba silenciosamente una categoría `'General'` (`slug: 'general'`).
3. **Contaminación de Caché en Frontend al cambiar o crear tienda**:
   - **`frontend/src/shared/offline/client/offline-api-client.ts`**: Guardaba respuestas en IndexedDB (`offlineDb.kvCache`) bajo claves globales como `'branches_all'` y `'branches_cities'` sin prefijar el `tenantSlug` activo.
   - **`frontend/src/app/providers/QueryProvider.tsx` y `frontend/src/app/store/auth.store.ts`**: Al cambiar de tienda no se limpiaba `queryClient.clear()` ni se reiniciaban `activeBranchId` / `activeBranchName`, provocando que datos en memoria de la tienda anterior pudieran mostrarse temporalmente en la nueva tienda.

---

## 3. ARQUITECTURA DE LA SOLUCIÓN Y DECISIONES DE DISEÑO

### 3.1 Política Centralizada de Planes (`PLAN_LIMITS`)
Se define como única fuente de verdad en el dominio SaaS (`backend/src/modules/saas/saas.service.ts` y `tenant-provisioning.service.ts`):
- `STARTER`: `maxStores = 1`, `maxBranches = 1`, `maxProducts = 500`, `maxUsers = 2`.
- `PRO`: `maxStores = 3`, `maxBranches = 5`, `maxProducts = 5000`, `maxUsers = 10`.
- `ENTERPRISE`: `maxStores = 10`, `maxBranches = 999`, `maxProducts = 999999`, `maxUsers = 999`.

**Regla de Autorización y Concurrencia**:
- Al aprovisionar una tienda para un usuario, se adquiere un bloqueo transaccional en PostgreSQL basado en el correo/ID del propietario (`SELECT pg_advisory_xact_lock(hashtext(lower(ownerEmail)))`) dentro de la transacción de validación y reserva.
- Si el usuario ya posee $\ge 1$ tienda(s) (en estado `ACTIVE` o `PROVISIONING`), su plan efectivo se determina a partir de sus tiendas existentes registradas en base de datos (no del campo `plan` que envíe el cliente en una solicitud manual, evitando escalación de privilegios por manipulación del payload).
- Si `ownedStoresCount >= maxStores`, el backend rechaza la operación con `403 Forbidden` y un mensaje claro indicando el plan actual, el límite de tiendas y las tiendas utilizadas.

### 3.2 Aprovisionamiento 100% Limpio (Zero Commercial Seed Data)
Al crear un nuevo tenant (`TenantProvisioningService.createTenant`):
- Se clona únicamente la estructura DDL de tablas, índices, secuencias y claves foráneas en el esquema `"${schemaName}"`.
- Se inserta en `"${schemaName}".users` únicamente el usuario propietario (`ADMIN`) y su membresía `OWNER` en `public.tenant_memberships`.
- **Conteo estricto inicial = 0** en todas las tablas comerciales y operativas del esquema:
  - `branches = 0`
  - `inventory_locations = 0` (0 `WAREHOUSE` y 0 `SALES_FLOOR`/POS)
  - `cities = 0`
  - `categories = 0`
  - `products = 0`
  - `product_variants = 0`
  - `inventory_stock = 0`
  - `orders = 0`
  - `reservations = 0`
  - `carts = 0`

### 3.3 Gestión de Tiendas desde el Panel Administrativo (Backend + Frontend FSD)
- **Nuevos Endpoints Protegidos (`JwtAuthGuard`)**:
  - `GET /api/v1/saas/my-tenants`: Devuelve la lista de tiendas donde el usuario autenticado tiene membresía `ACTIVE`, junto con el resumen de su plan (`effectivePlan`, `ownedCount`, `maxStores`, `canCreateMore`).
  - `POST /api/v1/saas/my-tenants`: Crea una nueva tienda para el usuario autenticado en sesión (`req.user`), reutilizando su identidad global en `public.users`, verificando límites del plan y devolviendo la nueva tienda + credenciales de sesión actualizadas para cambiar a ella de inmediato si lo desea.
  - `POST /api/v1/saas/switch-tenant`: Verifica que el usuario autenticado tenga membresía `ACTIVE` en el tenant destino (`slug`), sincroniza/verifica su registro de staff en el esquema destino y emite un nuevo par `{ accessToken, refreshToken, user, tenant }`.
- **Experiencia en el Panel (`Topbar.tsx` y `CreateStoreModal.tsx`)**:
  - Selector interactivo de tiendas en el `Topbar` que muestra todas las tiendas autorizadas del usuario, el uso de su plan (`X / Y tiendas`) y el botón visible **`+ Crear nueva tienda`** (disponible tanto cuando tiene 1 sola tienda como cuando tiene varias).
  - Al cambiar de tienda o tras crear una nueva tienda:
    1. Se actualiza `tenant.store.ts` y `auth.store.ts` (reseteando `activeBranchId` y `activeBranchName`).
    2. Se limpia la caché de `queryClient.clear()`.
    3. `OfflineApiClient` aísla las claves de IndexedDB prefijándolas con `${tenantSlug}:${cacheKey}`.

---

## 4. PLAN DE TRABAJO Y ESTADO DE EJECUCIÓN

| Fase | Tarea / Entregable | Estado |
| :--- | :--- | :--- |
| **Fase 1** | Diagnóstico de código real, estado de Git y verificación de causas raíz | **Probado y verificado** |
| **Fase 2** | Documentación de arquitectura, reglas y plan en Obsidian (`07_AUDITORIA_Y_REMEDIACION_MULTITENANCY.md`) | **Probado y verificado** |
| **Fase 3.1** | Aprovisionamiento limpio sin sucursales, almacenes, POS ni ciudades precreadas (`tenant-provisioning.service.ts`) | **Probado y verificado** |
| **Fase 3.2** | Eliminación de auto-creación implícita de ubicaciones en `BranchesService` y categoría `'General'` en `CatalogService` | **Probado y verificado** |
| **Fase 3.3** | Política de límites por plan (`STARTER: 1, PRO: 3, ENTERPRISE: 10`) con bloqueo transaccional anti-concurrencia y endpoints `my-tenants` / `switch-tenant` | **Probado y verificado** |
| **Fase 3.4** | Selector de tiendas en `Topbar.tsx`, modal `CreateStoreModal.tsx`, aislamiento de caché por tenant y estados vacíos limpios | **Probado y verificado** |
| **Fase 4** | Batería de pruebas automatizadas de aceptación (Pruebas A a G en `multitenancy-acceptance.spec.ts`) | **Probado y verificado** |
| **Fase 5** | Actualización final de bitácora y resultados verificados en Obsidian | **Probado y verificado** |

---

## 5. BITÁCORA DE IMPLEMENTACIÓN Y PRUEBAS VERIFICADAS

### 5.1 Archivos Modificados y Creados
1. **Backend (`backend/`)**:
   - `src/modules/saas/tenant-provisioning.service.ts`:
     - Centralización de la política de límites por plan (`PLAN_LIMITS`: `STARTER: 1`, `PRO: 3`, `ENTERPRISE: 10` tiendas).
     - Método `getUserPlanAndStoreQuota()` que calcula el plan efectivo autorizado a partir de las tiendas propias registradas en base de datos, impidiendo que un cliente malicioso eleve su cupo enviando un campo `plan` manipulado.
     - Bloqueo exclusivo transaccional en PostgreSQL (`SELECT pg_advisory_xact_lock(hashtext(...))`) por propietario y por subdominio para impedir condiciones de carrera.
     - Eliminación de la copia automática de ciudades (`INSERT INTO "${schemaName}".cities SELECT * FROM public.cities`) y eliminación de la inserción automática de `Casa Matriz`, `Piso de Venta` (`SALES_FLOOR`/POS) y `Almacén Central` (`WAREHOUSE`).
     - Clonación y alineación de los tipos `ENUM` de PostgreSQL (`LocationType`, `MovementType`, `ReservationStatus`, `OrderType`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`) dentro del esquema de cada tenant para compatibilidad nativa con Prisma Client (`?schema=tenant_...`).
   - `src/modules/saas/dto/create-my-tenant.dto.ts`:
     - Nuevos DTOs validados (`CreateMyTenantDto` y `SwitchTenantDto`) para la creación de tiendas y cambio de tienda activa desde sesión autenticada.
   - `src/modules/saas/saas.service.ts` y `src/modules/saas/saas.controller.ts` y `src/modules/saas/saas.module.ts`:
     - `GET /api/v1/saas/my-tenants` (`@UseGuards(JwtAuthGuard)`): retorna las tiendas autorizadas del usuario y el resumen de cupo de su plan (`planQuota`).
     - `POST /api/v1/saas/my-tenants` (`@UseGuards(JwtAuthGuard)`): crea una nueva tienda reutilizando el usuario global autenticado sin pedirle registrarse de nuevo, aplica las restricciones del plan y emite tokens para el nuevo esquema.
     - `POST /api/v1/saas/switch-tenant` (`@UseGuards(JwtAuthGuard)`): valida membresía en `public.tenant_memberships` para la tienda destino y emite tokens (`accessToken`, `refreshToken`) y perfil de usuario del esquema destino.
     - `GET /api/v1/saas/domains/check/:slug`: verificación en tiempo real de disponibilidad de subdominio.
   - `src/common/guards/jwt-auth.guard.ts`:
     - Permite que las rutas globales `/api/v1/saas/*` autentiquen la identidad JWT global del usuario sin fallar por un header `X-Tenant-Slug` previo, mientras mantiene la verificación estricta de membresía en todas las rutas operativas de tienda.
   - `src/modules/branches/services/branches.service.ts`:
     - Eliminada la creación implícita de `Piso de Ventas` y `Almacén Principal` en `BranchesService.create()` cuando el usuario no envía `dto.locations`.
   - `src/modules/catalog/services/catalog.service.ts`:
     - Eliminada la creación oculta de la categoría `'General'` en `CatalogService.createProduct()`, exigiendo `categoryId` explícito.
   - `src/modules/saas/multitenancy-acceptance.spec.ts`:
     - Ampliado a **20 pruebas automatizadas** cubriendo todas las Pruebas Base (1 a 8) y las Pruebas A a G.

2. **Frontend (`frontend/`, siguiendo Feature-Sliced Design)**:
   - `src/features/saas/ui/CreateStoreModal.tsx` y `src/features/saas/index.ts`:
     - Modal interactivo en el panel para crear una nueva tienda bajo la cuenta global activa, mostrando el plan actual, la barra de uso de tiendas (`X de Y tiendas utilizadas`), validación en tiempo real del subdominio y manejo claro de errores de límite de plan (`403 Forbidden`).
   - `src/widgets/topbar/Topbar.tsx`:
     - Selector interactivo de tiendas (`Mis Tiendas Autorizadas`) con cambio en 1 clic (`switchActiveTenant`), indicador de cupo del plan y botón directo **`+ Crear nueva tienda`** visible tanto cuando el usuario tiene 1 sola tienda como cuando administra varias.
   - `src/app/store/tenant.store.ts` y `src/app/store/auth.store.ts`:
     - Integración con `/saas/my-tenants` y `/saas/switch-tenant`, limpieza automática de `queryClient.clear()`, `offlineApi.clearTenantCache()` y reinicio de `activeBranchId`/`activeBranchName` al cambiar de tienda o cerrar sesión.
   - `src/shared/offline/client/offline-api-client.ts` y `src/features/branches/model/useBranchesData.ts`:
     - Aislamiento de claves de caché en IndexedDB (`kvCache`) y `React Query` por `tenantSlug` para impedir que sucursales o ciudades de una tienda anterior se muestren al cambiar a una tienda recién creada.
   - `src/features/branches/ui/dialogs/BranchFormDialog.tsx`:
     - Checkboxes de ubicaciones iniciales (`createSalesFloor`, `createWarehouse`) desmarcados por defecto (`false`, opt-in explícito) y activación automática del campo de nueva ciudad cuando la tienda inicia con `0` ciudades.

### 5.2 Resultados Verificados de Compilación y Pruebas Automatizadas
- **Compilación Backend (`pnpm run build` -> `nest build`)**: **Probado y verificado** (Código de salida `0`, 0 errores TypeScript).
- **Compilación Frontend (`pnpm run build` -> `tsc -b && vite build`)**: **Probado y verificado** (Código de salida `0`, 2,271 módulos transformados, 0 errores TypeScript).
- **Batería de Pruebas Automatizadas (`pnpm test` en `backend`)**: **Probado y verificado** (`2 passed, 2 total` suites; **`20 passed, 20 total` tests**):
  - **Prueba A (Usuario con 1 sola tienda + creación desde el panel)**: Verificado (`PASS`). Entra directamente a su tienda (`autoRedirectSlug`) y desde el panel consulta su cupo y crea una nueva tienda reutilizando su usuario global.
  - **Prueba B (Tienda nueva 100% limpia)**: Verificado (`PASS`). Inicia con `0` sucursales, `0` almacenes, `0` POS (`SALES_FLOOR`), `0` ciudades/departamentos, `0` productos, `0` variantes, `0` categorías, `0` pedidos, `0` stock y `1` único usuario (el propietario).
  - **Prueba C (Creación manual de ciudad, sucursal y almacén)**: Verificado (`PASS`). Crear 1 sucursal no crea almacenes ni POS ocultos (`locations.length === 0`); al agregar 1 almacén explícito solo existe ese almacén y el segundo tenant permanece en `0`.
  - **Prueba D (Límite del plan alcanzado + anti-concurrencia)**: Verificado (`PASS`). Usuario en `STARTER` (`maxStores = 1`) recibe `403 Forbidden` al intentar crear una segunda tienda desde el panel o directamente por API (incluso enviando `plan: 'ENTERPRISE'`), sin dejar esquemas huérfanos; peticiones concurrentes sobre el último cupo `PRO` (`3/3`) se serializan con `pg_advisory_xact_lock` permitiendo exactamente 1 y rechazando la otra.
  - **Prueba E (Usuario con plan `PRO` multitienda)**: Verificado (`PASS`). Crea tienda de ropa y tienda de zapatos bajo el mismo usuario global (`1` registro en `public.users`, `2` membresías `OWNER`) y cambia entre ambas con emisión de sesión aislada.
  - **Prueba F (Aislamiento comercial y operativo entre tiendas del mismo dueño)**: Verificado (`PASS`). Sucursal, ciudad, almacén, categoría y producto creados en Tienda 1 (Ropa) no aparecen en Tienda 2 (Zapatos), que permanece en `0`.
  - **Prueba G (Rechazo de acceso cruzado no autorizado)**: Verificado (`PASS`). `JwtAuthGuard` y `SaasService.switchTenant` rechazan con `403 Forbidden` cualquier intento de operar o cambiar a un tenant sin membresía activa.

