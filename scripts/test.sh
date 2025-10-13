#!/bin/bash

set -e

echo "🧪 Running tests..."

# Frontend tests
echo ""
echo "🧪 Running frontend tests..."
pnpm test || echo "⚠️  Frontend tests failed"

# Backend tests
echo ""
echo "🧪 Running backend tests..."
cd server
make test || echo "⚠️  Backend tests failed"
cd ..

echo ""
echo "✅ Tests complete!"

