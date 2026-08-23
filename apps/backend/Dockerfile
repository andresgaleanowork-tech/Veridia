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

# Production stage: run compiled JS
FROM node:20-alpine AS runner

WORKDIR /app

# Run as an unprivileged user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy built files and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
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
