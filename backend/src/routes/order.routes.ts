import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /api/orders — Create order from cart
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { shippingAddress, paymentMethod, couponCode, notes } = req.body;

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      cartItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.cartItems.length === 0) {
    throw new AppError(400, 'Cart is empty');
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems = cart.cartItems.map((item) => {
    const price = Number(item.variant?.price || item.product?.salePrice || item.product?.basePrice || 0);
    const totalPrice = price * item.quantity;
    subtotal += totalPrice;
    return {
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product?.name || '',
      productImage: '',
      quantity: item.quantity,
      unitPrice: price,
      totalPrice,
    };
  });

  const shippingFee = subtotal >= 500000 ? 0 : 30000; // Free shipping over 500k VND
  const totalAmount = subtotal + shippingFee;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      orderNumber,
      shippingAddress,
      paymentMethod,
      couponCode,
      notes,
      subtotal,
      shippingFee,
      totalAmount,
      orderItems: { create: orderItems },
    },
    include: { orderItems: true },
  });

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  res.status(201).json({ success: true, data: order });
});

// GET /api/orders — User's order history
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user!.id },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
        },
      },
    }),
    prisma.order.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { orderItems: { include: { product: true, variant: true } } },
  });

  if (!order) throw new AppError(404, 'Order not found');
  res.json({ success: true, data: order });
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!order) throw new AppError(404, 'Order not found');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(400, 'Order cannot be cancelled at this stage');
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled' },
  });

  res.json({ success: true, message: 'Order cancelled' });
});

export default router;
