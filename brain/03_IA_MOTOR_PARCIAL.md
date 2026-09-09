---
title: Motor de Inteligencia Artificial (FastAPI) - Foco del Parcial
aliases: [IA, Motor IA, FastAPI, Recomendador, Reportes Generativos, Vestidor Virtual]
tags: [ai, fastapi, llm, recommendation, speech-to-text, mediapipe, parcial]
created: 2026-09-09
---

# 🤖 03. MOTOR DE INTELIGENCIA ARTIFICIAL (FASTAPI) - FOCO DEL PARCIAL

> Enlace principal: [[00_INDEX_CEREBRO]] | Arquitectura: [[01_ARQUITECTURA_Y_REGLAS]] | Contratos: [[05_CONTRATOS_API_NEST_FASTAPI]]

> ⚠️ **ATENCIÓN:** Este componente es el **eje central de evaluación del examen parcial**. Debe estar implementado con endpoints verificables, documentación Swagger interactiva (`/docs`) y tolerancia a fallos.

---

## 1. Misión y Límites de FastAPI

- **Rol**: Microservicio de computación analítica, visión e inferencia de lenguaje natural.
- **Protocolo**: REST interno bajo HTTP JSON.
- **Orquestación**: Consumido exclusivamente por NestJS.
- **Estrategia de Resiliencia (Parcial Ready)**: Todo endpoint de IA incluye un **Fallback Heurístico Local** para garantizar que la demo a la docente funcione al 100% incluso si la API Key de OpenAI/Azure experimenta latencia o falta de internet.

---

## 2. Los 4 Módulos de IA para el Parcial

### 🧠 MÓDULO 1: Motor de Recomendaciones Inteligentes
- **Endpoint**: `POST /ai/recommendations`
- **Algoritmo**: Sistema Híbrido (Content-Based + Filtrado por Talla y Disponibilidad Física).
- **Problema que resuelve**: Los sistemas de recomendación tradicionales recomiendan productos agotados o de tallas incompatibles. Nuestro motor prioriza prendas que:
  1. Coinciden con la talla del usuario.
  2. Pertenecen a categorías de su historial de compras y reservas.
  3. **Tienen stock físico mayor a 0 en la sucursal seleccionada**.

#### Payload de Entrada (desde NestJS)
```json
{
  "user_id": "usr-98213",
  "preferred_sizes": ["M", "38"],
  "history_categories": ["vestidos", "abrigos"],
  "target_branch_id": "suc-centro-01",
  "candidate_products": [
    {
      "product_id": "prod-101",
      "name": "Vestido Gala",
      "category": "vestidos",
      "available_sizes_in_branch": ["M", "L"],
      "popularity_score": 0.88
    },
    {
      "product_id": "prod-102",
      "name": "Pantalón Casual",
      "category": "pantalones",
      "available_sizes_in_branch": ["S"],
      "popularity_score": 0.95
    }
  ]
}
```

#### Respuesta de FastAPI
```json
{
  "recommendations": [
    {
      "product_id": "prod-101",
      "score": 0.94,
      "reason": "Excelente afinidad con tu historial en 'vestidos' y disponible en tu talla M en Sucursal Central"
    }
  ],
  "engine_version": "hybrid-v1"
}
```

---

### 🎙️ MÓDULO 2: Reportes Generativos por Voz y Texto (El Módulo Estrella)
- **Endpoint**: `POST /ai/reports/parse-query`
- **Pipeline Completo**:
  ```text
  [Micrófono] 
      │ Voz (Audio Blob o Web Speech API)
      ▼
  [Speech-to-Text] 
      │ Texto: "¿Cuáles fueron los 3 vestidos más vendidos en agosto en la sucursal norte?"
      ▼
  [FastAPI - LLM Structured Parser]
      │ Prompt Engineering con Few-Shot + Pydantic Schema
      ▼
  [JSON Estructurado Validado]
      │ { metric: "top_selling", category: "vestidos", branch: "sucursal norte", ... }
      ▼
  [NestJS - Safe Query Builder]
      │ Prisma: findMany() parametrizado y seguro (Cero SQL Injection)
      ▼
  [Frontend React] -> Gráfico Chart.js / Recharts + Resumen Ejecutivo
  ```

#### Esquema Pydantic del Parser (`schemas.py`)
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class MetricType(str, Enum):
    SALES_REVENUE = "sales_revenue"
    TOP_SELLING_PRODUCTS = "top_selling_products"
    RESERVATIONS_COUNT = "reservations_count"
    INVENTORY_LEVELS = "inventory_levels"

class ChartType(str, Enum):
    BAR = "BAR"
    LINE = "LINE"
    PIE = "PIE"
    TABLE = "TABLE"

class ParsedReportQuery(BaseModel):
    raw_query: str
    metric: MetricType
    period_start: Optional[str] = Field(None, description="YYYY-MM-DD")
    period_end: Optional[str] = Field(None, description="YYYY-MM-DD")
    branch_name: Optional[str] = None
    category_name: Optional[str] = None
    limit: int = Field(5, ge=1, le=50)
    suggested_chart: ChartType
    executive_summary_prompt: str
```

#### System Prompt Inmune a Inyección
```text
Eres el Analista de Datos Oficial de FashionStore. Tu única tarea es extraer entidades analíticas 
de la pregunta del usuario y mapearlas estrictamente al esquema JSON proporcionado.
NUNCA generes sentencias SQL (SELECT, DROP, INSERT). Si el usuario pide algo ajeno a ventas, 
inventario o reservas de ropa, clasifica la métrica como 'UNKNOWN'.
```

---

### 👗 MÓDULO 3: Probador Virtual Asistido y Estimación de Tallas
- **Arquitectura Dividida (Edge + Cloud)**:
  1. **Edge (React Native en Smartphone)**:
     - React Native Vision Camera accede a la cámara nativa a 30 FPS.
     - MediaPipe / TensorFlow Lite móvil detecta los 33 puntos de referencia del cuerpo humano (pose estimation).
     - Superpone la prenda en 2D ajustando escala por la distancia entre hombros (`left_shoulder` a `right_shoulder`).
  2. **Cloud (FastAPI - `/ai/fitting/estimate-size`)**:
     - Calcula la talla óptima combinando medidas corporales estimadas con la tabla de medidas del fabricante.

#### Payload para Estimación de Talla
```json
{
  "product_id": "prod-101",
  "shoulder_width_cm": 42.5,
  "chest_circumference_cm": 94.0,
  "waist_circumference_cm": 78.0,
  "height_cm": 172.0
}
```

#### Respuesta de FastAPI
```json
{
  "recommended_size": "M",
  "confidence_percentage": 92.5,
  "fit_analysis": {
    "chest": "Calce ideal (holgura 3cm)",
    "waist": "Calce entallado confortable",
    "shoulders": "Exacto a la costura"
  },
  "alternative_size": "L (si prefieres corte holgado)"
}
```

---

### 💬 MÓDULO 4: Asistente Virtual / Chatbot de Compras
- **Endpoint**: `POST /ai/assistant/chat`
- **Capacidades**:
  - Responde dudas sobre políticas de reserva (ej: "¿Cuánto tiempo guardan mi ropa en el probador?").
  - Ayuda a buscar prendas por estilo ("Busco un conjunto formal para una boda en verano").
  - Ofrece respuestas enriquecidas con enlaces directos al producto.

---

## 3. Plan de Contingencia para el Parcial (Demo Segura)

Para evitar sorpresas durante la presentación ante el docente:
1. **Modo `MOCK_MODE=true` en `.env`**:
   - Si no hay saldo en OpenAI o se corta la red de la universidad, FastAPI conmuta a un motor determinista basado en Regex y heurística de distancias Euclidianas.
   - La docente observará la misma entrada y la misma estructura de salida válida.
2. **Swagger Docs Listos**:
   - `http://localhost:8000/docs` con ejemplos interactivos precargados para cada uno de los 4 endpoints.
3. **Colección Postman / ThunderClient**:
   - Scripts listos para disparar en vivo peticiones representativas.

---

## 4. Próximo Paso en el Grafo
- Ver el plan de ejecución por fases: [[04_ROADMAP_FASES]].
- Ver los contratos técnicos detallados: [[05_CONTRATOS_API_NEST_FASTAPI]].
