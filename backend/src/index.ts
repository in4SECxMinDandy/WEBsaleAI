// ============================================================
// ML-Ecommerce Backend — Entry Point
// Node.js 20 + Express + Prisma + Redis + MongoDB
// ============================================================

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { prisma } from './lib/prisma';
import { redisClient } from './lib/redis';
import { connectMongoDB } from './lib/mongodb';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import brandRoutes from './routes/brand.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import eventRoutes from './routes/event.routes';
import recommendationRoutes from './routes/recommendation.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security Middleware ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General Middleware ────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Rate Limiting ─────────────────────────────────────────
app.use('/api/auth', rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 200 }));

// ─── Health Check ──────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'error');
  const redisStatus = await redisClient.ping().then(() => 'ok').catch(() => 'error');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: { database: dbStatus, redis: redisStatus },
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');

    await connectMongoDB();
    logger.info('✅ MongoDB connected');

    await redisClient.ping();
    logger.info('✅ Redis connected');

    app.listen(PORT, () => {
      logger.info(`🚀 Backend running on http://localhost:${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// ─── Graceful Shutdown ─────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});
