import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getCache, setCache } from '../lib/redis';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  const cached = await getCache('categories:all');
  if (cached) { res.json(cached); return; }

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const result = { success: true, data: categories };
  await setCache('categories:all', result, 3600);
  res.json(result);
});

// GET /api/categories/:slug/products
router.get('/:slug/products', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: category.id, isActive: true },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true, slug: true } },
      },
      orderBy: { purchaseCount: 'desc' },
    }),
    prisma.product.count({ where: { categoryId: category.id, isActive: true } }),
  ]);

  res.json({
    success: true,
    data: products,
    category,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

export default router;
