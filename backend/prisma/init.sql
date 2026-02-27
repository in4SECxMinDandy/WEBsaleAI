-- ============================================================
-- PostgreSQL Init Script — ML-Ecommerce
-- Runs automatically when container starts for the first time
-- ============================================================

-- Create MLflow database (separate from main ecommerce DB)
CREATE DATABASE mlflow;

-- Enable UUID extension
\c ecommerce;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────
-- Seed: Default Admin User
-- Password: Admin@123456 (bcrypt hashed)
-- ─────────────────────────────────────────
-- NOTE: Prisma migrations will create the tables.
-- This script only sets up extensions and the mlflow DB.
-- Run: npx prisma migrate dev --name init
-- Then: npx prisma db seed
