# ==============================================================================
# FASHIONSTORE FRONTEND - MULTI-STAGE DOCKERFILE FOR GOOGLE CLOUD RUN
# Nginx Alpine optimizado para SPA React PWA, compresión Gzip y Free Tier.
# ==============================================================================

# -------------------------------------------------------------
# Stage 1: Build stage
# -------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Argumentos de compilación para variables de entorno del cliente Vite
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51QQeCZDh9sPACDW2wkTfnWJiJdQi5zBdRxKoSoEOdWRjJg0TvIhiMEZ4f6ZlFfA2aGkZkz7rM4m2Vy0SFHpvTl00Fm8ORZim
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Copiar manifiestos de dependencias y configuración pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile || pnpm install

# Copiar archivos de configuración y código fuente
COPY tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js eslint.config.js index.html ./
COPY public ./public/
COPY src ./src/

# Compilar React SPA a la carpeta /dist
RUN pnpm run build

# -------------------------------------------------------------
# Stage 2: Production Nginx stage
# -------------------------------------------------------------
FROM nginx:alpine AS runner

# Cloud Run inyecta dinámicamente la variable PORT (por defecto 8080)
ENV PORT=8080

# Limpiar configuración por defecto
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copiar plantilla que Nginx procesa automáticamente con envsubst al arrancar
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copiar assets estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
