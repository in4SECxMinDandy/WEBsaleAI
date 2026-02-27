#!/bin/bash
# ============================================================
# ML-Ecommerce — Quick Setup Script
# Run: bash scripts/setup.sh
# ============================================================

set -e

echo "🚀 ML-Ecommerce Setup Script"
echo "================================"

# ─── Check prerequisites ──────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install from https://docker.com"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || { echo "❌ Docker Compose is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 20+ is required"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3.11+ is required"; exit 1; }

echo "✅ Prerequisites check passed"

# ─── Copy env files ───────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created root .env from .env.example"
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✅ Created backend/.env"
fi

if [ ! -f ml-service/.env ]; then
  cp ml-service/.env.example ml-service/.env
  echo "✅ Created ml-service/.env"
fi

# ─── Start infrastructure ─────────────────────────────────
echo ""
echo "🐳 Starting Docker services (PostgreSQL, Redis, MongoDB, MLflow)..."
docker-compose up -d postgres redis mongodb mlflow

echo "⏳ Waiting for databases to be ready..."
sleep 15

# ─── Backend setup ────────────────────────────────────────
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🗄️ Running Prisma migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding database..."
npm run seed

cd ..

# ─── ML Service setup ─────────────────────────────────────
echo ""
echo "🐍 Setting up Python virtual environment..."
cd ml-service
python3 -m venv venv
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

cd ..

echo ""
echo "🎉 Setup complete!"
echo "================================"
echo "📌 Services:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo "   MongoDB:    localhost:27017"
echo "   MLflow:     http://localhost:5000"
echo ""
echo "📌 Next steps:"
echo "   1. cd backend && npm run dev"
echo "   2. cd ml-service && uvicorn main:app --reload --port 8001"
echo "   3. cd frontend && npm run dev"
echo ""
echo "   OR run everything with Docker:"
echo "   docker-compose up --build"
