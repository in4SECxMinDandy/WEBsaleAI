# ============================================================
# Unit Tests — ML Models
# Tests: CollaborativeModel, ContentBasedModel, NCFTrainer, HybridEngine
# Run: pytest ml-service/tests/test_models.py -v
# ============================================================

import sys
import os

# Add ml-service root to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
import pandas as pd
import pytest
from unittest.mock import MagicMock, patch

from models.collaborative import CollaborativeModel
from models.content_based import ContentBasedModel
from models.ncf import NCFTrainer
from models.hybrid import HybridEngine
from evaluation.metrics import precision_at_k, recall_at_k, ndcg_at_k


# ─── Fixtures ─────────────────────────────────────────────

@pytest.fixture
def sample_events_df():
    """Minimal event dataframe for testing."""
    return pd.DataFrame({
        'user_id': ['u1', 'u1', 'u2', 'u2', 'u3', 'u3', 'u1'],
        'product_id': ['p1', 'p2', 'p2', 'p3', 'p1', 'p3', 'p3'],
        'event_type': [
            'product_view', 'add_to_cart', 'purchase',
            'product_view', 'add_to_cart', 'purchase', 'purchase',
        ],
        'created_at': pd.date_range('2024-01-01', periods=7, freq='D'),
    })


@pytest.fixture
def sample_products_df():
    """Minimal products dataframe for testing."""
    return pd.DataFrame({
        'id': ['p1', 'p2', 'p3', 'p4', 'p5'],
        'name': ['Laptop Pro', 'Gaming Mouse', 'Mechanical Keyboard', 'Monitor 4K', 'USB Hub'],
        'description': [
            'High performance laptop for professionals',
            'Ergonomic gaming mouse with RGB',
            'Tactile mechanical keyboard for typing',
            'Ultra HD 4K monitor for creative work',
            'Multi-port USB hub for connectivity',
        ],
        'category_id': ['cat1', 'cat2', 'cat2', 'cat1', 'cat2'],
        'category_name': ['Laptops', 'Peripherals', 'Peripherals', 'Monitors', 'Accessories'],
        'brand_name': ['TechBrand', 'GamingCo', 'TypeMaster', 'ViewTech', 'ConnectPro'],
        'tags': [
            ['laptop', 'pro', 'work'],
            ['mouse', 'gaming', 'rgb'],
            ['keyboard', 'mechanical', 'typing'],
            ['monitor', '4k', 'uhd'],
            ['usb', 'hub', 'accessories'],
        ],
        'purchase_count': [150, 300, 200, 80, 120],
        'view_count': [1500, 3000, 2000, 800, 1200],
        'base_price': [1200.0, 45.0, 89.0, 350.0, 25.0],
    })


@pytest.fixture
def mock_redis():
    """Mock Redis client that always returns None (cache miss)."""
    mock = MagicMock()
    mock.get.return_value = None
    mock.setex.return_value = True
    mock.keys.return_value = []
    mock.delete.return_value = 0
    return mock


@pytest.fixture
def trained_cf_model(sample_events_df):
    """Trained CollaborativeModel fixture."""
    model = CollaborativeModel(factors=16, iterations=5)
    model.fit(sample_events_df)
    return model


@pytest.fixture
def trained_cb_model(sample_products_df):
    """Trained ContentBasedModel fixture."""
    model = ContentBasedModel()
    model.fit(sample_products_df)
    return model


@pytest.fixture
def hybrid_engine(trained_cf_model, trained_cb_model, mock_redis):
    """HybridEngine without NCF (NCF is optional)."""
    return HybridEngine(
        cf_model=trained_cf_model,
        cb_model=trained_cb_model,
        redis_client=mock_redis,
        ncf_model=None,
        cf_weight=0.6,
        cb_weight=0.4,
        ncf_weight=0.0,
    )


# ─── CollaborativeModel Tests ─────────────────────────────

class TestCollaborativeModel:

    def test_fit_builds_index(self, sample_events_df):
        model = CollaborativeModel(factors=16, iterations=3)
        model.fit(sample_events_df)
        assert len(model.user_index) == 3  # u1, u2, u3
        assert len(model.item_index) == 3  # p1, p2, p3

    def test_recommend_known_user(self, trained_cf_model):
        recs = trained_cf_model.recommend('u1', n=5)
        assert isinstance(recs, list)
        # Each rec must have product_id and score
        for rec in recs:
            assert 'product_id' in rec
            assert 'score' in rec
            assert isinstance(rec['score'], float)

    def test_recommend_unknown_user_returns_empty(self, trained_cf_model):
        recs = trained_cf_model.recommend('unknown_user_xyz', n=5)
        assert recs == []

    def test_similar_items_known_product(self, trained_cf_model):
        similar = trained_cf_model.similar_items('p1', n=3)
        assert isinstance(similar, list)

    def test_similar_items_unknown_product_returns_empty(self, trained_cf_model):
        similar = trained_cf_model.similar_items('unknown_product', n=3)
        assert similar == []

    def test_save_and_load(self, trained_cf_model, tmp_path):
        path = str(tmp_path / "cf_model.pkl")
        trained_cf_model.save(path)
        loaded = CollaborativeModel.load(path)
        assert loaded.user_index == trained_cf_model.user_index
        assert loaded.item_index == trained_cf_model.item_index


# ─── ContentBasedModel Tests ──────────────────────────────

class TestContentBasedModel:

    def test_fit_builds_index(self, sample_products_df):
        model = ContentBasedModel()
        model.fit(sample_products_df)
        assert len(model.product_index) == 5
        assert model.similarity_matrix is not None

    def test_get_similar_known_product(self, trained_cb_model):
        similar = trained_cb_model.get_similar('p1', top_n=3)
        assert isinstance(similar, list)
        for item in similar:
            assert 'product_id' in item
            assert 'score' in item
            assert item['product_id'] != 'p1'  # Should not include itself

    def test_get_similar_unknown_product_returns_empty(self, trained_cb_model):
        similar = trained_cb_model.get_similar('unknown_product', top_n=3)
        assert similar == []

    def test_recommend_for_category(self, trained_cb_model):
        recs = trained_cb_model.recommend_for_category('cat2', top_n=5)
        assert isinstance(recs, list)
        assert len(recs) <= 3  # Only 3 products in cat2

    def test_recommend_for_category_none_returns_all(self, trained_cb_model):
        recs = trained_cb_model.recommend_for_category(None, top_n=10)
        assert len(recs) <= 5  # Total 5 products

    def test_recommend_sorted_by_purchase_count(self, trained_cb_model):
        recs = trained_cb_model.recommend_for_category(None, top_n=5)
        scores = [r['score'] for r in recs]
        assert scores == sorted(scores, reverse=True)

    def test_save_and_load(self, trained_cb_model, tmp_path):
        path = str(tmp_path / "cb_model.pkl")
        trained_cb_model.save(path)
        loaded = ContentBasedModel.load(path)
        assert loaded.product_index == trained_cb_model.product_index


# ─── NCFTrainer Tests ─────────────────────────────────────

class TestNCFTrainer:

    def test_train_and_recommend(self):
        trainer = NCFTrainer(n_users=5, n_items=5, embed_dim=8)
        trainer.user_index = {'u1': 0, 'u2': 1, 'u3': 2}
        trainer.item_index = {'p1': 0, 'p2': 1, 'p3': 2}
        trainer.user_map = {0: 'u1', 1: 'u2', 2: 'u3'}
        trainer.item_map = {0: 'p1', 1: 'p2', 2: 'p3'}

        interactions = [(0, 0), (0, 1), (1, 1), (1, 2), (2, 0), (2, 2)]
        losses = trainer.train(interactions, epochs=3, batch_size=4)

        assert len(losses) == 3
        assert all(isinstance(l, float) for l in losses)

    def test_recommend_unknown_user_returns_empty(self):
        trainer = NCFTrainer(n_users=3, n_items=3, embed_dim=8)
        trainer.user_index = {}
        recs = trainer.recommend('unknown_user', top_n=5)
        assert recs == []

    def test_save_and_load(self, tmp_path):
        trainer = NCFTrainer(n_users=3, n_items=3, embed_dim=8)
        trainer.user_index = {'u1': 0}
        trainer.item_index = {'p1': 0}
        trainer.user_map = {0: 'u1'}
        trainer.item_map = {0: 'p1'}

        path = str(tmp_path / "ncf_model.pt")
        trainer.save(path)
        loaded = NCFTrainer.load(path)
        assert loaded.n_users == 3
        assert loaded.n_items == 3
        assert loaded.user_index == {'u1': 0}


# ─── HybridEngine Tests ───────────────────────────────────

class TestHybridEngine:

    def test_weight_normalization_without_ncf(self, trained_cf_model, trained_cb_model, mock_redis):
        engine = HybridEngine(
            cf_model=trained_cf_model,
            cb_model=trained_cb_model,
            redis_client=mock_redis,
            ncf_model=None,
            cf_weight=0.6,
            cb_weight=0.4,
            ncf_weight=0.2,
        )
        # Without NCF, weights should be renormalized to sum to 1.0
        assert abs(engine.cf_weight + engine.cb_weight - 1.0) < 1e-6
        assert engine.ncf_weight == 0.0

    def test_weight_normalization_with_ncf(self, trained_cf_model, trained_cb_model, mock_redis):
        mock_ncf = MagicMock()
        mock_ncf.recommend.return_value = [{'product_id': 'p1', 'score': 0.9}]
        engine = HybridEngine(
            cf_model=trained_cf_model,
            cb_model=trained_cb_model,
            redis_client=mock_redis,
            ncf_model=mock_ncf,
            cf_weight=0.5,
            cb_weight=0.3,
            ncf_weight=0.2,
        )
        total = engine.cf_weight + engine.cb_weight + engine.ncf_weight
        assert abs(total - 1.0) < 1e-6

    def test_recommend_hybrid_known_user(self, hybrid_engine):
        recs = hybrid_engine.recommend('u1', n=5, strategy='hybrid')
        assert isinstance(recs, list)

    def test_recommend_cf_strategy(self, hybrid_engine):
        recs = hybrid_engine.recommend('u1', n=5, strategy='cf')
        assert isinstance(recs, list)

    def test_recommend_cb_strategy(self, hybrid_engine):
        recs = hybrid_engine.recommend('u1', n=5, strategy='cb')
        assert isinstance(recs, list)

    def test_recommend_popular_strategy(self, hybrid_engine):
        recs = hybrid_engine.recommend('u1', n=5, strategy='popular')
        assert isinstance(recs, list)
        assert len(recs) <= 5

    def test_cold_start_returns_popular(self, hybrid_engine):
        """Unknown user should get popularity-based fallback."""
        recs = hybrid_engine.recommend('brand_new_user_xyz', n=5, strategy='hybrid')
        assert isinstance(recs, list)

    def test_get_similar(self, hybrid_engine):
        similar = hybrid_engine.get_similar('p1', n=3)
        assert isinstance(similar, list)

    def test_cache_invalidation(self, hybrid_engine, mock_redis):
        mock_redis.keys.return_value = ['rec:hybrid:u1:all', 'rec:cf:u1:all']
        hybrid_engine.invalidate_cache('u1')
        mock_redis.delete.assert_called_once()

    def test_get_info(self, hybrid_engine):
        info = hybrid_engine.get_info()
        assert 'cf_loaded' in info
        assert 'cb_loaded' in info
        assert 'ncf_loaded' in info
        assert 'weights' in info
        assert info['ncf_loaded'] is False  # No NCF in this fixture

    def test_normalize_scores_empty(self, hybrid_engine):
        result = hybrid_engine._normalize_scores([])
        assert result == []

    def test_normalize_scores_zero_max(self, hybrid_engine):
        recs = [{'product_id': 'p1', 'score': 0.0}]
        result = hybrid_engine._normalize_scores(recs)
        assert result[0]['score'] == 0.0


# ─── Evaluation Metrics Tests ─────────────────────────────

class TestEvaluationMetrics:

    def test_precision_at_k_perfect(self):
        recommended = ['p1', 'p2', 'p3']
        relevant = {'p1', 'p2', 'p3'}
        assert precision_at_k(recommended, relevant, k=3) == 1.0

    def test_precision_at_k_zero(self):
        recommended = ['p4', 'p5', 'p6']
        relevant = {'p1', 'p2', 'p3'}
        assert precision_at_k(recommended, relevant, k=3) == 0.0

    def test_precision_at_k_partial(self):
        recommended = ['p1', 'p4', 'p2']
        relevant = {'p1', 'p2', 'p3'}
        assert abs(precision_at_k(recommended, relevant, k=3) - 2/3) < 1e-6

    def test_recall_at_k_perfect(self):
        recommended = ['p1', 'p2', 'p3']
        relevant = {'p1', 'p2', 'p3'}
        assert recall_at_k(recommended, relevant, k=3) == 1.0

    def test_recall_at_k_partial(self):
        recommended = ['p1', 'p4', 'p5']
        relevant = {'p1', 'p2', 'p3'}
        assert abs(recall_at_k(recommended, relevant, k=3) - 1/3) < 1e-6

    def test_ndcg_at_k_perfect(self):
        recommended = ['p1', 'p2', 'p3']
        relevant = {'p1', 'p2', 'p3'}
        assert abs(ndcg_at_k(recommended, relevant, k=3) - 1.0) < 1e-6

    def test_ndcg_at_k_empty_recommended(self):
        assert ndcg_at_k([], {'p1'}, k=5) == 0.0

    def test_ndcg_at_k_empty_relevant(self):
        assert ndcg_at_k(['p1', 'p2'], set(), k=5) == 0.0
