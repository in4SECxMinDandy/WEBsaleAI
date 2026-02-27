// ============================================================
// Recommendation Routes — Proxy to ML FastAPI Service
// ============================================================

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { optionalAuth, authenticate } from '../middleware/auth';
import { getCache, setCache } from '../lib/redis';
import { logger } from '../lib/logger';
import { RecommendationLogModel } from '../lib/mongodb';

const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const CACHE_TTL = 3600; // 1 hour

async function fetchFromML(endpoint: string, params: Record<string, unknown> = {}) {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}${endpoint}`, {
      params,
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    logger.warn(`ML service unavailable: ${endpoint}`, error);
    return null;
  }
}

// GET /api/recommendations/for-you
router.get('/for-you', optionalAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id || 'anonymous';
  const { limit = '20', category } = req.query as Record<string, string>;

  const cacheKey = `rec:for-you:${userId}:${category || 'all'}:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const mlResult = await fetchFromML('/recommend', {
    user_id: userId,
    category_id: category,
    limit: parseInt(limit),
    strategy: 'hybrid',
  });

  const result = {
    success: true,
    data: mlResult?.recommendations || [],
    strategy: mlResult?.strategy || 'popular',
    user_id: userId,
  };

  await setCache(cacheKey, result, CACHE_TTL);

  // Log recommendation served
  if (req.user?.id && mlResult?.recommendations?.length) {
    RecommendationLogModel.create({
      user_id: req.user.id,
      strategy: mlResult.strategy,
      context_category_id: category || null,
      recommended_products: mlResult.recommendations.map((r: { product_id: string }) => r.product_id),
      created_at: new Date(),
    }).catch(() => {});
  }

  res.json(result);
});

// GET /api/recommendations/similar/:productId
router.get('/similar/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { limit = '10' } = req.query as Record<string, string>;

  const cacheKey = `rec:similar:${productId}:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const mlResult = await fetchFromML(`/similar/${productId}`, { limit: parseInt(limit) });

  const result = {
    success: true,
    data: mlResult?.similar || [],
    product_id: productId,
  };

  await setCache(cacheKey, result, CACHE_TTL);
  res.json(result);
});

// GET /api/recommendations/trending
router.get('/trending', async (req: Request, res: Response) => {
  const { category, limit = '20' } = req.query as Record<string, string>;

  const cacheKey = `rec:trending:${category || 'all'}:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const mlResult = await fetchFromML('/recommend', {
    user_id: 'anonymous',
    category_id: category,
    limit: parseInt(limit),
    strategy: 'popular',
  });

  const result = {
    success: true,
    data: mlResult?.recommendations || [],
    strategy: 'trending',
  };

  await setCache(cacheKey, result, 1800); // 30 min cache
  res.json(result);
});

// POST /api/recommendations/click — Track recommendation click
router.post('/click', authenticate, async (req: Request, res: Response) => {
  const { productId, strategy, logId } = req.body;

  if (logId) {
    await RecommendationLogModel.findByIdAndUpdate(logId, {
      clicked_product_id: productId,
    });
  }

  // Forward to ML service for real-time learning
  axios.post(`${ML_SERVICE_URL}/events/track`, {
    user_id: req.user!.id,
    session_id: req.body.sessionId,
    product_id: productId,
    event_type: 'click_recommendation',
    event_data: { strategy },
  }).catch(() => {});

  res.json({ success: true });
});

export default router;
