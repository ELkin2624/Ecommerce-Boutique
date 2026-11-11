#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DESPLIEGUE A GOOGLE CLOUD RUN (TIER GRATUITO / COSTO MÍNIMO)
# Compatible con Google Cloud Shell, Linux y macOS.
# ==============================================================================
set -e

echo "=========================================================="
echo "👗 FASHIONSTORE — DESPLIEGUE A GOOGLE CLOUD RUN"
echo "=========================================================="

# Auto-actualizar repositorio si estamos en git
if [ -d ".git" ]; then
    echo "🔄 Sincronizando con los últimos cambios de GitHub..."
    git pull origin main || true
fi

# 1. Verificar gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: 'gcloud' CLI no está instalado o no se encuentra en el PATH."
    echo "💡 Puedes ejecutar este script directamente desde Google Cloud Shell (en tu navegador) donde gcloud ya viene instalado gratis."
    exit 1
fi

# 2. Proyecto GCP
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
read -p "Ingresa tu Google Cloud Project ID [$CURRENT_PROJECT]: " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-$CURRENT_PROJECT}

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Debes especificar un Project ID de Google Cloud."
    exit 1
fi

gcloud config set project "$PROJECT_ID"

# 3. Región (us-central1 es la más recomendada para el Free Tier)
REGION=${GCP_REGION:-"us-central1"}
echo "📍 Usando región: $REGION (óptima para Tier Gratuito)"

# 4. Habilitar servicios necesarios en GCP
echo "🔧 Habilitando APIs requeridas en Google Cloud..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com

# 5. Configurar Repositorio en Artifact Registry
REPO_NAME="fashionstore-repo"
echo "📦 Configurando repositorio Docker en Artifact Registry: $REPO_NAME..."
gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null || \
gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Repositorio Docker para FashionStore"

REPO_BASE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME"

# 6. Datos de conexión Supabase
echo ""
echo "🔌 CONFIGURACIÓN DE BASE DE DATOS (SUPABASE):"
read -p "Pega tu DATABASE_URL de Supabase: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL es obligatoria para conectar con Supabase."
    exit 1
fi

# Auto-agregar sslmode=require si no está presente
if [[ "$DATABASE_URL" != *"sslmode="* ]]; then
    if [[ "$DATABASE_URL" == *"?"* ]]; then
        DATABASE_URL="${DATABASE_URL}&sslmode=require"
    else
        DATABASE_URL="${DATABASE_URL}?sslmode=require"
    fi
    echo "🔒 Agregado sslmode=require automáticamente para Supabase."
fi

# Secretos JWT
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo "secret_access_jwt_$(date +%s)")}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo "secret_refresh_jwt_$(date +%s)")}

echo ""
echo "🚀 [1/3] Compilando y subiendo Backend a Google Cloud Build..."
gcloud builds submit --tag "$REPO_BASE/fashionstore-backend:latest" ./backend

echo ""
echo "🚀 [2/3] Desplegando Backend en Google Cloud Run (Configurado para $0.00 / Free Tier)..."
gcloud run deploy fashionstore-backend \
    --image "$REPO_BASE/fashionstore-backend:latest" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 2 \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 80 \
    --set-env-vars "NODE_ENV=production,DATABASE_URL=$DATABASE_URL,JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET,RUN_MIGRATIONS=true"

# Obtener URL del Backend
BACKEND_URL=$(gcloud run services describe fashionstore-backend --platform managed --region "$REGION" --format 'value(status.url)')
echo "✅ Backend desplegado exitosamente en: $BACKEND_URL"

echo ""
echo "🚀 [3/3] Compilando Frontend con API URL: $BACKEND_URL/api/v1..."
gcloud builds submit \
    --config=frontend/cloudbuild.yaml \
    --substitutions=_VITE_API_URL="$BACKEND_URL/api/v1",_IMAGE_NAME="$REPO_BASE/fashionstore-frontend:latest" \
    ./frontend

echo ""
echo "🚀 Desplegando Frontend en Google Cloud Run..."
gcloud run deploy fashionstore-frontend \
    --image "$REPO_BASE/fashionstore-frontend:latest" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 2 \
    --memory 256Mi \
    --cpu 1 \
    --concurrency 80

FRONTEND_URL=$(gcloud run services describe fashionstore-frontend --platform managed --region "$REGION" --format 'value(status.url)')

echo ""
echo "=========================================================="
echo "🎉 ¡DESPLIEGUE COMPLETADO CON ÉXITO!"
echo "=========================================================="
echo "🌐 Tienda Web & SaaS (Frontend): $FRONTEND_URL"
echo "⚙️ Backend API:                 $BACKEND_URL/api/v1"
echo "📚 Documentación Swagger:       $BACKEND_URL/api/docs"
echo "🩺 Health Check:                $BACKEND_URL/health"
echo "💾 Base de Datos:               Supabase (PostgreSQL)"
echo ""
echo "💡 NOTA DE COSTOS:"
echo "Ambos servicios tienen '--min-instances 0', lo que significa que escalan"
echo "a cero cuando no hay tráfico. Mientras estés dentro de los 2 millones de"
echo "peticiones mensuales de la capa gratuita de Cloud Run, el costo será de $0.00."
echo "=========================================================="
