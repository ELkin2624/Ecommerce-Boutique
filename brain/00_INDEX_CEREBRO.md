---
title: Índice Maestro del Cerebro - FashionStore
aliases: [Cerebro, Index, MOC]
tags: [fashionstore, architecture, brain, moc, si2]
created: 2026-09-09
---

# 🧠 CEREBRO DEL PROYECTO FASHIONSTORE (SI2 - 2026)

> **Centro de Conocimiento, Grafos, Arquitectura y Trazabilidad de Fases.**
> Este espacio sirve como memoria permanente de alta densidad para optimizar el entendimiento del proyecto, minimizar el consumo de tokens y asegurar una ejecución determinista.

---

## 🗺️ Mapa de Contenido (MOC)

```text
                                 [[00_INDEX_CEREBRO]]
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
[[01_ARQUITECTURA_Y_REGLAS]]    [[02_MODELO_DATOS_PRISMA]]      [[03_IA_MOTOR_PARCIAL]]
(Topología, NestJS, FastAPI,      (Variantes, Stock,              (Recomendador, Reportes Voz,
 FSD, Cloud y Restricciones)       Reservas, Movimientos)          Estimación Tallas, Asistente)
          │                               │                               │
          └───────────────────────────────┼───────────────────────────────┘
                                          │
                                          ▼
                                [[04_ROADMAP_FASES]]
                           (Fase 1 a 6 con orden táctico)
                                          │
          ┌───────────────────────────────┴───────────────────────────────┐
          │                                                               │
          ▼                                                               ▼
[[05_CONTRATOS_API_NEST_FASTAPI]]                               [[06_GUIA_DEFENSA_PARCIAL]]
(DTOs, Schemas Pydantic, DTOs Nest)                             (Checklist, Demos, Respuestas Clave)
```

---

## 📂 Enlaces Directos a los Módulos del Cerebro

1. **[[01_ARQUITECTURA_Y_REGLAS]]**:
   - Monolito Modular en NestJS + Microservicio de IA en FastAPI.
   - Patrón FSD en React y React Native.
   - Las 6 Reglas de Oro inquebrantables del proyecto.
   - Seguridad (Argon2id, JWT, RBAC granular) y Topología Azure.

2. **[[02_MODELO_DATOS_PRISMA]]**:
   - Modelo de Variantes de Ropa (`Product` -> `ProductVariant`: SKU, Talla, Color).
   - Separación de `Branch` (Sucursal) vs `Warehouse` (Almacén/Piso de Venta).
   - Historial de Movimientos de Inventario (`InventoryMovement`).
   - Ciclo de Vida de Reservas de prendas para probador (`PENDING` a `COMPLETED` / `EXPIRED`).
   - Modelo de Pedidos (`Order`), Carrito (`Cart`) y Pagos (`Payment`).

3. **[[03_IA_MOTOR_PARCIAL]]** ⭐ *(Módulo Crítico para la Evaluación)*:
   - **IA 1 - Recomendador Inteligente**: Filtrado contextual por historial, talla y disponibilidad física en sucursal.
   - **IA 2 - Reportes Generativos (Voz y Texto)**: Pipeline de Speech-to-Text -> LLM parsea a JSON estructurado -> Consulta parametrizada en NestJS (cero riesgo de SQL Injection).
   - **IA 3 - Probador Virtual Asistido y Estimación de Tallas**: Procesamiento local en React Native con MediaPipe y cálculo de calce en FastAPI.
   - **IA 4 - Asistente Conversacional**: Chatbot de compras e inventario.

4. **[[04_ROADMAP_FASES]]**:
   - Plan de 4 semanas dividido en 6 fases medibles.
   - Cronograma detallado con entregables específicos para el Parcial.

5. **[[05_CONTRATOS_API_NEST_FASTAPI]]**:
   - Definición de payloads JSON entre NestJS y FastAPI para todas las operaciones de IA.
   - Mecanismos de timeout, circuit breaker y graceful degradation si la IA no está disponible.

6. **[[06_GUIA_DEFENSA_PARCIAL]]**:
   - Preguntas típicas de la docente de SI2 y cómo responderlas técnicamente.
   - Casos de prueba en vivo para demostrar la IA en la defensa.

---

## ⚡ Guía Rápida de Decisión

- ¿Dónde se crea una tabla nueva? -> `backend/prisma/schema.prisma` mediante `npx prisma migrate dev`.
- ¿Quién habla con la IA? -> **Solo NestJS**. El cliente jamás llama a FastAPI directamente.
- ¿Se permite SQL generado por el LLM? -> **NO**, solo JSON estructurado de filtros y métricas.
- ¿Puede una reserva venderse directamente sin pasar por stock? -> No, reserva es retención temporal con fecha límite de expiración.
