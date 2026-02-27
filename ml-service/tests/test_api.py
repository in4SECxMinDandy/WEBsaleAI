# ============================================================
# Integration Tests — FastAPI Endpoints
# Tests: /health, /recommend, /similar, /trending, /events/track
# Run: pytest ml-service/tests/test_api.py -v
# ============================================================

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient


# ─── App Setup with Mocked State ──────────────────────────

@pytest.fixture(scope="module")
def mock_engine():
    """Mock HybridEngine for API tests."""
    engine = MagicMock()
    engine.recommend.return_value = [
        {'product_id': 'prod-uuid-1', 'score': 0.95},
        {'product_id': 'prod-uuid-2', 'score': 0.87},
        {'product_id': 'prod-uuid-3', 'score': 0.72},
    ]
    engine.get_similar.return_value = [
        {'product_id': 'prod-uuid-2', 'score': 0.88},
        {'product_id': 'prod-uuid-4', 'score': 0.65},
    ]
    engine.cb.recommend_for_category.return_value = [
        {'product_id': 'prod-uuid-1', 'score': 1.0, 'name': 'Top Product'},
        {'product_id': 'prod-uuid-5', 'score': 0.8, 'name': 'Second Product'},
    ]
    engine.invalidate_cache.return_value = None
    engine.get_info.return_value = {
        "cf_loaded": True,
        "cb_loaded": True,
        "ncf_loaded": True,
        "weights": {"cf": 0.5, "cb": 0.3, "ncf": 0.2},
        "cf_users": 100,
        "cf_items": 500,
        "cb_products": 500,
        "ncf_users": 100,
        "ncf_items": 500,
    }
    return engine


@pytest.fixture(scope="module")
def mock_redis():
    """Mock Redis client."""
    r = MagicMock()
    r.ping.return_value = True
    r.get.return_value = None
    r.setex.return_value = True
    r.keys.return_value = ['rec:hybrid:u1:all']
    r.delete.return_value = 1
    r.info.return_value = {
        "used_memory_human": "1.5M",
        "connected_clients": 3,
    }
    return r


@pytest.fixture(scope="module")
def client(mock_engine, mock_redis):
    """TestClient with mocked app_state."""
    import main
    main.app_state.engine = mock_engine
    main.app_state.redis_client = mock_redis
    main.app_state.is_training = False

    with TestClient(main.app) as c:
        yield c


# ─── Health Check Tests ───────────────────────────────────

class TestHealthEndpoint:

    def test_health_returns_200(self, client):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_structure(self, client):
        data = client.get("/health").json()
        assert "status" in data
        assert "models_loaded" in data
        assert "redis_connected" in data
        assert "is_training" in data

    def test_health_models_loaded(self, client):
        data = client.get("/health").json()
        assert data["models_loaded"] is True

    def test_health_not_training(self, client):
        data = client.get("/health").json()
        assert data["is_training"] is False


# ─── Recommendation Endpoint Tests ────────────────────────

class TestRecommendEndpoints:

    def test_post_recommend_returns_200(self, client):
        response = client.post("/recommend", json={
            "user_id": "user-uuid-123",
            "limit": 10,
            "strategy": "hybrid",
        })
        assert response.status_code == 200

    def test_post_recommend_structure(self, client):
        data = client.post("/recommend", json={
            "user_id": "user-uuid-123",
            "limit": 10,
            "strategy": "hybrid",
        }).json()
        assert "user_id" in data
        assert "strategy" in data
        assert "recommendations" in data
        assert "count" in data
        assert isinstance(data["recommendations"], list)

    def test_post_recommend_with_category(self, client):
        response = client.post("/recommend", json={
            "user_id": "user-uuid-123",
            "category_id": "cat-uuid-456",
            "limit": 5,
            "strategy": "hybrid",
        })
        assert response.status_code == 200

    def test_get_recommend_returns_200(self, client):
        response = client.get("/recommend/user-uuid-123?limit=10&strategy=hybrid")
        assert response.status_code == 200

    def test_get_recommend_cf_strategy(self, client):
        response = client.get("/recommend/user-uuid-123?strategy=cf")
        assert response.status_code == 200

    def test_get_recommend_popular_strategy(self, client):
        response = client.get("/recommend/user-uuid-123?strategy=popular")
        assert response.status_code == 200

    def test_recommend_limit_validation(self, client):
        """Limit > 100 should be rejected."""
        response = client.post("/recommend", json={
            "user_id": "user-uuid-123",
            "limit": 999,
            "strategy": "hybrid",
        })
        assert response.status_code == 422  # Validation error

    def test_recommend_no_engine_returns_fallback(self, mock_redis):
        """When engine is None, should return empty recommendations gracefully."""
        import main
        original_engine = main.app_state.engine
        main.app_state.engine = None

        with TestClient(main.app) as c:
            response = c.post("/recommend", json={
                "user_id": "user-uuid-123",
                "limit": 10,
                "strategy": "hybrid",
            })
            data = response.json()
            assert response.status_code == 200
            assert data["recommendations"] == []
            assert data["strategy"] == "fallback"

        main.app_state.engine = original_engine


# ─── Similar Products Tests ───────────────────────────────

class TestSimilarEndpoint:

    def test_get_similar_returns_200(self, client):
        response = client.get("/similar/prod-uuid-1?limit=5")
        assert response.status_code == 200

    def test_get_similar_structure(self, client):
        data = client.get("/similar/prod-uuid-1").json()
        assert "product_id" in data
        assert "similar" in data
        assert "count" in data
        assert isinstance(data["similar"], list)

    def test_get_similar_no_engine(self, mock_redis):
        import main
        original_engine = main.app_state.engine
        main.app_state.engine = None

        with TestClient(main.app) as c:
            data = c.get("/similar/prod-uuid-1").json()
            assert data["similar"] == []

        main.app_state.engine = original_engine


# ─── Trending Endpoint Tests ──────────────────────────────

class TestTrendingEndpoint:

    def test_get_trending_returns_200(self, client):
        response = client.get("/trending")
        assert response.status_code == 200

    def test_get_trending_structure(self, client):
        data = client.get("/trending").json()
        assert "recommendations" in data
        assert "strategy" in data
        assert data["strategy"] == "popular"

    def test_get_trending_with_category(self, client):
        response = client.get("/trending?category_id=cat-uuid-456&limit=10")
        assert response.status_code == 200


# ─── Event Tracking Tests ─────────────────────────────────

class TestEventEndpoint:

    def test_track_event_returns_200(self, client):
        with patch('routers.events._save_event_to_mongo', new_callable=AsyncMock):
            response = client.post("/events/track", json={
                "user_id": "user-uuid-123",
                "session_id": "sess-abc-123",
                "product_id": "prod-uuid-1",
                "event_type": "product_view",
            })
            assert response.status_code == 200

    def test_track_event_response_structure(self, client):
        with patch('routers.events._save_event_to_mongo', new_callable=AsyncMock):
            data = client.post("/events/track", json={
                "session_id": "sess-abc-123",
                "event_type": "page_view",
            }).json()
            assert data["status"] == "ok"

    def test_track_event_missing_session_id_fails(self, client):
        response = client.post("/events/track", json={
            "event_type": "product_view",
            # Missing session_id
        })
        assert response.status_code == 422


# ─── Admin Endpoint Tests ─────────────────────────────────

class TestAdminEndpoints:

    def test_engine_info_returns_200(self, client):
        response = client.get("/admin/engine/info")
        assert response.status_code == 200

    def test_engine_info_structure(self, client):
        data = client.get("/admin/engine/info").json()
        assert data["loaded"] is True
        assert "weights" in data

    def test_cache_stats_returns_200(self, client):
        response = client.get("/admin/cache/stats")
        assert response.status_code == 200

    def test_cache_flush_returns_200(self, client):
        response = client.delete("/admin/cache/flush")
        assert response.status_code == 200

    def test_retrain_conflict_when_training(self, client):
        import main
        main.app_state.is_training = True
        response = client.post("/admin/retrain")
        assert response.status_code == 409
        main.app_state.is_training = False

    def test_update_weights_returns_200(self, client):
        response = client.put(
            "/admin/engine/weights",
            params={"cf_weight": 0.6, "cb_weight": 0.3, "ncf_weight": 0.1},
        )
        assert response.status_code == 200


# ─── Metrics Endpoint Tests ───────────────────────────────

class TestMetricsEndpoint:

    def test_metrics_returns_200(self, client):
        response = client.get("/metrics")
        assert response.status_code == 200

    def test_metrics_structure(self, client):
        data = client.get("/metrics").json()
        assert "ml_service_up" in data
        assert "models_loaded" in data
        assert data["ml_service_up"] == 1
