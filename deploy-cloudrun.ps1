# ==============================================================================
# SCRIPT DE DESPLIEGUE A GOOGLE CLOUD RUN (POWERSHELL / WINDOWS)
# Optimizado para capa gratuita de Google Cloud (Free Tier) y mínimo costo
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "👗 FASHIONSTORE — DESPLIEGUE A GOOGLE CLOUD RUN (DOCKER)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar si gcloud CLI está disponible
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: 'gcloud' no se encuentra instalado en este equipo o no está en el PATH." -ForegroundColor Red
    Write-Host "💡 Alternativas fáciles:" -ForegroundColor Yellow
    Write-Host "   1. Usa 'Google Cloud Shell' (un terminal gratuito con gcloud ya instalado en tu navegador)." -ForegroundColor White
    Write-Host "   2. O instala Google Cloud SDK en Windows: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "   3. O consulta 'docs/GOOGLE_CLOUD_DEPLOYMENT.md' para desplegar desde la consola web sin comandos." -ForegroundColor White
    exit 1
}

# 2. Proyecto GCP
$currentProject = (gcloud config get-value project 2>$null)
$projectId = Read-Host "Ingresa tu Google Cloud Project ID [$currentProject]"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    $projectId = $currentProject
}
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "❌ Error: Debes ingresar un Project ID." -ForegroundColor Red
    exit 1
}
gcloud config set project $projectId

# 3. Región
$region = "us-central1"
Write-Host "📍 Región: $region (seleccionada por su óptimo soporte para Free Tier)" -ForegroundColor Green

# 4. Habilitar APIs de GCP
Write-Host "🔧 Habilitando APIs de Cloud Run, Cloud Build y Artifact Registry..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 5. Configurar Repositorio en Artifact Registry
$repoName = "fashionstore-repo"
Write-Host "📦 Configurando repositorio en Artifact Registry..." -ForegroundColor Yellow
try {
    gcloud artifacts repositories describe $repoName --location=$region 2>$null
} catch {
    gcloud artifacts repositories create $repoName --repository-format=docker --location=$region --description="Repositorio Docker para FashionStore"
}
$repoBase = "$region-docker.pkg.dev/$projectId/$repoName"

# 6. Parámetros de Supabase
Write-Host ""
Write-Host "🔌 CONEXIÓN A SUPABASE:" -ForegroundColor Cyan
$databaseUrl = Read-Host "Pega tu DATABASE_URL de Supabase"
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "❌ Error: DATABASE_URL es obligatoria para conectar la base de datos." -ForegroundColor Red
    exit 1
}

$jwtAccessSecret = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")
$jwtRefreshSecret = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")

# 7. Compilar y Desplegar Backend
Write-Host ""
Write-Host "🚀 [1/3] Compilando Backend con Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag "$repoBase/fashionstore-backend:latest" ./backend

Write-Host "🚀 [2/3] Desplegando Backend en Cloud Run con 'min-instances 0'..." -ForegroundColor Yellow
gcloud run deploy fashionstore-backend `
    --image "$repoBase/fashionstore-backend:latest" `
    --platform managed `
    --region "$region" `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 2 `
    --memory 512Mi `
    --cpu 1 `
    --concurrency 80 `
    --set-env-vars "NODE_ENV=production,DATABASE_URL=$databaseUrl,JWT_ACCESS_SECRET=$jwtAccessSecret,JWT_REFRESH_SECRET=$jwtRefreshSecret,RUN_MIGRATIONS=true"

$backendUrl = (gcloud run services describe fashionstore-backend --platform managed --region "$region" --format 'value(status.url)').Trim()
Write-Host "✅ Backend activo en: $backendUrl" -ForegroundColor Green

# 8. Compilar y Desplegar Frontend
Write-Host ""
Write-Host "🚀 [3/3] Compilando Frontend conectando a $backendUrl/api/v1..." -ForegroundColor Yellow
gcloud builds submit `
    --config=frontend/cloudbuild.yaml `
    --substitutions=_VITE_API_URL="$backendUrl/api/v1",_IMAGE_NAME="$repoBase/fashionstore-frontend:latest" `
    ./frontend

Write-Host "🚀 Desplegando Frontend en Cloud Run..." -ForegroundColor Yellow
gcloud run deploy fashionstore-frontend `
    --image "$repoBase/fashionstore-frontend:latest" `
    --platform managed `
    --region "$region" `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 2 `
    --memory 256Mi `
    --cpu 1 `
    --concurrency 80

$frontendUrl = (gcloud run services describe fashionstore-frontend --platform managed --region "$region" --format 'value(status.url)').Trim()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 ¡DESPLIEGUE FINALIZADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🌐 Tienda Web & SaaS (Frontend): $frontendUrl" -ForegroundColor White
Write-Host "⚙️ Backend API:                 $backendUrl/api/v1" -ForegroundColor White
Write-Host "📚 Documentación Swagger:       $backendUrl/api/docs" -ForegroundColor White
Write-Host "🩺 Health Check:                $backendUrl/health" -ForegroundColor White
Write-Host "💾 Base de Datos:               Supabase (PostgreSQL)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Configurado con escala a 0: Si nadie entra, consume $0.00." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
