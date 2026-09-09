---
project: FashionStore
version: 2.1 (Stack 2026 - Production & Parcial Ready)
methodology: PUDS (Proceso Unificado de Desarrollo de Software)
timeline: 4 semanas (MVP Funcional con Enfoque en IA)
status: Active / Single Source of Truth
vault_brain: brain/
last_updated: 2026-09-09
---

# EL SANTO GRIAL DE FASHIONSTORE 🏆 (v2.1)

> **Documento Maestro Oficial de Arquitectura, Estándares, Dominio y Motor de Inteligencia Artificial.**
> Diseñado para máxima densidad de información, consumo óptimo por LLMs y ejecución determinista sin alucinaciones de stack.

---

## 1. TABLA RESUMEN DE STACK Y RESPONSABILIDADES

| Componente | Tecnología | Arquitectura / Patrón | Responsabilidad Principal |
| :--- | :--- | :--- | :--- |
| **Backend Principal** | NestJS (Node.js, TypeScript) | Monolito Modular + DDD Pragmático | Dueño de la regla de negocio, auth, inventario, reservas, pagos, orquestación |
| **Microservicio IA** | FastAPI (Python 3.11+) | Clean Architecture + Routers Modulares | Motor de IA: Recomendaciones, Reportes Generativos (Voz/Texto), Tallas, Asistente |
| **Frontend Web** | React 18+ (TypeScript, Vite) | Feature-Sliced Design (FSD) + PWA | E-commerce web cliente y panel de control administrativo/gerencial |
| **App Móvil** | React Native (TypeScript) | FSD Móvil + Offline Draft + Local Vision | Experiencia cliente en smartphone, cámara para AR Try-on y caché local |
| **Base de Datos** | PostgreSQL 16 | Relacional ACID con Índices y Transacciones | Única fuente de verdad relacional (gestionada por Prisma) |
| **ORM** | **Prisma ORM** (Exclusivo) | Type-safe queries y migraciones estrictas | Migraciones versionadas en `prisma/migrations/`. Prohibido SQL manual en prod |
| **Cloud (Azure)** | Container Apps, Static Web, Blob, Flexible PG | Cloud Nativo Containerizado | Despliegue costo-eficiente para MVP de 4 semanas |

---

## 2. REGLAS INQUEBRANTABLES DEL PROYECTO ⚠️

1. **[MUST] NestJS es el Orquestador del Negocio**: La Web y la App Móvil **NUNCA** consumen a FastAPI directamente. El flujo siempre es: `Cliente -> NestJS -> FastAPI (red interna) -> NestJS -> Cliente`.
2. **[MUST] FastAPI no Duplica Lógica de Negocio**: FastAPI es un servicio computacional y predictivo de IA. No implementa CRUDs de productos ni de usuarios; recibe contexto de NestJS y retorna inferencias estructuradas.
3. **[MUST] Prohibido SQL Libre desde LLMs**: En reportes generativos, el LLM **NUNCA** ejecuta SQL directo en la base de datos. El LLM interpreta lenguaje natural (o voz transcrita) y devuelve un **JSON estructurado de métricas/filtros** que NestJS valida y traduce a consultas seguras.
4. **[MUST] Prisma como Único ORM**: Queda descartado TypeORM o mezclas. Todo el esquema de datos se define y versiona en `backend/prisma/schema.prisma`.
5. **[MUST] No Confiar en Inventario Offline**: La app móvil soporta catálogo en caché y borradores locales (Outbox pattern), pero la confirmación de stock, reserva o compra **SIEMPRE** la valida el backend en tiempo real. No hay ventas offline.
6. **[MUST] Seguridad por Diseño**:
   - Passwords con **Argon2id**.
   - Tokens JWT (Access corto + Refresh token rotativo).
   - RBAC granular (Permisos = `RECURSO:ACCION`, ej: `PRODUCT:CREATE`, `REPORT:GENERATE`).
   - DTOs estrictos con `class-validator` en NestJS y schemas Pydantic v2 en FastAPI.

---

## 3. TOPOLOGÍA DE ARQUITECTURA GENERAL

```text
                       ┌───────────────────────────────┐
                       │        React Web / PWA        │
                       │   Cliente + Administración    │
                       └───────────────┬───────────────┘
                                       │ HTTPS / REST
                                       ▼
                       ┌───────────────────────────────┐
                       │          NestJS API           │
                       │       Modular Monolith        │
                       │ ───────────────────────────── │
                       │ Auth & RBAC   │ Catalog & Var │
                       │ Inventory     │ Branches/Loc  │
                       │ Reservations  │ Orders & Cart │
                       │ Payments      │ Notification  │
                       └───────┬───────────────┬───────┘
                               │               │
                   REST Interno│               │ Prisma ORM
                               │               ▼
                               │    ┌─────────────────────┐
                               │    │     PostgreSQL      │
                               │    └─────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │     FastAPI AI      │
                    │ ─────────────────── │
                    │ 1. Recomendador     │
                    │ 2. Reportes Gen.    │
                    │ 3. Est. Tallas/AR   │
                    │ 4. Asistente        │
                    └─────────────────────┘
                               ▲
                               │ Local Camera / Vision
                    ┌──────────┴──────────┐
                    │    React Native     │
                    │      App Móvil      │
                    │ ─────────────────── │
                    │ MediaPipe / TFLite  │
                    │ SQLite Outbox Sync  │
                    └─────────────────────┘
```

---

## 4. MODELO DE DOMINIO EMPRESARIAL (CLAVE PARA EL NEGOCIO)

### 4.1 Catálogo y Variantes (Ropa)
Una prenda nunca se asocia a stock directamente. Se modela mediante **Variantes**:
```text
Product (id, name, description, brand, season_id, category_id, is_active)
  ├── ProductVariant (id, product_id, sku, color, size, price, cost, barcode, is_active)
  └── ProductImage (id, product_id, url, is_cover, sort_order)
```

### 4.2 Inventario Multi-Sucursal y Ubicaciones
Se separan Sucursales de Almacenes/Piso de Venta:
```text
City (id, name)
  └── Branch (id, city_id, name, address, phone)
        └── Warehouse / Location (id, branch_id, name, type: 'WAREHOUSE' | 'SALES_FLOOR')
              └── InventoryStock (id, variant_id, location_id, quantity, min_stock)
```
- **Movimientos de Inventario (`InventoryMovement`)**: Auditoría inmutable de cada cambio de stock con tipo:
  `PURCHASE`, `RECEIPT`, `TRANSFER`, `RESERVATION_HOLD`, `RESERVATION_RELEASE`, `SALE`, `RETURN`, `ADJUSTMENT`.

### 4.3 Reservas para Probador Físico (No es Venta)
Retiene stock temporalmente sin transacción financiera inicial:
- **Estados**: `PENDING` -> `CONFIRMED` -> `PREPARED` -> `READY` -> `COMPLETED` (vende) o `CANCELLED`/`EXPIRED` (libera).
- Al expirar o cancelar: El stock reservado vuelve a disponible automáticamente.

### 4.4 Ventas y Pagos
```text
Cart (id, user_id, items[])
  └── Order (id, user_id, branch_id, type: 'ONLINE' | 'IN_STORE', status, total)
        └── Payment (id, order_id, method: 'CASH' | 'CARD' | 'QR' | 'GATEWAY', status, transaction_ref)
```

### 4.5 RBAC Granular (Enterprise-Level)
- Tablas: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`.
- Formato de Permiso: `RESOURCE:ACTION` (ej: `INVENTORY:TRANSFER`, `RESERVATION:UPDATE_STATUS`).
- En NestJS: Decorador `@Permissions('INVENTORY:TRANSFER')` con Guard global.

---

## 5. ESPECIFICACIÓN DEL MOTOR DE INTELIGENCIA ARTIFICIAL (FASTAPI) 🤖

> **FOCO PRIORITARIO DE EVALUACIÓN PARA EL PARCIAL**

El microservicio FastAPI expone cuatro módulos esenciales:

### Módulo 1: Motor de Recomendaciones (`/ai/recommendations`)
- **Objetivo**: Sugerir productos hiperpersonalizados en base a historial, talla del usuario, temporada y **disponibilidad en la sucursal activa**.
- **Entrada (desde NestJS)**:
  ```json
  {
    "user_id": "uuid",
    "preferred_sizes": ["M"],
    "purchase_history_categories": ["vestidos", "abrigos"],
    "target_branch_id": "uuid-sucursal-centro",
    "limit": 5
  }
  ```
- **Salida**:
  ```json
  {
    "recommended_variant_ids": ["var-1", "var-2"],
    "confidence_score": 0.94,
    "rationale": "Sugerido por tu preferencia en vestidos talla M con stock en Sucursal Centro"
  }
  ```

### Módulo 2: Reportes Generativos por Texto y Voz (`/ai/reports/parse-query`)
- **Flujo**:
  1. Si es audio: Frontend/Mobile usa Web Speech API o envía audio a NestJS -> Transcripción Speech-to-Text (STT).
  2. Texto transcrito ingresa a FastAPI.
  3. FastAPI utiliza LLM con Prompt Engineering estructurado (System Prompt con esquema restringido de métricas).
  4. FastAPI devuelve JSON validado por Pydantic:
     ```json
     {
       "metric": "sales_revenue",
       "date_range": { "start": "2026-08-01", "end": "2026-08-31" },
       "group_by": "branch",
       "filters": { "category": "vestidos" },
       "chart_suggestion": "BAR_CHART",
       "summary_text": "Ventas de vestidos agrupadas por sucursal durante agosto de 2026"
     }
     ```
  5. NestJS toma este JSON, ejecuta consulta parametrizada con Prisma y retorna los datos tabulares y métricas al Frontend para renderizar el gráfico.

### Módulo 3: Visualización Virtual Asistida y Estimación de Talla (`/ai/fitting`)
- **Procesamiento en Móvil**: React Native Vision Camera ejecuta segmentación y pose básica con MediaPipe localmente para superponer la prenda a 30 fps sin enviar video en tiempo real al servidor.
- **Estimación en FastAPI (`/ai/fitting/estimate-size`)**:
  - Se envía imagen o medidas anatómicas clave (hombros, busto, cintura, cadera).
  - FastAPI compara contra la tabla de medidas de la prenda (`ProductVariant.measurements_json`) y devuelve la talla recomendada (`S`, `M`, `L`) con porcentaje de calce.

### Módulo 4: Asistente Virtual / Chatbot (`/ai/assistant/chat`)
- Chatbot conversacional para búsqueda asistida de productos, consultas de horarios de sucursales y estado de reservas.

---

## 6. ESTRUCTURAS DE PROYECTO OFICIALES

### 6.1 Backend NestJS (`backend/`)
```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/              # Variables de entorno y validación
│   ├── common/              # Decorators, Guards (RBAC), Filters, Interceptors, Pipes
│   ├── modules/             # Módulos Verticales DDD
│   │   ├── auth/            # JWT, Login, Register, Argon2
│   │   ├── users/           # Gestión de usuarios, perfiles
│   │   ├── roles/           # Roles y permisos RBAC
│   │   ├── branches/        # Sucursales y ubicaciones físicas
│   │   ├── catalog/         # Productos, variantes, categorías, colecciones
│   │   ├── inventory/       # Stock, almacenes y movimientos
│   │   ├── reservations/    # Reservas de prendas y ciclo de estados
│   │   ├── orders/          # Carrito, pedidos online y en tienda
│   │   ├── payments/        # Procesamiento de pagos
│   │   ├── reports/         # Orquestador de reportes + cliente FastAPI
│   │   └── ai-client/       # Servicio HTTP tipado hacia FastAPI
│   ├── app.module.ts
│   └── main.ts
├── test/
├── package.json
└── tsconfig.json
```

### 6.2 Microservicio IA FastAPI (`backend-python/`)
```text
backend-python/
├── app/
│   ├── core/                # Config (pydantic-settings), security, logging
│   ├── modules/
│   │   ├── recommendations/ # Routers, schemas, service de recomendación
│   │   ├── generative_reports/ # Text/Voice parse to structured query
│   │   ├── virtual_fitting/ # Algoritmos de estimación de talla
│   │   └── assistant/       # Chatbot y prompts
│   ├── services/            # Integraciones LLM (OpenAI / Azure / Local)
│   └── main.py              # Entrypoint FastAPI con OpenAPI docs
├── requirements/
├── tests/
└── .env.example
```

### 6.3 Frontend React (`frontend/`) - FSD
```text
frontend/src/
├── app/                     # Providers, Router, Store global
├── pages/                   # Vistas completas (Home, Catalog, Checkout, Admin, Reports)
├── widgets/                 # Componentes complejos (Header, ProductGrid, SalesChart)
├── features/                # Interacciones (AuthForm, AddToCart, ReserveModal, QueryVoiceInput)
├── entities/                # Modelos y tarjetas UI (ProductCard, BranchCard, OrderItem)
└── shared/                  # UI kit reutilizable, API Client, Hooks, Types, Tokens
```

### 6.4 App Móvil React Native (`movil/`)
```text
movil/src/
├── app/                     # Navigation (Stacks & Tabs), Providers
├── screens/                 # Vistas (CatalogScreen, FittingRoomScreen, ReservationScreen)
├── features/                # AR Camera overlay, Offline sync queue (SQLite)
├── entities/                # Componentes puros de negocio
└── shared/                  # DB SQLite local, UI Kit NativeWind, API Client
```

---

## 7. MATRIZ DE FASES DE IMPLEMENTACIÓN

Para garantizar la entrega en 4 semanas y superar con éxito el Parcial:

- **Fase 1: Fundaciones y Core de Negocio**
  - Schema Prisma completo (Variantes, Sucursales, RBAC, Inventario).
  - NestJS Auth + Guards RBAC.
  - Setup de FastAPI base y healthchecks.
- **Fase 2: Motor de Inteligencia Artificial (Crítico para el Parcial)**
  - Implementación en FastAPI del parser generativo de reportes (`/ai/reports/parse-query`).
  - Motor de recomendaciones de prendas y tallas (`/ai/recommendations`).
  - Integración NestJS <-> FastAPI con endpoints de prueba.
- **Fase 3: Operaciones de Tienda e Inventario**
  - CRUD de productos con Variantes (Talla/Color/SKU).
  - Movimientos de stock y disponibilidad por sucursal.
  - Flujo de reservas con caducidad automática.
- **Fase 4: Frontend Web & PWA**
  - Panel administrativo con visualización de reportes generativos por voz/texto.
  - Catálogo cliente con variantes y filtro por sucursal.
- **Fase 5: Móvil, Cámara AR y Sincronización Offline**
  - Catálogo móvil con caché SQLite.
  - Probador virtual asistido en cámara.
- **Fase 6: Despliegue Azure & Cierre MVP**
  - Azure Container Apps (NestJS + FastAPI) + PostgreSQL Flexible Server + Static Web Apps.

---

## 8. REFERENCIA AL CEREBRO EXTERNO (OBSIDIAN VAULT) 🧠

El cerebro del proyecto, con grafos de conocimiento, contratos de API detallados, prompts del sistema para el LLM y bitácoras de cada fase, está centralizado en:
👉 `brain/` (sincronizado en tiempo real con `C:\Users\apaza\OneDrive\Documentos\Obsidian Vault\Parcial-SI2`).

*Consultar `brain/00_INDEX_CEREBRO.md` para navegar el grafo completo.*
