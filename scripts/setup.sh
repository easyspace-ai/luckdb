#!/bin/bash

echo "🚀 Setting up LuckDB development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version)"

# Check Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go >= 1.21"
    exit 1
fi
echo "✅ Go $(go version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Please install Docker for database services."
else
    echo "✅ Docker $(docker --version)"
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
pnpm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
go mod download
cd ..

# Start database services
echo ""
echo "🐳 Starting database services..."
docker-compose -f docker/docker-compose.dev.yml up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Run migrations
echo ""
echo "🔄 Running database migrations..."
cd server
make migrate || echo "⚠️  Migration failed. You may need to run it manually."
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  pnpm dev:all    # Start both frontend and backend"
echo "  pnpm dev:web    # Start frontend only"
echo "  pnpm dev:server # Start backend only"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8080"
echo "  API Docs: http://localhost:8080/docs"

