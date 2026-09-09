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
- [ ] Verificar y limpiar dependencias en `backend-python/` (FastAPI).
- [ ] Inicializar proyecto `backend/` con NestJS CLI (`@nestjs/cli`).
- [ ] Configurar TypeScript estricto en todos los proyectos.
- [ ] Establecer `.env.example` unificado para puertos y credenciales.

### FASE 1: Persistencia Prisma y Core de Autenticación RBAC
- [ ] Implementar `schema.prisma` completo definido en [[02_MODELO_DATOS_PRISMA]].
- [ ] Ejecutar primera migración: `npx prisma migrate dev --name init_domain`.
- [ ] Crear script de semillas (`seed.ts`) con:
  - 4 Roles: `ADMIN`, `STORE_MANAGER`, `CASHIER`, `CLIENT`.
  - 2 Ciudades y 3 Sucursales con sus Almacenes y Pisos de Venta.
  - Catálogo inicial de 10 productos con variantes (tallas XS-XL, colores) y stock.
- [ ] Módulo `auth/`: Login, Register con Argon2id y emisión de JWT con claims de permisos.
- [ ] Módulo `common/guards/permissions.guard.ts` para verificar permisos granulares.

### FASE 2: Microservicio de IA en FastAPI (⭐ Foco del Parcial)
- [ ] Crear estructura modular en `backend-python/app/modules/`:
  - `recommendations/`: Algoritmo híbrido (talla + historial + stock en sucursal).
  - `generative_reports/`: Parser LLM que convierte texto de consulta a JSON de filtros analíticos.
  - `virtual_fitting/`: Estimación de tallas por medidas anatómicas.
  - `assistant/`: Chatbot con FAQs y búsqueda de prendas.
- [ ] Implementar capa `MOCK_MODE=True` para garantizar 100% de operatividad en vivo sin internet.
- [ ] Levantar FastAPI y comprobar documentación interactiva en `http://localhost:8000/docs`.

### FASE 3: Integración NestJS con FastAPI & Pipeline de Reportes
- [ ] Crear módulo `ai-client/` en NestJS usando `@nestjs/axios` con interceptor de timeout y reintentos.
- [ ] Endpoint en NestJS: `POST /api/v1/reports/query`:
  - Recibe string de texto (o transcripción de voz).
  - Llama a `POST http://fastapi:8000/ai/reports/parse-query`.
  - Recibe el JSON validado con métricas y filtros.
  - Ejecuta la consulta segura en Prisma agrupando ventas, inventario o reservas.
  - Devuelve datos tabulares listos para gráficos.

### FASE 4: Módulos de Negocio en NestJS (Variantes, Stock y Reservas)
- [ ] Módulo `catalog/`: CRUD de productos, variantes y fotos.
- [ ] Módulo `inventory/`:
  - Endpoint de consulta de stock por sucursal y variante.
  - Registro de movimientos inmutables (`InventoryMovement`).
- [ ] Módulo `reservations/`:
  - Crear reserva con retención de stock (`RESERVATION_HOLD`).
  - Tarea programada (Cron Job con `@nestjs/schedule`) para expirar reservas vencidas y liberar stock (`RESERVATION_RELEASE`).
- [ ] Módulo `orders/`: Carrito, checkout y registro de venta física o digital.

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
