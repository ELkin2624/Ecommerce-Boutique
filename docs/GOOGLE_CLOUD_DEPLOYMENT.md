# 🚀 Guía de Despliegue a Google Cloud (Free Tier) con Docker y Supabase

Esta guía detalla paso a paso cómo desplegar la plataforma **FashionStore Omnicanal** en **Google Cloud (GCP)** utilizando **Docker** y **Cloud Run**, conectado a tu base de datos **Supabase (PostgreSQL)**, optimizado para aprovechar la **capa gratuita (Free Tier)** y mantener el costo en **\$0.00 USD / mes** o el mínimo absoluto.

---

## 🏗️ 1. Arquitectura de Despliegue

```
                                  [ Usuario / Navegador ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ fashionstore-frontend ]                   [ fashionstore-backend ]
             Google Cloud Run                            Google Cloud Run
             Docker (Nginx Alpine)                       Docker (Node.js 20 NestJS)
             • Scale-to-zero (0 instancias)             • Scale-to-zero (0 instancias)
             • SPA React PWA + Vite                      • API REST (/api/v1) + Swagger (/api/docs)
             • SSL / HTTPS Automático                    • Prisma ORM + Multi-Tenant
                       │                                           │
                       └─────────── Llamadas API /api/v1 ──────────┘
                                                                   │
                                                                   ▼  (SSL Mode Require)
                                                       [ Base de Datos Supabase ]
                                                       PostgreSQL 15 / Pooler
```

---

## 💰 2. ¿Cómo Garantizamos el Tier Gratuito (\$0.00 / Costo Mínimo)?

Google Cloud ofrece una de las capas gratuitas permanentes más generosas de la industria:

| Recurso | Límite Gratuito Mensual (Free Tier) | Configuración Aplicada en FashionStore |
| :--- | :--- | :--- |
| **Peticiones Cloud Run** | **2,000,000 (2 millones) de peticiones / mes** | Ambos servicios comparten este límite. Para proyectos universitarios o pymes, es prácticamente ilimitado. |
| **Memoria Cloud Run** | **360,000 GB-segundos / mes** | Frontend: `256 MiB`<br>Backend: `512 MiB` |
| **vCPU Cloud Run** | **180,000 vCPU-segundos / mes** | `--cpu 1` asignado **solo durante el procesamiento de la petición** (no consume nada en reposo). |
| **Instancias Mínimas** | N/A | **`--min-instances 0`** (Escala a cero: cuando nadie visita el sitio, los contenedores se apagan y el costo es **\$0.00**). |
| **Instancias Máximas** | N/A | **`--max-instances 2`** (Límite de seguridad contra picos o ataques). |
| **Google Cloud Build** | **120 minutos de compilación diarios gratis** | Se usa para compilar los contenedores Docker directamente en la nube sin saturar tu PC. |
| **Artifact Registry** | **0.5 GB de almacenamiento / mes gratis** | Imágenes multi-stage optimizadas (Backend ~180MB, Frontend ~25MB). |
| **Base de Datos** | N/A (Alojada en Supabase) | Capa gratuita de Supabase: 500 MB de PostgreSQL, backups y pooling incluidos. |

> [!IMPORTANT]
> **El secreto del costo cero:** La bandera `--min-instances 0` garantiza que tu proyecto no facture por horas de máquina encendida, solo se activa por milisegundos cuando un usuario envía una petición.

---

## 🔌 3. Preparación de la Conexión de Supabase

En tu panel de Supabase:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra a **Project Settings** (el engranaje abajo a la izquierda) > **Database**.
3. Baja hasta la sección **Connection string** y selecciona la pestaña **URI**.
4. Copia la cadena de conexión. Tiene dos modalidades:

### Opción Recomendada (Session Pooler o Directo en puerto 5432):
```
postgresql://postgres.[TU_PROJECT_REF]:[TU_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```
o Directo:
```
postgresql://postgres:[TU_PASSWORD]@db.[TU_PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

> [!TIP]
> Recuerda reemplazar `[TU_PASSWORD]` por la contraseña de la base de datos que creaste al iniciar tu proyecto en Supabase. Si tiene caracteres especiales (como `#`, `@`, `%`), asegúrate de que estén codificados en formato URL (por ejemplo `#` es `%23`).

---

## ⚡ 4. Despliegue Rápido Automatizado

### Método A: Desde Google Cloud Shell (Recomendado — 100% en el Navegador)

No necesitas instalar Docker ni el SDK de Google Cloud en tu computadora local:

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Haz clic en el ícono de terminal **Cloud Shell** (arriba a la derecha `>_`).
3. Sube el proyecto a Cloud Shell (puedes clonarlo de tu repositorio de GitHub):
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd <NOMBRE_DEL_REPO>
   ```
4. Dale permisos de ejecución y corre el script de despliegue:
   ```bash
   chmod +x deploy-cloudrun.sh
   ./deploy-cloudrun.sh
   ```
5. El script te solicitará tu **Project ID** y tu **DATABASE_URL** de Supabase. Automáticamente:
   - Habilita las APIs necesarias.
   - Compila el backend y frontend en la nube con Cloud Build.
   - Aplica las migraciones en Supabase (`RUN_MIGRATIONS=true`).
   - Te entrega las URLs públicas con HTTPS gratuito.

---

### Método B: Desde Windows PowerShell (Si tienes instalado `gcloud`)

1. Abre PowerShell en la carpeta raíz del proyecto (`C:\Parcial-si2`):
   ```powershell
   .\deploy-cloudrun.ps1
   ```
2. Sigue las instrucciones en pantalla.

---

## 🖥️ 5. Despliegue Manual Paso a Paso (Vía Consola Web de Google Cloud)

Si prefieres usar la interfaz gráfica web de Google Cloud sin scripts:

### Paso 5.1: Crear el Repositorio de Imágenes en Artifact Registry
1. En Google Cloud Console, ve a **Artifact Registry** > **Repositorios** > **Crear repositorio**.
2. Nombre: `fashionstore-repo`
3. Formato: `Docker`
4. Región: `us-central1` (o la que prefieras).
5. Haz clic en **Crear**.

---

### Paso 5.2: Desplegar el Backend en Cloud Run
1. Ve a **Cloud Run** > **Crear servicio**.
2. Selecciona **Continuamente implementar nuevas revisiones desde un repositorio de código fuente** o **Implementar una revisión a partir de una imagen de contenedor existente**.
   - Si vinculas tu GitHub: selecciona la carpeta `backend` y el archivo `backend/Dockerfile`.
3. Nombre del servicio: `fashionstore-backend`.
4. Región: `us-central1`.
5. Autenticación: Marca **Permitir invocaciones no autenticadas** (para que tu frontend pueda consultar la API).
6. En **Contenedor, Redes, Seguridad** (abajo):
   - **Memoria**: `512 MiB` (suficiente y gratis).
   - **CPU**: `1`.
   - **Asignación de CPU**: Selecciona **La CPU solo se asigna durante el procesamiento de la solicitud** (crucial para costo cero).
   - **Instancias mínimas**: `0`.
   - **Instancias máximas**: `2`.
   - **Puerto del contenedor**: `8080`.
7. En la pestaña **Variables y secretos**, agrega:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Tu URI de Supabase con `?sslmode=require`
   - `JWT_ACCESS_SECRET`: Tu clave secreta larga
   - `JWT_REFRESH_SECRET`: Tu clave secreta de refresh
   - `RUN_MIGRATIONS`: `true` (en el primer despliegue)
8. Haz clic en **Crear**. En 1 a 2 minutos tendrás tu URL:
   `https://fashionstore-backend-[hash]-uc.a.run.app`

---

### Paso 5.3: Desplegar el Frontend en Cloud Run
1. Ve a **Cloud Run** > **Crear servicio**.
2. Nombre del servicio: `fashionstore-frontend`.
3. Región: `us-central1`.
4. Autenticación: **Permitir invocaciones no autenticadas**.
5. Si compilas con Docker / Cloud Build, pasa como argumento de compilación:
   `VITE_API_URL=https://fashionstore-backend-[hash]-uc.a.run.app/api/v1`
6. En **Contenedor, Redes, Seguridad**:
   - **Memoria**: `256 MiB`.
   - **Instancias mínimas**: `0`.
   - **Instancias máximas**: `2`.
   - **Puerto**: `8080`.
7. Haz clic en **Crear**.
8. ¡Listo! Recibirás la URL pública de la tienda:
   `https://fashionstore-frontend-[hash]-uc.a.run.app`

---

## 🐳 6. Prueba Local con Docker Compose

Antes de subir a Google Cloud, puedes verificar todo en tu propia computadora:

1. Copia `.env.production.example` a `.env`:
   ```powershell
   Copy-Item .env.production.example .env
   ```
2. Edita `.env` con tu `DATABASE_URL` real de Supabase.
3. Levanta los contenedores con Docker Compose:
   ```bash
   docker compose up --build
   ```
4. Accede en tu navegador a:
   - **Frontend (Tienda & SaaS)**: [http://localhost](http://localhost)
   - **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
   - **Swagger Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
   - **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 🛠️ 7. Migraciones y Seed Inicial de Datos en Supabase

El backend incluye el script `docker-entrypoint.sh` que detecta dos variables:
- `RUN_MIGRATIONS=true`: Ejecuta automáticamente `npx prisma migrate deploy` contra Supabase al iniciar el contenedor.
- `RUN_SEED=true`: Opcional. Si deseas poblar la base de datos Supabase con los datos de prueba (sucursales de La Paz, Cochabamba, Santa Cruz, prendas, tallas, colores, usuarios y promociones), activa `RUN_SEED=true` durante el primer arranque y luego vuelve a colocarlo en `false`.

---

## 🔒 8. Seguridad y Mejores Prácticas

1. **Nunca subas el archivo `.env` a Git**: Ya está protegido en el `.gitignore`.
2. **CORS Configurado**: El backend ya tiene habilitado el origen cruzado para aceptar peticiones tanto de la URL de Cloud Run del frontend como de la app móvil.
3. **Imágenes Multi-Stage**: Los Dockerfiles de ambos servicios compilan en una etapa temporal y solo copian los artefactos estrictamente necesarios a la etapa final, reduciendo la superficie de ataque y el tamaño de almacenamiento.
