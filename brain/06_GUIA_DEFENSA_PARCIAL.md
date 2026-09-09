---
title: Guía Táctica para la Defensa del Examen Parcial
aliases: [Defensa, Parcial, Preguntas Docente, Demo Script]
tags: [defense, exam, parcial, presentation, questions]
created: 2026-09-09
---

# 🎓 06. GUIA TÁCTICA PARA LA DEFENSA DEL EXAMEN PARCIAL (SI2)

> Enlace principal: [[00_INDEX_CEREBRO]] | Motor de IA: [[03_IA_MOTOR_PARCIAL]] | Arquitectura: [[01_ARQUITECTURA_Y_REGLAS]]

---

## 1. Argumentos Clave para Preguntas Típicas de la Docente

### ❓ Pregunta 1: "¿Por qué separaron FastAPI de NestJS en vez de hacer todo en un solo backend?"
- **Respuesta Maestra**:
  > *"Separamos responsabilidades de acuerdo al principio de segregación por naturaleza de carga de trabajo. NestJS maneja la lógica transaccional, autenticación RBAC, consistencia ACID y orquestación con Prisma ORM bajo TypeScript. Python (FastAPI) es el estándar indiscutible para Inteligencia Artificial y Machine Learning. FastAPI funciona como un microservicio interno de inferencia analítica. Esto nos permite escalar el cómputo de IA de manera independiente en Azure Container Apps sin degradar el tiempo de respuesta de las ventas o inventario en NestJS."*

### ❓ Pregunta 2: "¿Por qué un Monolito Modular en NestJS en vez de microservicios para inventario, ventas y catálogo?"
- **Respuesta Maestra**:
  > *"Adoptar microservicios distribuidos para cada dominio de negocio en un MVP de 4 semanas introduce la falacia de la computación distribuida: latencia de red, eventual consistency compleja, sagas distribuidas y sobrecosto de infraestructura. Implementamos un **Monolito Modular con Clean Architecture y DDD pragmático**: el código está estrictamente desacoplado por módulos de negocio, con interfaces claras. Si en el futuro una vertical necesita extraerse, la transición es natural sin haber hipotecado el tiempo del MVP."*

### ❓ Pregunta 3: "¿Cómo evitan que el LLM ejecute sentencias maliciosas como 'DROP TABLE' en los reportes por voz/texto?"
- **Respuesta Maestra**:
  > *"Aplicamos el principio de mínima exposición y arquitectura de dos capas: el LLM **jamás tiene conexión a la base de datos ni emite sentencias SQL directas**. El LLM únicamente actúa como un extractor de entidades estructuradas, devolviendo un JSON validado por Pydantic que especifica la métrica y los filtros permitidos. NestJS toma este JSON y utiliza Prisma con consultas completamente parametrizadas y tipadas. El riesgo de inyección SQL es matemáticamente cero."*

### ❓ Pregunta 4: "¿Por qué diseñaron el catálogo con Variantes de Producto en lugar de stock directo?"
- **Respuesta Maestra**:
  > *"En la industria de la moda, un 'producto' es solo un concepto comercial, pero lo que se compra, almacena y reserva es una prenda física con atributos físicos invariables: Talla, Color y SKU. Además, el inventario no pertenece a la 'sucursal en abstracto', sino a una 'Ubicación' física dentro de ella (depósito vs piso de ventas). Este modelo permite soportar multi-almacén, traslados entre sucursales y auditoría inmutable de movimientos."*

### ❓ Pregunta 5: "¿Cómo gestionan el modo offline en la aplicación móvil?"
- **Respuesta Maestra**:
  > *"Seguimos una política estricta de consistencia: el catálogo previamente visitado y los favoritos están disponibles offline mediante SQLite local. El usuario puede armar un borrador de reserva que se encola en el patrón Outbox. Sin embargo, **nunca confirmamos stock ni realizamos cobros offline**. Cuando se recupera la conectividad, el motor de sincronización envía la solicitud a NestJS, quien valida la disponibilidad física real en la sucursal antes de confirmar la reserva."*

---

## 2. Guión de Demostración en Vivo (Demo Script para el Parcial)

Sigue este orden exacto durante la presentación:

1. **Paso 1: Documentación Interactiva OpenAPI en FastAPI (`/docs`)**:
   - Abrir `http://localhost:8000/docs`.
   - Probar el endpoint `/ai/reports/parse-query` enviando la consulta: *"Muéstrame las 3 prendas más vendidas este mes en Sucursal Centro"*.
   - Mostrar el JSON devuelto con `metric: "top_selling_products"`, validado por Pydantic.
2. **Paso 2: Reporte por Voz en el Frontend**:
   - Abrir el panel de administración en React.
   - Activar el botón de micrófono y decir la consulta por voz.
   - Mostrar cómo la interfaz transcribe el audio, consulta a NestJS (quien orquesta con FastAPI) y pinta automáticamente el gráfico de barras interactivo con el resumen ejecutivo.
3. **Paso 3: Motor de Recomendaciones con Disponibilidad por Sucursal**:
   - Mostrar un usuario con preferencia de talla M.
   - Cambiar de Sucursal A a Sucursal B y demostrar cómo las recomendaciones cambian en tiempo real porque la IA valida la presencia física del producto en stock.
4. **Paso 4: Reserva para Probador Físico**:
   - Generar una reserva para probador.
   - Mostrar cómo el stock pasa a estado retenido temporalmente con temporizador de caducidad.

---

## 3. Checklist Técnico de Emergencia

- [ ] FastAPI corriendo en puerto `8000` con Swagger accesible en `/docs`.
- [ ] NestJS corriendo en puerto `3000` con CORS habilitado para frontend.
- [ ] PostgreSQL corriendo y con datos de prueba cargados (`seed`).
- [ ] Variable `MOCK_MODE=true` lista en FastAPI por si la conexión de la universidad falla.
- [ ] Micrófono habilitado en el navegador para la prueba de voz.
