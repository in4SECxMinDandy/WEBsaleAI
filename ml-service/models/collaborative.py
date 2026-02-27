# ============================================================
# Collaborative Filtering Model — ALS (Implicit Feedback)
# ============================================================

import numpy as np
import scipy.sparse as sp
from implicit import als
import pandas as pd
import pickle
from loguru import logger


# Event weights for implicit feedback
EVENT_WEIGHTS = {
    'page_view': 0.5,
    'product_view': 1.0,
    'search': 0.3,
    'add_to_cart': 3.0,
    'wishlist': 2.0,
    'purchase': 10.0,
    'review': 5.0,
    'click_recommendation': 1.5,
    'remove_from_cart': -1.0,
}


class CollaborativeModel:
    def __init__(self, factors: int = 128, iterations: int = 30, regularization: float = 0.1):
        self.model = als.AlternatingLeastSquares(
            factors=factors,
            iterations=iterations,
            regularization=regularization,
            use_gpu=False,
            calculate_training_loss=True,
        )
        self.user_index: dict[str, int] = {}
        self.item_index: dict[str, int] = {}
        self.user_map: dict[int, str] = {}
        self.item_map: dict[int, str] = {}
        self.user_item_matrix: sp.csr_matrix | None = None

    def build_interaction_matrix(self, events_df: pd.DataFrame) -> sp.csr_matrix:
        """Build user-item interaction matrix from event logs."""
        events_df = events_df.copy()
        events_df['weight'] = events_df['event_type'].map(EVENT_WEIGHTS).fillna(0.5)

        # Aggregate scores per (user, product)
        agg = events_df.groupby(['user_id', 'product_id'])['weight'].sum().reset_index()
        agg = agg[agg['weight'] > 0]  # Remove negative interactions

        # Create index mappings
        users = agg['user_id'].unique()
        items = agg['product_id'].unique()
        self.user_index = {str(u): i for i, u in enumerate(users)}
        self.item_index = {str(p): i for i, p in enumerate(items)}
        self.user_map = {i: str(u) for u, i in self.user_index.items()}
        self.item_map = {i: str(p) for p, i in self.item_index.items()}

        # Build sparse matrix
        rows = [self.user_index[str(u)] for u in agg['user_id']]
        cols = [self.item_index[str(p)] for p in agg['product_id']]
        data = agg['weight'].values.astype(np.float32)

        self.user_item_matrix = sp.csr_matrix(
            (data, (rows, cols)),
            shape=(len(users), len(items)),
        )
        logger.info(f"Interaction matrix: {len(users)} users × {len(items)} items")
        return self.user_item_matrix

    def fit(self, events_df: pd.DataFrame) -> None:
        """Train the ALS model."""
        matrix = self.build_interaction_matrix(events_df)
        logger.info("Training ALS model...")
        self.model.fit(matrix)
        logger.info("ALS model trained successfully")

    def recommend(self, user_id: str, n: int = 20, filter_seen: bool = True) -> list[dict]:
        """Get recommendations for a user."""
        if user_id not in self.user_index or self.user_item_matrix is None:
            return []
        uid = self.user_index[user_id]
        try:
            ids, scores = self.model.recommend(
                uid,
                self.user_item_matrix[uid],
                N=n,
                filter_already_liked_items=filter_seen,
            )
            return [
                {'product_id': self.item_map[int(i)], 'score': float(s)}
                for i, s in zip(ids, scores)
                if int(i) in self.item_map
            ]
        except Exception as e:
            logger.error(f"ALS recommend error for user {user_id}: {e}")
            return []

    def similar_items(self, product_id: str, n: int = 10) -> list[dict]:
        """Get similar items using item factors."""
        if product_id not in self.item_index:
            return []
        iid = self.item_index[product_id]
        try:
            ids, scores = self.model.similar_items(iid, N=n + 1)
            return [
                {'product_id': self.item_map[int(i)], 'score': float(s)}
                for i, s in zip(ids, scores)
                if int(i) in self.item_map and int(i) != iid
            ][:n]
        except Exception as e:
            logger.error(f"ALS similar_items error: {e}")
            return []

    def similar_users(self, user_id: str, n: int = 20) -> list[str]:
        """Get similar users."""
        if user_id not in self.user_index:
            return []
        uid = self.user_index[user_id]
        try:
            ids, _ = self.model.similar_users(uid, N=n + 1)
            return [self.user_map[int(i)] for i in ids if int(i) != uid and int(i) in self.user_map][:n]
        except Exception as e:
            logger.error(f"ALS similar_users error: {e}")
            return []

    def save(self, path: str) -> None:
        with open(path, 'wb') as f:
            pickle.dump(self, f)
        logger.info(f"Collaborative model saved to {path}")

    @staticmethod
    def load(path: str) -> 'CollaborativeModel':
        with open(path, 'rb') as f:
            model = pickle.load(f)
        logger.info(f"Collaborative model loaded from {path}")
        return model
