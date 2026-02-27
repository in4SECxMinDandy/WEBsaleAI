# ============================================================
# Evaluation Metrics — Precision@K, Recall@K, NDCG@K
# ============================================================

import numpy as np
import pandas as pd
from loguru import logger


def precision_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """Precision@K: fraction of top-K recommendations that are relevant."""
    if not recommended or not relevant:
        return 0.0
    top_k = recommended[:k]
    hits = sum(1 for item in top_k if item in relevant)
    return hits / k


def recall_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """Recall@K: fraction of relevant items that appear in top-K."""
    if not recommended or not relevant:
        return 0.0
    top_k = recommended[:k]
    hits = sum(1 for item in top_k if item in relevant)
    return hits / len(relevant)


def ndcg_at_k(recommended: list[str], relevant: set[str], k: int) -> float:
    """NDCG@K: Normalized Discounted Cumulative Gain."""
    if not recommended or not relevant:
        return 0.0
    top_k = recommended[:k]
    dcg = sum(
        1.0 / np.log2(i + 2)
        for i, item in enumerate(top_k)
        if item in relevant
    )
    ideal_hits = min(len(relevant), k)
    idcg = sum(1.0 / np.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg > 0 else 0.0


def evaluate_recommendations(
    cf_model,
    test_events: pd.DataFrame,
    k: int = 10,
) -> dict[str, float]:
    """
    Evaluate CF model on test events.
    Uses leave-one-out evaluation strategy.
    """
    if test_events.empty:
        return {}

    # Get users who have test interactions
    test_users = test_events['user_id'].unique()
    # Sample max 500 users for evaluation speed
    if len(test_users) > 500:
        test_users = np.random.choice(test_users, 500, replace=False)

    precisions, recalls, ndcgs = [], [], []

    for user_id in test_users:
        # Ground truth: products the user interacted with in test set
        user_test = test_events[test_events['user_id'] == user_id]
        relevant_items = set(user_test['product_id'].astype(str).tolist())

        if not relevant_items:
            continue

        # Get recommendations
        recs = cf_model.recommend(str(user_id), n=k * 2, filter_seen=True)
        if not recs:
            continue

        recommended_ids = [r['product_id'] for r in recs]

        precisions.append(precision_at_k(recommended_ids, relevant_items, k))
        recalls.append(recall_at_k(recommended_ids, relevant_items, k))
        ndcgs.append(ndcg_at_k(recommended_ids, relevant_items, k))

    if not precisions:
        return {}

    metrics = {
        f"precision_at_{k}": float(np.mean(precisions)),
        f"recall_at_{k}": float(np.mean(recalls)),
        f"ndcg_at_{k}": float(np.mean(ndcgs)),
        "n_evaluated_users": len(precisions),
    }

    logger.info(f"Evaluation results: {metrics}")
    return metrics


def calculate_coverage(cf_model, all_product_ids: list[str], sample_users: int = 100) -> float:
    """
    Coverage: fraction of all products that appear in recommendations.
    """
    if not hasattr(cf_model, 'user_index') or not cf_model.user_index:
        return 0.0

    users = list(cf_model.user_index.keys())[:sample_users]
    recommended_products: set[str] = set()

    for user_id in users:
        recs = cf_model.recommend(user_id, n=20)
        recommended_products.update(r['product_id'] for r in recs)

    return len(recommended_products) / len(all_product_ids) if all_product_ids else 0.0
