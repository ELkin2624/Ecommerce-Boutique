---
title: Contratos de API entre NestJS y FastAPI
aliases: [Contratos, API, DTOs, Schemas, Integracion]
tags: [contracts, openapi, pydantic, nestjs, fastapi, integration]
created: 2026-09-09
---

# 🔌 05. CONTRATOS DE API ENTRE NESTJS Y FASTAPI

> Enlace principal: [[00_INDEX_CEREBRO]] | Motor de IA: [[03_IA_MOTOR_PARCIAL]] | Roadmap: [[04_ROADMAP_FASES]]

---

## 1. Principio de Contrato Primero (Contract-First)

Para evitar desincronizaciones entre el equipo de TypeScript (NestJS) y Python (FastAPI):
- **FastAPI** define los esquemas canónicos usando **Pydantic v2**.
- **NestJS** replica estos contratos mediante **DTOs con class-validator** y tipos TypeScript.
- Toda llamada HTTP entre NestJS y FastAPI incluye:
  - Header de autenticación de servicio interno: `X-Internal-Secret: <TOKEN>`.
  - Timeout estricto de 4500ms con Circuit Breaker en NestJS para evitar degradar el hilo principal si la IA demora.

---

## 2. Contrato 1: Motor de Recomendación

### Endpoint: `POST /ai/recommendations`

#### Payload Request (NestJS -> FastAPI)
```json
{
  "user_id": "string (uuid)",
  "preferred_sizes": ["string"],
  "history_categories": ["string"],
  "target_branch_id": "string (uuid)",
  "candidate_products": [
    {
      "product_id": "string (uuid)",
      "name": "string",
      "category": "string",
      "available_sizes_in_branch": ["string"],
      "popularity_score": 0.85
    }
  ],
  "limit": 5
}
```

#### Payload Response (FastAPI -> NestJS)
```json
{
  "status": "success",
  "recommendations": [
    {
      "product_id": "string (uuid)",
      "score": 0.95,
      "reason": "string (explicación amigable para el usuario)"
    }
  ],
  "latency_ms": 124
}
```

---

## 3. Contrato 2: Reportes Generativos por Voz/Texto

### Endpoint: `POST /ai/reports/parse-query`

#### Payload Request (NestJS -> FastAPI)
```json
{
  "query_text": "¿Cuáles son las prendas más vendidas en la sucursal Centro en el último mes?",
  "request_user_id": "string (uuid)",
  "user_role": "STORE_MANAGER"
}
```

#### Payload Response (FastAPI -> NestJS)
```json
{
  "metric": "top_selling_products",
  "date_range": {
    "start_date": "2026-08-01",
    "end_date": "2026-08-31"
  },
  "filters": {
    "branch_name": "Sucursal Centro",
    "category": null
  },
  "limit": 5,
  "suggested_chart": "BAR",
  "executive_summary": "Top 5 prendas con mayor volumen de ventas registradas en Sucursal Centro durante agosto 2026."
}
```

---

## 4. Contrato 3: Estimación de Tallas y Calce

### Endpoint: `POST /ai/fitting/estimate-size`

#### Payload Request (NestJS -> FastAPI)
```json
{
  "product_id": "string (uuid)",
  "shoulder_width_cm": 42.0,
  "chest_circumference_cm": 95.5,
  "waist_circumference_cm": 80.0,
  "hip_circumference_cm": 98.0,
  "height_cm": 174.0,
  "weight_kg": 68.0
}
```

#### Payload Response (FastAPI -> NestJS)
```json
{
  "recommended_size": "M",
  "confidence_score": 0.93,
  "details": {
    "shoulders": "Ajuste exacto",
    "chest": "Ajuste cómodo (+4cm de holgura recomendada)",
    "waist": "Ajuste perfecto"
  },
  "fit_verdict": "FITS_TRUE_TO_SIZE"
}
```

---

## 5. Próximo Paso en el Grafo
- Consultar la guía para la defensa del examen parcial: [[06_GUIA_DEFENSA_PARCIAL]].
