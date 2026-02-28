import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/flash-sales/active
router.get('/active', async (_req, res) => {
  const now = new Date();
  const flashSale = await prisma.flashSale.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              category: { select: { name: true, slug: true } },
              brand: { select: { name: true } },
              _count: { select: { reviews: true } },
            },
          },
        },
      },
    },
  });

  res.json({ success: true, data: flashSale });
});

// GET /api/flash-sales
router.get('/', async (_req, res) => {
  const flashSales = await prisma.flashSale.findMany({
    where: { isActive: true },
    orderBy: { startsAt: 'desc' },
    take: 10,
  });
  res.json({ success: true, data: flashSales });
});

export default router;
