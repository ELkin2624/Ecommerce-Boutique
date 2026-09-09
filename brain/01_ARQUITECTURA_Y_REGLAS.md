---
title: Arquitectura del Sistema y Reglas de Oro
aliases: [Arquitectura, Reglas, Estandares]
tags: [architecture, nestjs, fastapi, react, rbac, rules]
created: 2026-09-09
---

# 🏛️ 01. ARQUITECTURA DEL SISTEMA Y REGLAS DE ORO

> Enlace principal: [[00_INDEX_CEREBRO]]

---

## 1. Topología del Sistema y Flujo de Comunicación

El sistema se compone de dos backends y dos clientes frontends, con una frontera de red estricta:

```text
                           ┌───────────────────────────┐
                           │      React Web / PWA      │
                           │ (Cliente + Administración)│
                           └─────────────┬─────────────┘
                                         │ HTTPS / REST
                                         ▼
                           ┌───────────────────────────┐
                           │        NestJS API         │
                           │   (Monolito Modular DDD)  │
                           └───────┬───────────┬───────┘
                                   │           │
                       REST Interno│           │ Prisma ORM
                                   │           ▼
                                   │   ┌───────────────┐
                                   │   │  PostgreSQL   │
                                   │   └───────────────┘
                                   ▼
                        ┌─────────────────────┐
                        │     FastAPI AI      │
                        │ (Microservicio IA)  │
                        └─────────────────────┘
                                   ▲
                                   │ Local Vision / Camera
                        ┌──────────┴──────────┐
                        │    React Native     │
                        │     (App Móvil)     │
                        └─────────────────────┘
```

---

## 2. Decisiones Arquitectónicas Definitivas

| Área | Decisión | Justificación Académica y Práctica |
| :--- | :--- | :--- |
| **Backend Principal** | NestJS (Monolito Modular) | Evita la complejidad de microservicios de red distributed (gRPC/Kafka/múltiples DBs) para 4 semanas, pero preserva alta cohesión por módulos de negocio (DDD pragmático). |
| **Microservicio IA** | FastAPI (Python) | Python es el estándar de facto para IA/ML, procesamiento de lenguaje natural y visión computacional. FastAPI ofrece async nativo y OpenAPI automático. |
| **Persistencia** | PostgreSQL + Prisma ORM | Prisma provee type-safety extremo en TypeScript, migraciones declarativas y previene errores en tiempo de compilación. **Descartado TypeORM**. |
| **Web Frontend** | React + Vite + FSD | Feature-Sliced Design garantiza que el frontend se mantenga modular y escalable. PWA con Service Worker para caché estática. |
| **Mobile** | React Native (TypeScript) | Soporte multiplataforma, acceso a cámara nativa con aceleración por hardware (MediaPipe/TFLite) y base de datos local SQLite para soporte offline ligero. |
| **Cloud (Azure)** | Container Apps + Static Apps | Despliegue modular en contenedores Docker sin la sobrecarga de un cluster Kubernetes completo. |

---

## 3. Las 6 Reglas de Oro Inquebrantables

1. **NestJS es el Dueño del Negocio y Orquestador**:
   - Todo request desde React o React Native pasa por NestJS.
   - FastAPI nunca expone puertos públicos a internet; reside en una red interna accesible solo por NestJS.
2. **FastAPI es Predictivo y Analítico, No Transaccional**:
   - FastAPI no crea usuarios, no procesa pagos, no descuenta inventario.
   - FastAPI recibe datos analíticos, ejecuta modelos de IA o prompts de LLMs, y devuelve inferencias estructuradas.
3. **Prohibido SQL Libre desde LLMs**:
   - En el módulo de reportes generativos por voz o texto, el LLM **jamás** emite strings SQL arbitrarios.
   - El LLM emite un payload JSON validado con Pydantic (`metric`, `period`, `groupBy`, `filters`). NestJS construye la consulta con Prisma de manera parametrizada y segura.
4. **Validación Estricta de Contratos (DTOs / Schemas)**:
   - Todo endpoint en NestJS valida con `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
   - Todo endpoint en FastAPI valida con schemas de `pydantic.BaseModel`.
5. **Inventario Seguro: El Servidor es la Fuente de la Verdad**:
   - La app móvil puede guardar borradores de reserva offline en SQLite.
   - Pero **NUNCA** se confirma una reserva ni se descuenta inventario offline. La confirmación requiere handshake en tiempo real con NestJS.
6. **Zero Hardcoded Secrets**:
   - Toda variable de entorno vive en `.env` (ignorado en git) y se valida al iniciar la aplicación (`@nestjs/config` y `pydantic-settings`).

---

## 4. Estándar de Seguridad Empresarial (RBAC)

El control de acceso se basa en permisos atómicos:
- **Formato**: `RECURSO:ACCION` (ej. `PRODUCT:CREATE`, `INVENTORY:TRANSFER`, `REPORT:VIEW`).
- **Jerarquía**: `User` -> `UserRole` -> `Role` -> `RolePermission` -> `Permission`.
- **Implementación en NestJS**:
  ```typescript
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  @Post()
  async createProduct(@Body() dto: CreateProductDto) { ... }
  ```

---

## 5. Próximo Paso en el Grafo
- Consultar el diseño de la base de datos: [[02_MODELO_DATOS_PRISMA]].
- Consultar el motor de IA para el parcial: [[03_IA_MOTOR_PARCIAL]].
