import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/users/me/wishlist
router.get('/me/wishlist', authenticate, async (req: Request, res: Response) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
    orderBy: { addedAt: 'desc' },
  });
  res.json({ success: true, data: wishlist });
});

// POST /api/users/me/wishlist
router.post('/me/wishlist', authenticate, async (req: Request, res: Response) => {
  const { productId } = req.body;
  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId: req.user!.id, productId } },
    update: {},
    create: { userId: req.user!.id, productId },
  });
  res.json({ success: true, data: item });
});

// DELETE /api/users/me/wishlist/:productId
router.delete('/me/wishlist/:productId', authenticate, async (req: Request, res: Response) => {
  await prisma.wishlist.deleteMany({
    where: { userId: req.user!.id, productId: req.params.productId },
  });
  res.json({ success: true, message: 'Removed from wishlist' });
});

// GET /api/users/me/notifications
router.get('/me/notifications', authenticate, async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ success: true, data: notifications });
});

// PUT /api/users/me/notifications/read-all
router.put('/me/notifications/read-all', authenticate, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});

export default router;
