# Production stage: backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY apps/backend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build TypeScript
COPY apps/backend/src/ ./src/
COPY apps/backend/tsconfig.json ./
RUN npm run build

# --- Dependencies stage: solo lo necesario en runtime -----------------------
# Se instalan aparte (en vez de reutilizar el node_modules del builder) porque
# aquel contiene devDependencies —typescript, eslint, vitest, tsx, drizzle-kit,
# puppeteer…— que no se usan al ejecutar y que engordan la imagen final y su
# superficie de ataque. `npm ci --omit=dev` respeta el lockfile y baja solo las
# dependencias de producción.
FROM node:20-alpine AS deps

WORKDIR /app

COPY apps/backend/package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --legacy-peer-deps; \
    else \
      npm install --omit=dev --legacy-peer-deps; \
    fi \
  && npm cache clean --force

# Production stage: run compiled JS
FROM node:20-alpine AS runner

WORKDIR /app

# Run as an unprivileged user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy built files and production-only dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy env example for reference
COPY --chown=nodejs:nodejs apps/backend/.env.example ./.env.example

# Runtime-writable dirs (winston logs, generated PDFs/exports)
RUN mkdir -p logs reports exports && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3456

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3456/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
