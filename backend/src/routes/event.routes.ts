import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import * as eventController from '../controllers/event.controller';

const router = Router();

// POST /api/events/track — Public (with optional auth)
router.post(
  '/track',
  optionalAuth,
  [
    body('eventType').isIn([
      'page_view', 'product_view', 'search',
      'add_to_cart', 'remove_from_cart', 'wishlist',
      'purchase', 'review', 'click_recommendation',
    ]),
    body('sessionId').notEmpty(),
  ],
  validate,
  eventController.trackEvent
);

// GET /api/events/user/:userId — Admin only
router.get(
  '/user/:userId',
  authenticate,
  authorize('admin', 'superadmin'),
  eventController.getUserEvents
);

// GET /api/events/stats — Admin only
router.get(
  '/stats',
  authenticate,
  authorize('admin', 'superadmin'),
  eventController.getEventStats
);

export default router;
