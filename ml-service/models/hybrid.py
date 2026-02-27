# ============================================================
# Hybrid Recommendation Engine
# CF (ALS) + CB (TF-IDF) + Cold Start Fallback
# ============================================================

import redis
import json
from typing import Optional
from loguru import logger

from .content_based import ContentBasedModel
from .collaborative import CollaborativeModel


class HybridEngine:
    def __init__(
        self,
        cf_model: CollaborativeModel,
        cb_model: ContentBasedModel,
        redis_client: redis.Redis,
        cf_weight: float = 0.6,
        cb_weight: float = 0.4,
        cache_ttl: int = 3600,
    ):
        self.cf = cf_model
        self.cb = cb_model
        self.redis = redis_client
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.cache_ttl = cache_ttl

    def _cache_key(self, user_id: str, category_id: Optional[str], strategy: str) -> str:
        return f"rec:{strategy}:{user_id}:{category_id or 'all'}"

    def _normalize_scores(self, recommendations: list[dict]) -> list[dict]:
        if not recommendations:
            return []
        max_score = max(r['score'] for r in recommendations)
        if max_score == 0:
            return recommendations
        return [{**r, 'score': r['score'] / max_score} for r in recommendations]

    def _merge_recommendations(
        self,
        cf_recs: list[dict],
        cb_recs: list[dict],
        n: int,
    ) -> list[dict]:
        """Merge CF and CB recommendations with weighted scores."""
        score_dict: dict[str, float] = {}

        for rec in cf_recs:
            pid = rec['product_id']
            score_dict[pid] = score_dict.get(pid, 0) + self.cf_weight * rec['score']

        for rec in cb_recs:
            pid = rec['product_id']
            score_dict[pid] = score_dict.get(pid, 0) + self.cb_weight * rec['score']

        sorted_items = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)[:n]
        return [{'product_id': k, 'score': round(v, 4)} for k, v in sorted_items]

    def recommend(
        self,
        user_id: str,
        category_id: Optional[str] = None,
        n: int = 20,
        strategy: str = 'hybrid',
        use_cache: bool = True,
    ) -> list[dict]:
        """Main recommendation method."""
        cache_key = self._cache_key(user_id, category_id, strategy)

        if use_cache:
            try:
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Redis cache read error: {e}")

        result: list[dict] = []

        if strategy == 'cf':
            cf_recs = self.cf.recommend(user_id, n=n)
            result = self._normalize_scores(cf_recs)

        elif strategy == 'cb':
            cb_recs = self.cb.recommend_for_category(category_id, n)
            result = self._normalize_scores(cb_recs)

        elif strategy == 'popular':
            result = self.cb.recommend_for_category(category_id, n)

        else:  # hybrid
            cf_recs = self.cf.recommend(user_id, n=n * 3)

            if not cf_recs:
                # Cold start: use popularity fallback
                logger.info(f"Cold start for user {user_id}, using popularity fallback")
                result = self.cb.recommend_for_category(category_id, n)
            else:
                cf_normalized = self._normalize_scores(cf_recs)

                # Filter by category if specified
                if category_id:
                    category_products = self._get_category_products(category_id)
                    cf_filtered = [r for r in cf_normalized if r['product_id'] in category_products]

                    if len(cf_filtered) < n // 2:
                        # Not enough CF results for this category, supplement with CB
                        cb_recs = self.cb.recommend_for_category(category_id, n * 2)
                        cb_normalized = self._normalize_scores(cb_recs)
                        result = self._merge_recommendations(cf_filtered, cb_normalized, n)
                    else:
                        result = cf_filtered[:n]
                else:
                    result = cf_normalized[:n]

        if use_cache and result:
            try:
                self.redis.setex(cache_key, self.cache_ttl, json.dumps(result))
            except Exception as e:
                logger.warning(f"Redis cache write error: {e}")

        return result

    def get_similar(self, product_id: str, n: int = 10) -> list[dict]:
        """Get similar products using both CF and CB."""
        cache_key = f"similar:{product_id}:{n}"
        try:
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        # Try CF-based similarity first
        cf_similar = self.cf.similar_items(product_id, n=n)
        cb_similar = self.cb.get_similar(product_id, top_n=n)

        if cf_similar and cb_similar:
            result = self._merge_recommendations(
                self._normalize_scores(cf_similar),
                self._normalize_scores(cb_similar),
                n,
            )
        elif cf_similar:
            result = self._normalize_scores(cf_similar)[:n]
        else:
            result = self._normalize_scores(cb_similar)[:n]

        try:
            self.redis.setex(cache_key, self.cache_ttl, json.dumps(result))
        except Exception:
            pass

        return result

    def _get_category_products(self, category_id: str) -> set[str]:
        """Get product IDs for a category (cached)."""
        key = f"cat_products:{category_id}"
        try:
            cached = self.redis.get(key)
            if cached:
                return set(json.loads(cached))
        except Exception:
            pass

        # Get from CB model's product dataframe
        if self.cb.products_df is not None:
            products = self.cb.products_df[
                self.cb.products_df['category_id'] == category_id
            ]['id'].astype(str).tolist()
            try:
                self.redis.setex(key, 3600, json.dumps(products))
            except Exception:
                pass
            return set(products)
        return set()

    def invalidate_cache(self, user_id: str) -> None:
        """Invalidate all cached recommendations for a user."""
        try:
            keys = self.redis.keys(f"rec:*:{user_id}:*")
            if keys:
                self.redis.delete(*keys)
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
