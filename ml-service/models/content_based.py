# ============================================================
# Content-Based Filtering Model — TF-IDF + Cosine Similarity
# ============================================================

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
from loguru import logger


class ContentBasedModel:
    def __init__(self):
        self.tfidf = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            analyzer='word',
            sublinear_tf=True,
        )
        self.similarity_matrix = None
        self.product_index: dict[str, int] = {}
        self.products_df: pd.DataFrame | None = None

    def build_product_features(self, products_df: pd.DataFrame) -> pd.Series:
        """Combine text fields into a single feature string."""
        features = (
            products_df['name'].fillna('') * 3 + ' ' +  # Weight name higher
            products_df['description'].fillna('') + ' ' +
            products_df['category_name'].fillna('') * 2 + ' ' +
            products_df['brand_name'].fillna('') * 2 + ' ' +
            products_df['tags'].apply(
                lambda x: ' '.join(x) if isinstance(x, list) else str(x) if x else ''
            ).fillna('')
        )
        return features

    def fit(self, products_df: pd.DataFrame) -> None:
        """Train the content-based model."""
        self.products_df = products_df.reset_index(drop=True)
        self.product_index = {
            str(pid): idx for idx, pid in enumerate(products_df['id'])
        }
        features = self.build_product_features(products_df)
        logger.info(f"Building TF-IDF matrix for {len(products_df)} products...")
        tfidf_matrix = self.tfidf.fit_transform(features)
        self.similarity_matrix = cosine_similarity(tfidf_matrix, dense_output=False)
        logger.info("Content-based model trained successfully")

    def get_similar(self, product_id: str, top_n: int = 10) -> list[dict]:
        """Get similar products by content similarity."""
        if product_id not in self.product_index:
            return []
        idx = self.product_index[product_id]
        scores = list(enumerate(self.similarity_matrix[idx].toarray()[0]))
        scores = sorted(scores, key=lambda x: x[1], reverse=True)
        results = []
        for i, score in scores[1:top_n + 1]:
            if score < 0.01:
                break
            row = self.products_df.iloc[i]
            results.append({
                'product_id': str(row['id']),
                'score': float(score),
                'name': str(row.get('name', '')),
            })
        return results

    def recommend_for_category(self, category_id: str | None, top_n: int = 20) -> list[dict]:
        """Return popular products in a category (popularity fallback)."""
        if self.products_df is None:
            return []
        if category_id:
            df = self.products_df[self.products_df['category_id'] == category_id]
        else:
            df = self.products_df
        if df.empty:
            return []
        top = df.nlargest(top_n, 'purchase_count')[['id', 'purchase_count', 'name']]
        max_count = top['purchase_count'].max() or 1
        return [
            {
                'product_id': str(row['id']),
                'score': float(row['purchase_count']) / max_count,
                'name': str(row.get('name', '')),
            }
            for _, row in top.iterrows()
        ]

    def get_product_ids(self) -> list[str]:
        if self.products_df is None:
            return []
        return [str(pid) for pid in self.products_df['id'].tolist()]

    def save(self, path: str) -> None:
        with open(path, 'wb') as f:
            pickle.dump(self, f)
        logger.info(f"Content-based model saved to {path}")

    @staticmethod
    def load(path: str) -> 'ContentBasedModel':
        with open(path, 'rb') as f:
            model = pickle.load(f)
        logger.info(f"Content-based model loaded from {path}")
        return model
