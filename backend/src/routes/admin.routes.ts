// ============================================================
// Admin Routes — Full CRUD + ML Control Panel
// ============================================================

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import * as productController from '../controllers/product.controller';

const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin', 'superadmin'));

// ─── Dashboard ────────────────────────────────────────────

router.get('/dashboard/stats', async (_req: Request, res: Response) => {
  const [totalUsers, totalProducts, totalOrders, revenueResult] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: 'paid' },
      _sum: { totalAmount: true },
    }),
  ]);

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayOrders, todayRevenue] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: 'paid' },
      _sum: { totalAmount: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      todayOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
    },
  });
});

router.get('/dashboard/top-products', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { purchaseCount: 'desc' },
    take: 10,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true } },
    },
  });
  res.json({ success: true, data: products });
});

router.get('/dashboard/recent-orders', async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { fullName: true, email: true } },
      orderItems: { take: 1 },
    },
  });
  res.json({ success: true, data: orders });
});

// ─── Products ─────────────────────────────────────────────

router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// ─── Categories ───────────────────────────────────────────

router.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: categories });
});

router.post('/categories', async (req: Request, res: Response) => {
  const { name, parentId, description, imageUrl, sortOrder } = req.body;
  const slugify = (await import('slugify')).default;
  const slug = slugify(name, { lower: true, strict: true });
  const category = await prisma.category.create({
    data: { name, slug, parentId, description, imageUrl, sortOrder },
  });
  res.status(201).json({ success: true, data: category });
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: category });
});

// ─── Orders ───────────────────────────────────────────────

router.get('/orders', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
        orderItems: { include: { product: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.put('/orders/:id/status', async (req: Request, res: Response) => {
  const { status, trackingNumber } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status,
      trackingNumber,
      shippedAt: status === 'shipped' ? new Date() : undefined,
      deliveredAt: status === 'delivered' ? new Date() : undefined,
    },
  });
  res.json({ success: true, data: order });
});

// ─── Users ────────────────────────────────────────────────

router.get('/users', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, isActive: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// ─── Reviews ──────────────────────────────────────────────

router.get('/reviews', async (req: Request, res: Response) => {
  const { status = 'pending' } = req.query as Record<string, string>;
  const reviews = await prisma.review.findMany({
    where: { isApproved: status === 'approved' },
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: reviews });
});

router.put('/reviews/:id/approve', async (req: Request, res: Response) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { isApproved: true } });
  res.json({ success: true });
});

// ─── ML Control Panel ─────────────────────────────────────

router.get('/ml/models', async (_req: Request, res: Response) => {
  const models = await prisma.mlModel.findMany({ orderBy: { trainedAt: 'desc' } });
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/admin/models`, { timeout: 3000 });
    res.json({ success: true, data: { dbModels: models, mlflowModels: mlResponse.data.models } });
  } catch {
    res.json({ success: true, data: { dbModels: models, mlflowModels: [] } });
  }
});

router.post('/ml/retrain', async (_req: Request, res: Response) => {
  try {
    await axios.post(`${ML_SERVICE_URL}/admin/retrain`, {}, { timeout: 5000 });
    res.json({ success: true, message: 'Training started' });
  } catch {
    res.status(503).json({ success: false, message: 'ML service unavailable' });
  }
});

router.get('/ml/metrics', async (_req: Request, res: Response) => {
  const latestModel = await prisma.mlModel.findFirst({
    where: { isProduction: true },
    orderBy: { trainedAt: 'desc' },
  });
  res.json({ success: true, data: latestModel?.metrics || {} });
});

router.get('/ml/recommendation-logs', async (req: Request, res: Response) => {
  const { days = '7' } = req.query as Record<string, string>;
  const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const logs = await prisma.recommendationLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const ctr = logs.length > 0
    ? (logs.filter((l) => l.clickedProductId).length / logs.length * 100).toFixed(2)
    : '0';

  res.json({ success: true, data: { logs, ctr: parseFloat(ctr), total: logs.length } });
});

export default router;
