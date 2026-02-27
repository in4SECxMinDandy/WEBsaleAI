import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getCache, setCache } from '../lib/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const cached = await getCache('brands:all');
  if (cached) { res.json(cached); return; }

  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const result = { success: true, data: brands };
  await setCache('brands:all', result, 3600);
  res.json(result);
});

export default router;
