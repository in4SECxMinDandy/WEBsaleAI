import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/cart
router.get('/', authenticate, async (req: Request, res: Response) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      cartItems: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    res.json({ success: true, data: { cartItems: [], total: 0 } });
    return;
  }

  const total = cart.cartItems.reduce((sum, item) => {
    const price = Number(item.variant?.price || item.product?.salePrice || item.product?.basePrice || 0);
    return sum + price * item.quantity;
  }, 0);

  res.json({ success: true, data: { ...cart, total } });
});

// POST /api/cart/items
router.post('/items', authenticate, async (req: Request, res: Response) => {
  const { productId, variantId, quantity = 1 } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new AppError(404, 'Product not found');
  if (product.stockQuantity < quantity) throw new AppError(400, 'Insufficient stock');

  let cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user!.id } });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId || null },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId: variantId || null, quantity },
    });
  }

  res.json({ success: true, message: 'Item added to cart' });
});

// PUT /api/cart/items/:id
router.put('/items/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id } });
    res.json({ success: true, message: 'Item removed' });
    return;
  }

  await prisma.cartItem.update({ where: { id }, data: { quantity } });
  res.json({ success: true, message: 'Cart updated' });
});

// DELETE /api/cart/items/:id
router.delete('/items/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.cartItem.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Item removed' });
});

// DELETE /api/cart
router.delete('/', authenticate, async (req: Request, res: Response) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  res.json({ success: true, message: 'Cart cleared' });
});

export default router;
