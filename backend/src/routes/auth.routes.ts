import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh-token
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty()],
  validate,
  authController.refreshToken
);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/me
router.put(
  '/me',
  authenticate,
  [
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
    body('phone').optional().isMobilePhone('any'),
  ],
  validate,
  authController.updateMe
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
);

export default router;
