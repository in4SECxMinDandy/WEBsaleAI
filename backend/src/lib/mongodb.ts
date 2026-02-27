import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_events';
  await mongoose.connect(uri);
  logger.info('✅ MongoDB connected');
}

// ─── User Event Schema (for event tracking) ───────────────

const userEventSchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true },
    session_id: { type: String, index: true },
    product_id: { type: String, index: true },
    category_id: { type: String },
    event_type: {
      type: String,
      enum: [
        'page_view', 'product_view', 'search',
        'add_to_cart', 'remove_from_cart', 'wishlist',
        'purchase', 'review', 'click_recommendation',
      ],
      required: true,
    },
    event_data: { type: mongoose.Schema.Types.Mixed },
    ip_address: { type: String },
    user_agent: { type: String },
    referrer: { type: String },
    created_at: { type: Date, default: Date.now, expires: 15552000 }, // 180 days TTL
  },
  { timestamps: false, collection: 'user_events' }
);

userEventSchema.index({ user_id: 1, created_at: -1 });
userEventSchema.index({ product_id: 1, event_type: 1 });
userEventSchema.index({ event_type: 1, created_at: -1 });

export const UserEventModel = mongoose.model('UserEvent', userEventSchema);

// ─── Recommendation Log Schema ─────────────────────────────

const recommendationLogSchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true },
    strategy: { type: String },
    context_category_id: { type: String },
    recommended_products: [{ type: String }],
    clicked_product_id: { type: String },
    converted: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: 'recommendation_logs' }
);

export const RecommendationLogModel = mongoose.model('RecommendationLog', recommendationLogSchema);
