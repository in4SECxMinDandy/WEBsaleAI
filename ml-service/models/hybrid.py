# ============================================================
# Hybrid Recommendation Engine
# CF (ALS) + CB (TF-IDF) + NCF (Neural Collaborative Filtering)
# Cold Start Fallback + Redis Caching
# ============================================================

import redis
import json
from typing import Optional
from loguru import logger

from .content_based import ContentBasedModel
from .collaborative import CollaborativeModel
from .ncf import NCFTrainer


class HybridEngine:
    """
    Hybrid Recommendation Engine combining:
    - CF  (Collaborative Filtering via ALS)  — weight: cf_weight
    - CB  (Content-Based via TF-IDF)         — weight: cb_weight
    - NCF (Neural Collaborative Filtering)   — weight: ncf_weight
    - Popularity fallback for cold-start users
    """

    def __init__(
        self,
        cf_model: CollaborativeModel,
        cb_model: ContentBasedModel,
        redis_client: redis.Redis,
        ncf_model: Optional[NCFTrainer] = None,
        cf_weight: float = 0.5,
        cb_weight: float = 0.3,
        ncf_weight: float = 0.2,
        cache_ttl: int = 3600,
    ):
        self.cf = cf_model
        self.cb = cb_model
        self.ncf = ncf_model          # Optional — gracefully degraded if None
        self.redis = redis_client
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.ncf_weight = ncf_weight
        self.cache_ttl = cache_ttl

        # Normalize weights so they always sum to 1.0
        self._normalize_weights()

    # ─── Weight Management ────────────────────────────────────

    def _normalize_weights(self) -> None:
        """Ensure CF + CB + NCF weights sum to 1.0."""
        if self.ncf is None:
            # Redistribute NCF weight proportionally to CF and CB
            total = self.cf_weight + self.cb_weight
            if total > 0:
                self.cf_weight = self.cf_weight / total
                self.cb_weight = self.cb_weight / total
            self.ncf_weight = 0.0
        else:
            total = self.cf_weight + self.cb_weight + self.ncf_weight
            if total > 0:
                self.cf_weight = self.cf_weight / total
                self.cb_weight = self.cb_weight / total
                self.ncf_weight = self.ncf_weight / total

    def update_weights(
        self,
        cf_weight: float,
        cb_weight: float,
        ncf_weight: float = 0.0,
    ) -> None:
        """Dynamically update model weights (e.g., from A/B test results)."""
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.ncf_weight = ncf_weight
        self._normalize_weights()
        logger.info(
            f"Weights updated — CF: {self.cf_weight:.2f}, "
            f"CB: {self.cb_weight:.2f}, NCF: {self.ncf_weight:.2f}"
        )

    # ─── Cache Helpers ────────────────────────────────────────

    def _cache_key(self, user_id: str, category_id: Optional[str], strategy: str) -> str:
        return f"rec:{strategy}:{user_id}:{category_id or 'all'}"

    def _read_cache(self, key: str) -> Optional[list]:
        try:
            cached = self.redis.get(key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis cache read error [{key}]: {e}")
        return None

    def _write_cache(self, key: str, data: list) -> None:
        try:
            self.redis.setex(key, self.cache_ttl, json.dumps(data))
        except Exception as e:
            logger.warning(f"Redis cache write error [{key}]: {e}")

    # ─── Score Normalization ──────────────────────────────────

    def _normalize_scores(self, recommendations: list[dict]) -> list[dict]:
        """Min-max normalize scores to [0, 1]."""
        if not recommendations:
            return []
        max_score = max(r['score'] for r in recommendations)
        if max_score == 0:
            return recommendations
        return [{**r, 'score': r['score'] / max_score} for r in recommendations]

    # ─── Merge Logic ─────────────────────────────────────────

    def _merge_recommendations(
        self,
        cf_recs: list[dict],
        cb_recs: list[dict],
        n: int,
        ncf_recs: Optional[list[dict]] = None,
    ) -> list[dict]:
        """
        Merge CF, CB, and optionally NCF recommendations with weighted scores.
        Products appearing in multiple models get score boosted.
        """
        score_dict: dict[str, float] = {}

        for rec in cf_recs:
            pid = rec['product_id']
            score_dict[pid] = score_dict.get(pid, 0.0) + self.cf_weight * rec['score']

        for rec in cb_recs:
            pid = rec['product_id']
            score_dict[pid] = score_dict.get(pid, 0.0) + self.cb_weight * rec['score']

        if ncf_recs:
            for rec in ncf_recs:
                pid = rec['product_id']
                score_dict[pid] = score_dict.get(pid, 0.0) + self.ncf_weight * rec['score']

        sorted_items = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)[:n]
        return [{'product_id': k, 'score': round(v, 4)} for k, v in sorted_items]

    # ─── Main Recommendation Method ───────────────────────────

    def recommend(
        self,
        user_id: str,
        category_id: Optional[str] = None,
        n: int = 20,
        strategy: str = 'hybrid',
        use_cache: bool = True,
    ) -> list[dict]:
        """
        Main recommendation entry point.

        Strategies:
        - 'hybrid'  : CF + CB + NCF (weighted merge)
        - 'cf'      : Collaborative Filtering only
        - 'cb'      : Content-Based only
        - 'ncf'     : Neural CF only (falls back to CF if NCF unavailable)
        - 'popular' : Popularity-based (no personalization)
        """
        cache_key = self._cache_key(user_id, category_id, strategy)

        if use_cache:
            cached = self._read_cache(cache_key)
            if cached is not None:
                return cached

        result: list[dict] = []

        if strategy == 'cf':
            cf_recs = self.cf.recommend(user_id, n=n)
            result = self._normalize_scores(cf_recs)

        elif strategy == 'cb':
            cb_recs = self.cb.recommend_for_category(category_id, n)
            result = self._normalize_scores(cb_recs)

        elif strategy == 'ncf':
            if self.ncf is not None:
                ncf_recs = self.ncf.recommend(user_id, top_n=n)
                result = self._normalize_scores(ncf_recs)
            else:
                logger.warning("NCF model not loaded, falling back to CF")
                cf_recs = self.cf.recommend(user_id, n=n)
                result = self._normalize_scores(cf_recs)

        elif strategy == 'popular':
            result = self.cb.recommend_for_category(category_id, n)

        else:  # 'hybrid' — default
            result = self._hybrid_recommend(user_id, category_id, n)

        if use_cache and result:
            self._write_cache(cache_key, result)

        return result

    def _hybrid_recommend(
        self,
        user_id: str,
        category_id: Optional[str],
        n: int,
    ) -> list[dict]:
        """
        Full hybrid recommendation logic:
        1. Try CF + NCF for personalization
        2. Supplement with CB for diversity
        3. Fall back to popularity for cold-start users
        """
        # Fetch CF recommendations (fetch more for better merging)
        cf_recs = self.cf.recommend(user_id, n=n * 3)

        # Cold start: user has no interaction history
        if not cf_recs:
            logger.info(f"Cold start for user '{user_id}', using popularity fallback")
            return self.cb.recommend_for_category(category_id, n)

        cf_normalized = self._normalize_scores(cf_recs)

        # Fetch NCF recommendations if model is available
        ncf_normalized: list[dict] = []
        if self.ncf is not None:
            try:
                ncf_recs = self.ncf.recommend(user_id, top_n=n * 2)
                ncf_normalized = self._normalize_scores(ncf_recs)
            except Exception as e:
                logger.warning(f"NCF recommend failed for user '{user_id}': {e}")

        # Category filtering
        if category_id:
            category_products = self._get_category_products(category_id)

            cf_filtered = [r for r in cf_normalized if r['product_id'] in category_products]
            ncf_filtered = [r for r in ncf_normalized if r['product_id'] in category_products]

            # Not enough personalized results → supplement with CB
            if len(cf_filtered) < n // 2:
                cb_recs = self.cb.recommend_for_category(category_id, n * 2)
                cb_normalized = self._normalize_scores(cb_recs)
                return self._merge_recommendations(
                    cf_filtered, cb_normalized, n, ncf_filtered or None
                )
            else:
                if ncf_filtered:
                    return self._merge_recommendations(cf_filtered, [], n, ncf_filtered)
                return cf_filtered[:n]
        else:
            # No category filter — merge all signals
            cb_recs = self.cb.recommend_for_category(None, n * 2)
            cb_normalized = self._normalize_scores(cb_recs)
            return self._merge_recommendations(
                cf_normalized, cb_normalized, n, ncf_normalized or None
            )

    # ─── Similar Products ─────────────────────────────────────

    def get_similar(self, product_id: str, n: int = 10) -> list[dict]:
        """
        Get similar products using CF item factors + CB content similarity.
        Results are merged and cached.
        """
        cache_key = f"similar:{product_id}:{n}"
        cached = self._read_cache(cache_key)
        if cached is not None:
            return cached

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
        elif cb_similar:
            result = self._normalize_scores(cb_similar)[:n]
        else:
            result = []

        if result:
            self._write_cache(cache_key, result)

        return result

    # ─── Category Products Cache ──────────────────────────────

    def _get_category_products(self, category_id: str) -> set[str]:
        """Get product IDs for a category (Redis-cached for 1 hour)."""
        key = f"cat_products:{category_id}"
        cached = self._read_cache(key)
        if cached is not None:
            return set(cached)

        if self.cb.products_df is not None:
            products = (
                self.cb.products_df[self.cb.products_df['category_id'] == category_id]
                ['id']
                .astype(str)
                .tolist()
            )
            try:
                self.redis.setex(key, 3600, json.dumps(products))
            except Exception:
                pass
            return set(products)

        return set()

    # ─── Cache Invalidation ───────────────────────────────────

    def invalidate_cache(self, user_id: str) -> None:
        """Invalidate all cached recommendations for a specific user."""
        try:
            keys = self.redis.keys(f"rec:*:{user_id}:*")
            if keys:
                self.redis.delete(*keys)
                logger.debug(f"Invalidated {len(keys)} cache keys for user '{user_id}'")
        except Exception as e:
            logger.warning(f"Cache invalidation error for user '{user_id}': {e}")

    def invalidate_product_cache(self, product_id: str) -> None:
        """Invalidate similar-product cache for a specific product."""
        try:
            keys = self.redis.keys(f"similar:{product_id}:*")
            if keys:
                self.redis.delete(*keys)
        except Exception as e:
            logger.warning(f"Product cache invalidation error: {e}")

    # ─── Engine Info ──────────────────────────────────────────

    def get_info(self) -> dict:
        """Return engine metadata for health/status endpoints."""
        return {
            "cf_loaded": self.cf is not None,
            "cb_loaded": self.cb is not None,
            "ncf_loaded": self.ncf is not None,
            "weights": {
                "cf": round(self.cf_weight, 3),
                "cb": round(self.cb_weight, 3),
                "ncf": round(self.ncf_weight, 3),
            },
            "cf_users": len(self.cf.user_index) if self.cf else 0,
            "cf_items": len(self.cf.item_index) if self.cf else 0,
            "cb_products": len(self.cb.product_index) if self.cb else 0,
            "ncf_users": self.ncf.n_users if self.ncf else 0,
            "ncf_items": self.ncf.n_items if self.ncf else 0,
        }
