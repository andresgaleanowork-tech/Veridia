# ============================================================
# Veridia HealthTech Frontend — Production Dockerfile
# Multi-stage build: builder (Node) → runner (Nginx)
# ============================================================

# --- Build stage ------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Production serving stage ------------------------------------------------
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Install curl for HEALTHCHECK probes
RUN apk add --no-cache curl

# Copy built static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port Nginx listens on
EXPOSE 5173

# Health check: verify Nginx serves the index page
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -sf http://localhost:5173/health > /dev/null || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]