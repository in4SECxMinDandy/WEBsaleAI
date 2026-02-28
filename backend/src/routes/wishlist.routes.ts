import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlist.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);

export default router;
