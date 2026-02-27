import { Request, Response } from 'express';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';
import { getCache, setCache, deleteCachePattern } from '../lib/redis';
import { AppError } from '../middleware/errorHandler';

const CACHE_TTL = 300; // 5 minutes

// GET /api/products
export async function getProducts(req: Request, res: Response): Promise<void> {
  const {
    page = '1', limit = '20', category, brand, search,
    minPrice, maxPrice, sort = 'createdAt', order = 'desc',
    featured,
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = { slug: category };
  if (brand) where.brand = { slug: brand };
  if (featured === 'true') where.isFeatured = true;
  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) (where.basePrice as Record<string, unknown>).gte = parseFloat(minPrice);
    if (maxPrice) (where.basePrice as Record<string, unknown>).lte = parseFloat(maxPrice);
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  const cacheKey = `products:${JSON.stringify({ where, skip, limitNum, sort, order })}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sort]: order },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    success: true,
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };

  await setCache(cacheKey, result, CACHE_TTL);
  res.json(result);
}

// GET /api/products/:slug
export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const cacheKey = `product:${slug}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: 'asc' } },
      attributes: true,
      variants: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!product) throw new AppError(404, 'Product not found');

  // Increment view count (fire and forget)
  prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const result = { success: true, data: product };
  await setCache(cacheKey, result, CACHE_TTL);
  res.json(result);
}

// GET /api/products/:id/reviews
export async function getProductReviews(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: id, isApproved: true },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where: { productId: id, isApproved: true } }),
  ]);

  // Calculate average rating
  const ratingAgg = await prisma.review.aggregate({
    where: { productId: id, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    success: true,
    data: reviews,
    stats: {
      averageRating: ratingAgg._avg.rating || 0,
      totalReviews: ratingAgg._count.rating,
    },
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}

// ─── Admin CRUD ────────────────────────────────────────────

// POST /api/admin/products
export async function createProduct(req: Request, res: Response): Promise<void> {
  const {
    name, description, shortDescription, basePrice, salePrice, costPrice,
    sku, stockQuantity, categoryId, brandId, tags, isFeatured,
    metaTitle, metaDescription, weight, minOrderQuantity,
  } = req.body;

  const slug = slugify(name, { lower: true, strict: true });

  const product = await prisma.product.create({
    data: {
      name, slug, description, shortDescription,
      basePrice, salePrice, costPrice, sku,
      stockQuantity: stockQuantity || 0,
      categoryId, brandId,
      tags: tags || [],
      isFeatured: isFeatured || false,
      metaTitle, metaDescription, weight, minOrderQuantity,
    },
  });

  await deleteCachePattern('products:*');
  res.status(201).json({ success: true, data: product });
}

// PUT /api/admin/products/:id
export async function updateProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.name) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  await deleteCachePattern('products:*');
  await deleteCachePattern(`product:${product.slug}`);
  res.json({ success: true, data: product });
}

// DELETE /api/admin/products/:id
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  await deleteCachePattern('products:*');
  res.json({ success: true, message: 'Product deactivated' });
}
