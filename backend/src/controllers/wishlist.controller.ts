import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

// GET /api/wishlist
export async function getWishlist(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  const items = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          stockQuantity: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  res.json({ success: true, data: items });
}

// POST /api/wishlist/:productId
export async function addToWishlist(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    res.json({ success: true, message: 'Already in wishlist', data: existing });
    return;
  }

  const item = await prisma.wishlist.create({
    data: { userId, productId },
  });

  res.status(201).json({ success: true, data: item });
}

// DELETE /api/wishlist/:productId
export async function removeFromWishlist(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { productId } = req.params;

  await prisma.wishlist.deleteMany({
    where: { userId, productId },
  });

  res.json({ success: true, message: 'Removed from wishlist' });
}

// GET /api/wishlist/check/:productId
export async function checkWishlist(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { productId } = req.params;

  const item = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  res.json({ success: true, data: { isWishlisted: !!item } });
}
