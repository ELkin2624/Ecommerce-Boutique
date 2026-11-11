#!/bin/sh
set -e

echo "=================================================="
echo "🚀 FashionStore Backend - Container Initializing"
echo "=================================================="

# Ejecutar migraciones automáticas en Supabase si se solicita
if [ "$RUN_MIGRATIONS" = "true" ] || [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "📦 Aplicando migraciones de Prisma en la base de datos Supabase..."
  npx prisma migrate deploy || echo "⚠️ Advertencia: Error o base de datos ya actualizada con migraciones."
fi

# Ejecutar semilla masiva inicial si se solicita
if [ "$RUN_SEED" = "true" ] || [ "$RUN_SEED" = "1" ]; then
  echo "🌱 Ejecutando Seed masivo de datos iniciales..."
  if [ -f "prisma/seed.mjs" ]; then
    node prisma/seed.mjs || echo "⚠️ Advertencia durante la ejecución del seed."
  elif [ -f "prisma/seed.ts" ]; then
    npx ts-node prisma/seed.ts || echo "⚠️ Advertencia durante la ejecución del seed."
  fi
fi

echo "✨ Iniciando servidor NestJS en puerto ${PORT:-8080}..."
exec "$@"
