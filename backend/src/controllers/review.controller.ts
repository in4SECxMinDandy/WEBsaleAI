import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

// GET /api/products/:id/reviews
export async function getProductReviews(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: id, isApproved: true },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId: id, isApproved: true } }),
  ]);

  // Calculate average rating
  const ratingAgg = await prisma.review.aggregate({
    where: { productId: id, isApproved: true, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    success: true,
    data: reviews,
    meta: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
      ratingCount: ratingAgg._count.rating,
    },
  });
}

// POST /api/products/:id/reviews
export async function createReview(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id: productId } = req.params;
  const { rating, title, content, orderId } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError(400, 'Rating must be between 1 and 5');
  }

  // Check if user already reviewed this product
  const existing = await prisma.review.findFirst({
    where: { userId, productId },
  });
  if (existing) throw new AppError(409, 'You have already reviewed this product');

  // Check if verified purchase
  let isVerifiedPurchase = false;
  if (orderId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        productId,
        order: { userId, status: 'delivered' },
      },
    });
    isVerifiedPurchase = !!orderItem;
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId,
      orderId,
      rating,
      title,
      content,
      isVerifiedPurchase,
      isApproved: true, // Auto-approve; can be changed to require moderation
    },
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  res.status(201).json({ success: true, data: review });
}

// PUT /api/reviews/:id/helpful
export async function markHelpful(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const review = await prisma.review.update({
    where: { id },
    data: { helpfulCount: { increment: 1 } },
  });

  res.json({ success: true, data: { helpfulCount: review.helpfulCount } });
}
