---
title: Roadmap de Implementación por Fases (Prioridad Parcial e IA)
aliases: [Fases, Roadmap, Plan de Trabajo, Cronograma]
tags: [roadmap, phases, implementation, scrum, puds, parcial]
created: 2026-09-09
---

# 🚀 04. ROADMAP DE IMPLEMENTACIÓN POR FASES (ENFOQUE EN PARCIAL)

> Enlace principal: [[00_INDEX_CEREBRO]] | Motor de IA: [[03_IA_MOTOR_PARCIAL]] | Modelo de Datos: [[02_MODELO_DATOS_PRISMA]]

> 🎯 **ESTRATEGIA TÁCTICA:** 
> Dado que la docente evaluará el **microservicio de IA** en el parcial, el roadmap desacopla y acelera el desarrollo de FastAPI en las primeras fases para tener endpoints funcionales, testeables y documentados en Swagger de inmediato.

---

## 📅 Matriz Cronológica de Fases

```text
┌────────────────────────────────────────────────────────────────────────┐
│ SEMANA 1                                                               │
├───────────────────────────────────┬────────────────────────────────────┤
│ FASE 0: Setup y Estructura        │ FASE 1: Prisma DB & Auth RBAC      │
│ - Limpieza y monorepo             │ - Schema Prisma completo           │
│ - Variables de entorno            │ - Migraciones iniciales & Seed     │
│ - Dependencias Node y Python      │ - JWT + Argon2 + Guards de permiso │
├───────────────────────────────────┴────────────────────────────────────┤
│ SEMANA 2 (★ HITO PARCIAL: MOTOR DE IA LISTO)                           │
├───────────────────────────────────┬────────────────────────────────────┤
│ FASE 2: Microservicio FastAPI IA  │ FASE 3: Orquestación NestJS <-> IA │
│ - Recomendador contextual         │ - Cliente HTTP interno tipado      │
│ - Parser de reportes (Voz/Texto)  │ - Safe Query Builder para reportes │
│ - Estimación de talla             │ - Fallback y Swagger defensible    │
├───────────────────────────────────┴────────────────────────────────────┤
│ SEMANA 3                                                               │
├───────────────────────────────────┬────────────────────────────────────┤
│ FASE 4: Negocio (Stock y Reservas)│ FASE 5: Frontend Web React (FSD)   │
│ - Variantes de ropa (SKU/Talla)   │ - Panel admin con Reportes Voz/IA  │
│ - Ubicaciones y movimientos       │ - Catálogo cliente con stock local │
│ - Ciclo de reservas para probador │ - PWA con Service Worker           │
├───────────────────────────────────┴────────────────────────────────────┤
│ SEMANA 4                                                               │
├───────────────────────────────────┬────────────────────────────────────┤
│ FASE 6: Mobile React Native & AR  │ FASE 7: Azure Deploy y Cierre      │
│ - Cámara y superposición prenda   │ - Azure Container Apps (Nest+Py)   │
│ - Caché local y Outbox SQLite     │ - PostgreSQL Flexible Server       │
│ - Integración de tallas           │ - Ensayo final de defensa docente  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 📋 Detalle de Tareas por Fase

### FASE 0: Inicialización y Monorepo
- [x] Configurar proyecto `backend/` con NestJS 12, TypeScript estricto, ESM y pnpm.
- [x] Dependencias Core, Auth, Persistencia y Swagger instaladas y validadas.
- [x] Variables de entorno `.env` y `.env.example` configuradas.
- [x] Reglas de código (linter `oxlint`, `prettier`, Jest tests) verificadas al 100%.

### FASE 1: Persistencia Prisma y Core de Autenticación RBAC
- [x] Implementar `schema.prisma` completo con Variantes, Sucursales, Ubicaciones, Movimientos, Reservas y RBAC.
- [x] Ejecutar migración inicial versionada: `20260909180603_init_fashionstore_core`.
- [x] Crear y ejecutar script de semillas (`seed.ts`) con roles, permisos, admin (Argon2id), ciudades, sucursales y catálogo inicial.
- [x] `PrismaService` y `PrismaModule` con hooks de conexión implementados.
- [x] Módulo `auth/`: Register, Login (Argon2id), Refresh Tokens con rotación, Logout y Me.
- [x] `PermissionsGuard` y decorador `@Permissions(...)` implementados y probados en vivo.
- [x] Documentación interactiva Swagger operativa en `/api/docs`.

### FASE 2: Microservicio de IA en FastAPI (⭐ Foco del Parcial)
- [x] Crear estructura modular limpia en `backend-python/app/modules/`:
  - `recommendations/`: Algoritmo híbrido contextual (talla + historial + stock en sucursal).
  - `generative_reports/`: Parser generativo de texto y voz a JSON analítico seguro.
  - `virtual_fitting/`: Estimación de tallas por medidas antropométricas y tablas de calce.
  - `assistant/`: Chatbot conversacional con FAQs y sugerencias de compra.
- [x] Implementar capa dual con `MOCK_MODE=True` para garantizar 100% de operatividad en vivo sin internet durante la defensa.
- [x] Levantar FastAPI en puerto 8000 con documentación interactiva Swagger en `http://localhost:8000/docs`.

### FASE 3: Integración NestJS con FastAPI & Pipeline de Reportes
- [x] Crear módulo `ai-client/` en NestJS con cliente HTTP tipado (`AiClientService`).
- [x] Módulo `reports/` con Safe Query Builder sobre Prisma (cero riesgo de SQL Injection).
- [x] Endpoint `POST /api/v1/reports/query` para consultas en texto en lenguaje natural.
- [x] Endpoint `POST /api/v1/reports/voice` para consultas por comando de voz.
- [x] Endpoint `GET /api/v1/reports/dashboard` con métricas y KPIs en vivo.
- [x] Verificación de seguridad RBAC (`REPORT:GENERATE` y `REPORT:VIEW`) con tests automáticos al 100%.

### FASE 4: Módulos de Negocio en NestJS (Variantes, Stock y Reservas)
- [x] Módulo `catalog/`: CRUD de productos, variantes y fotos con proyecciones optimizadas y cero consultas N+1.
- [x] Módulo `inventory/`:
  - Endpoint de consulta de stock por sucursal y variante con proyecciones y agrupaciones limpias.
  - Transferencias atómicas entre ubicaciones con validación condicional a nivel de fila (`quantity: { gte: qty }`).
  - Registro de movimientos inmutables de auditoría Kardex (`InventoryMovement`).
- [x] Módulo `reservations/`:
  - Crear reserva con retención atómica de stock en probador (`RESERVATION_HOLD`) y semántica de 48h.
  - Cancelación segura con claim atómico condicional (`updateMany`) que previene doble liberación.
  - Tarea programada (Cron Job con `@nestjs/schedule`) idempotente que expira reservas vencidas y libera stock (`RESERVATION_RELEASE`).
- [x] Módulo `orders/`:
  - Carrito de compras (`/api/v1/cart`) con upsert y validación de disponibilidad.
  - Checkout transaccional con idempotencyKey (`Order.idempotencyKey` @unique).
  - Reglas omnicanal: `IN_STORE + CASH` inmediato `PAID`/`SUCCESS`; `ONLINE + CASH` rechazado; venta desde reserva completada sin doble descuento físico de stock.
- [x] Pruebas de concurrencia real ejecutadas sin mocks (colisión simultánea por `stock = 1`: exactamente 1 petición gana con 201, la otra 400, stock final = 0).

### FASE 5: Frontend Web React (Feature-Sliced Design)
- [ ] Configurar routing y store global con Zustand.
- [ ] Implementar módulo de **Reportes Inteligentes**:
  - Componente de captura de voz con Web Speech API (`SpeechRecognition`).
  - Renderizado dinámico de gráficos (barras, torta, líneas) según `suggested_chart`.
  - Resumen analítico generado por IA.
- [ ] Catálogo interactivo con selector de variantes (color/talla) y disponibilidad en tiempo real por sucursal seleccionada.
- [ ] Panel de administración con vistas protegidas por componente `<Can permission="...">`.

### FASE 6: Aplicación Móvil React Native (AR y Offline)
- [ ] Inicialización de proyecto React Native con Expo / Bare workflow.
- [ ] Pantalla de probador virtual (`VirtualFittingScreen`):
  - Acceso a cámara con React Native Vision Camera.
  - Superposición de prenda alineada a hombros.
  - Formulario/estimador de talla consultando endpoint de IA.
- [ ] Motor offline: Base de datos SQLite local para consultar catálogo en caché y encolar reservas en tabla `outbox_queue`.

### FASE 7: Despliegue en Azure y Ensayo de Defensa
- [ ] Crear Dockerfiles optimizados multi-stage para NestJS y FastAPI.
- [ ] Desplegar en Azure Container Apps con variables inyectadas.
- [ ] Desplegar React Web en Azure Static Web Apps.
- [ ] Ejecutar ensayo general del guión de defensa ([[06_GUIA_DEFENSA_PARCIAL]]).

---

## 5. Próximo Paso en el Grafo
- Ver contratos de comunicación: [[05_CONTRATOS_API_NEST_FASTAPI]].
- Ver preparación para la defensa del parcial: [[06_GUIA_DEFENSA_PARCIAL]].
