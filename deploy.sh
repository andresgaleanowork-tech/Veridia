#!/bin/bash

# Veridia Production Deployment Script

echo ":rocket: Veridia HealthTech - Production Deployment"
echo "=============================================="

# Load production env
export $(cat .env.production | xargs)

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# Build images
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "▶️  Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for DB
echo ":hourglass_flowing_sand: Waiting for database..."
sleep 10

# Run migrations inside the API container
echo ":arrows_counterclockwise: Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T api npm run migrate

# Run seed inside the API container
echo ":seedling: Seeding initial data..."
docker compose -f docker-compose.prod.yml exec -T api npm run seed

# Health check
echo ":white_check_mark: Checking health..."
sleep 3

API_HEALTH=$(curl -s http://localhost:3457/api/health | jq -r '.ok')
if [ "$API_HEALTH" = "true" ]; then
  echo ":white_check_mark: API is healthy"
else
  echo ":x: API health check failed"
  exit 1
fi

echo ""
echo ":white_check_mark: Deployment Complete!"
echo "=============================================="
echo "📍 Frontend:  http://localhost:5173"
echo "📍 API:       http://localhost:3457/api/health"
echo "📍 Database:  localhost:5444"
echo ""
echo "🔐 Credentials:"
echo "   Email:    admin@veridia.tech"
echo "   Password: Admin2026!"
echo ""
echo "To stop: docker compose -f docker-compose.prod.yml down"
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
