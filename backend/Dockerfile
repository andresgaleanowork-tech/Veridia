# Production stage: backend + static frontend
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --production

COPY backend/src/ ./src/
COPY backend/.env.example ./.env.example

EXPOSE 3456

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3456/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

CMD ["node", "src/index.js"]
