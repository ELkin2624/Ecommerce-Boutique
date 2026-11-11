# ==============================================================================
# FASHIONSTORE BACKEND - MULTI-STAGE DOCKERFILE FOR GOOGLE CLOUD RUN
# Optimizado para arranque ultra-rápido, bajo consumo de RAM y Free Tier de GCP.
# ==============================================================================

# -------------------------------------------------------------
# Stage 1: Build stage
# -------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias del sistema requeridas para Prisma y módulos nativos
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar manifiestos de dependencias y configuración de builds pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./

# Instalar dependencias (incluyendo devDependencies para compilar)
RUN pnpm install --frozen-lockfile || pnpm install

# Copiar archivos de configuración y Prisma
COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma/

# Generar cliente de Prisma
RUN pnpm exec prisma generate

# Copiar código fuente
COPY src ./src/

# Compilar NestJS a JavaScript en /dist
RUN pnpm run build

# Limpiar dependencias de desarrollo para aligerar la imagen
RUN pnpm prune --prod

# Regenerar cliente Prisma para asegurar que quede en el node_modules final
RUN pnpm exec prisma generate

# -------------------------------------------------------------
# Stage 2: Production runner stage
# -------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Prisma Query Engine en Debian necesita openssl y certificados CA
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Usuario no privilegiado para cumplimiento de seguridad en Google Cloud
RUN groupadd -r nestjs && useradd -r -g nestjs -m nestjs

# Copiar artefactos de compilación
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Carpeta de subida de imágenes y permisos de usuario
RUN mkdir -p /app/uploads && chown -R nestjs:nestjs /app

# Copiar y normalizar script de inicio (remover retornos CRLF de Windows si existen)
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

USER nestjs

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
