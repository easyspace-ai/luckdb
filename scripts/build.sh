#!/bin/bash

set -e

echo "🔨 Building LuckDB..."

# Build frontend packages
echo ""
echo "📦 Building frontend packages..."
pnpm build

# Build backend
echo ""
echo "📦 Building backend..."
cd server
make build
cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "Output:"
echo "  Frontend: apps/web/.next/"
echo "  Backend: server/bin/luckdb"

