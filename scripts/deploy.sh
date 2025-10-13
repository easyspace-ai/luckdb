#!/bin/bash

set -e

echo "🚀 Deploying LuckDB..."

# Build
echo "🔨 Building..."
./scripts/build.sh

# Build Docker images
echo ""
echo "🐳 Building Docker images..."
docker-compose -f docker/docker-compose.yml build

# Deploy
echo ""
echo "📦 Deploying services..."
docker-compose -f docker/docker-compose.yml up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services:"
echo "  Web: http://localhost:3000"
echo "  API: http://localhost:8080"
echo ""
echo "Check status: docker-compose -f docker/docker-compose.yml ps"
echo "View logs: docker-compose -f docker/docker-compose.yml logs -f"

