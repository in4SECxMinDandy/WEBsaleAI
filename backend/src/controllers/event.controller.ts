// ============================================================
// Event Tracking Controller
// Captures user behavior events → MongoDB → ML training data
// ============================================================

import { Request, Response } from 'express';
import { UserEventModel } from '../lib/mongodb';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

// POST /api/events/track
export async function trackEvent(req: Request, res: Response): Promise<void> {
  const {
    sessionId, productId, categoryId,
    eventType, eventData,
  } = req.body;

  const userId = req.user?.id || null;
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
  const userAgent = req.headers['user-agent'];
  const referrer = req.headers.referer;

  // Save to MongoDB (async, non-blocking)
  const mongoEvent = new UserEventModel({
    user_id: userId,
    session_id: sessionId,
    product_id: productId,
    category_id: categoryId,
    event_type: eventType,
    event_data: eventData || {},
    ip_address: ipAddress,
    user_agent: userAgent,
    referrer: referrer,
    created_at: new Date(),
  });

  // Fire and forget — don't block the response
  mongoEvent.save().catch((err: Error) => logger.error('MongoDB event save error:', err));

  // Also save to PostgreSQL for ML model training (important events only)
  const importantEvents = ['purchase', 'add_to_cart', 'review', 'click_recommendation'];
  if (userId && importantEvents.includes(eventType)) {
    prisma.userEvent.create({
      data: {
        userId,
        sessionId,
        productId: productId || null,
        categoryId: categoryId || null,
        eventType,
        eventData: eventData || {},
        ipAddress,
        userAgent,
        referrer,
      },
    }).catch((err: Error) => logger.error('PostgreSQL event save error:', err));
  }

  // Update product view/purchase counts
  if (productId) {
    if (eventType === 'product_view') {
      prisma.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    } else if (eventType === 'purchase') {
      prisma.product.update({
        where: { id: productId },
        data: { purchaseCount: { increment: 1 } },
      }).catch(() => {});
    }
  }

  res.json({ success: true, message: 'Event tracked' });
}

// GET /api/events/user/:userId — Admin only
export async function getUserEvents(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const { limit = '50', eventType } = req.query as Record<string, string>;

  const query: Record<string, unknown> = { user_id: userId };
  if (eventType) query.event_type = eventType;

  const events = await UserEventModel
    .find(query)
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json({ success: true, data: events });
}

// GET /api/events/stats — Admin only
export async function getEventStats(req: Request, res: Response): Promise<void> {
  const { days = '7' } = req.query as Record<string, string>;
  const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const stats = await UserEventModel.aggregate([
    { $match: { created_at: { $gte: since } } },
    {
      $group: {
        _id: '$event_type',
        count: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
      },
    },
    {
      $project: {
        event_type: '$_id',
        count: 1,
        unique_users: { $size: '$unique_users' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: stats });
}
