import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';
import * as productController from '../controllers/product.controller';
import { createReview, markHelpful } from '../controllers/review.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/products
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
  ],
  validate,
  productController.getProducts
);

// GET /api/products/:slug
router.get('/:slug', optionalAuth, productController.getProductBySlug);

// GET /api/products/:id/reviews
router.get('/:id/reviews', productController.getProductReviews);

// POST /api/products/:id/reviews
router.post('/:id/reviews', authenticate, createReview);

// PUT /api/reviews/:id/helpful
router.put('/reviews/:id/helpful', markHelpful);

export default router;
