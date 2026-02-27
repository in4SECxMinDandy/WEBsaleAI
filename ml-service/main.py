# ============================================================
# ML Service — FastAPI Main Application
# Hybrid Recommendation Engine: CF (ALS) + CB (TF-IDF) + NCF
# ============================================================

import os
import json
from contextlib import asynccontextmanager
from typing import Optional

import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger

from config import settings
from models.hybrid import HybridEngine
from models.collaborative import CollaborativeModel
from models.content_based import ContentBasedModel


# ─── App State ────────────────────────────────────────────

class AppState:
    engine: HybridEngine | None = None
    redis_client: redis.Redis | None = None
    is_training: bool = False


app_state = AppState()


# ─── Lifespan ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown."""
    logger.info("🚀 Starting ML Service...")

    # Connect Redis
    redis_url = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    if not settings.REDIS_PASSWORD:
        redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

    app_state.redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    try:
        app_state.redis_client.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.warning(f"⚠️ Redis not available: {e}")

    # Load ML models
    cf_path = settings.CF_MODEL_PATH
    cb_path = settings.CB_MODEL_PATH

    if os.path.exists(cf_path) and os.path.exists(cb_path):
        try:
            cf_model = CollaborativeModel.load(cf_path)
            cb_model = ContentBasedModel.load(cb_path)
            app_state.engine = HybridEngine(
                cf_model=cf_model,
                cb_model=cb_model,
                redis_client=app_state.redis_client,
                cf_weight=settings.CF_WEIGHT,
                cb_weight=settings.CB_WEIGHT,
            )
            logger.info("✅ ML models loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Could not load models: {e}. Using stub mode.")
    else:
        logger.warning("⚠️ Model files not found. Run training first: POST /admin/retrain")

    yield

    logger.info("👋 Shutting down ML Service...")
    if app_state.redis_client:
        app_state.redis_client.close()


# ─── FastAPI App ──────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="🤖 Hệ thống gợi ý sản phẩm thông minh — Hybrid CF + CB + NCF",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ──────────────────────────────────────

class RecommendRequest(BaseModel):
    user_id: str
    category_id: Optional[str] = None
    limit: int = 20
    strategy: str = "hybrid"  # "cf", "cb", "hybrid", "popular"


class EventRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    event_type: str
    event_data: Optional[dict] = None


class RetrainConfig(BaseModel):
    cf_factors: int = 128
    cf_iterations: int = 30
    ncf_epochs: int = 20
    cf_weight: float = 0.6
    cb_weight: float = 0.4


# ─── Health & Status ──────────────────────────────────────

@app.get("/health")
async def health_check():
    redis_ok = False
    if app_state.redis_client:
        try:
            app_state.redis_client.ping()
            redis_ok = True
        except Exception:
            pass

    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "models_loaded": app_state.engine is not None,
        "redis_connected": redis_ok,
        "is_training": app_state.is_training,
    }


# ─── Recommendation Endpoints ─────────────────────────────

@app.post("/recommend")
async def get_recommendations(req: RecommendRequest):
    """Get personalized recommendations for a user."""
    if app_state.engine is None:
        # Fallback: return empty list (frontend will show popular products)
        return {
            "user_id": req.user_id,
            "strategy": "fallback",
            "recommendations": [],
            "message": "Models not loaded yet",
        }

    try:
        recs = app_state.engine.recommend(
            user_id=req.user_id,
            category_id=req.category_id,
            n=min(req.limit, settings.MAX_LIMIT),
            strategy=req.strategy,
        )
        return {
            "user_id": req.user_id,
            "strategy": req.strategy,
            "recommendations": recs,
            "count": len(recs),
        }
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend/{user_id}")
async def get_recommendations_get(
    user_id: str,
    category_id: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    strategy: str = Query("hybrid"),
):
    """GET version of recommendations endpoint."""
    req = RecommendRequest(
        user_id=user_id,
        category_id=category_id,
        limit=limit,
        strategy=strategy,
    )
    return await get_recommendations(req)


@app.get("/similar/{product_id}")
async def get_similar_products(
    product_id: str,
    limit: int = Query(10, le=50),
):
    """Get similar products for a given product."""
    if app_state.engine is None:
        return {"product_id": product_id, "similar": []}

    try:
        similar = app_state.engine.get_similar(product_id, n=limit)
        return {"product_id": product_id, "similar": similar, "count": len(similar)}
    except Exception as e:
        logger.error(f"Similar products error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trending")
async def get_trending(
    category_id: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
):
    """Get trending/popular products."""
    if app_state.engine is None:
        return {"recommendations": [], "strategy": "popular"}

    recs = app_state.engine.cb.recommend_for_category(category_id, limit)
    return {"recommendations": recs, "strategy": "popular", "count": len(recs)}


# ─── Event Tracking ───────────────────────────────────────

@app.post("/events/track")
async def track_event(req: EventRequest, background_tasks: BackgroundTasks):
    """Receive user behavior events for real-time model updates."""
    background_tasks.add_task(_save_event_async, req.dict())

    # Invalidate user's recommendation cache
    if req.user_id and app_state.engine:
        background_tasks.add_task(
            app_state.engine.invalidate_cache, req.user_id
        )

    return {"status": "ok", "message": "Event tracked"}


async def _save_event_async(event_data: dict) -> None:
    """Save event to MongoDB asynchronously."""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB]
        await db.user_events.insert_one({
            **event_data,
            "created_at": __import__('datetime').datetime.utcnow(),
        })
        client.close()
    except Exception as e:
        logger.error(f"Event save error: {e}")


# ─── Admin Endpoints ──────────────────────────────────────

@app.post("/admin/retrain")
async def trigger_retrain(
    config: RetrainConfig = RetrainConfig(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Trigger model retraining."""
    if app_state.is_training:
        raise HTTPException(status_code=409, detail="Training already in progress")

    background_tasks.add_task(_run_training, config)
    return {"status": "training_started", "config": config.dict()}


async def _run_training(config: RetrainConfig) -> None:
    """Run the full training pipeline."""
    app_state.is_training = True
    try:
        from training.train_pipeline import run_training_pipeline
        await run_training_pipeline(config.dict(), settings)

        # Reload models after training
        if os.path.exists(settings.CF_MODEL_PATH) and os.path.exists(settings.CB_MODEL_PATH):
            cf_model = CollaborativeModel.load(settings.CF_MODEL_PATH)
            cb_model = ContentBasedModel.load(settings.CB_MODEL_PATH)
            app_state.engine = HybridEngine(
                cf_model=cf_model,
                cb_model=cb_model,
                redis_client=app_state.redis_client,
                cf_weight=config.cf_weight,
                cb_weight=config.cb_weight,
            )
            logger.info("✅ Models reloaded after training")
    except Exception as e:
        logger.error(f"Training error: {e}")
    finally:
        app_state.is_training = False


@app.get("/admin/models")
async def list_models():
    """List available models from MLflow."""
    try:
        import mlflow
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        client = mlflow.tracking.MlflowClient()
        experiments = client.search_experiments()
        runs = []
        for exp in experiments:
            exp_runs = client.search_runs(
                experiment_ids=[exp.experiment_id],
                order_by=["start_time DESC"],
                max_results=5,
            )
            runs.extend([{
                "run_id": r.info.run_id,
                "experiment": exp.name,
                "status": r.info.status,
                "metrics": r.data.metrics,
                "start_time": r.info.start_time,
            } for r in exp_runs])
        return {"models": runs}
    except Exception as e:
        logger.warning(f"MLflow unavailable: {e}")
        return {"models": [], "error": str(e)}


@app.get("/admin/cache/stats")
async def cache_stats():
    """Get Redis cache statistics."""
    if not app_state.redis_client:
        return {"error": "Redis not connected"}
    try:
        info = app_state.redis_client.info()
        rec_keys = len(app_state.redis_client.keys("rec:*"))
        similar_keys = len(app_state.redis_client.keys("similar:*"))
        return {
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "recommendation_cache_keys": rec_keys,
            "similar_cache_keys": similar_keys,
        }
    except Exception as e:
        return {"error": str(e)}


@app.delete("/admin/cache/flush")
async def flush_cache():
    """Flush all recommendation caches."""
    if not app_state.redis_client:
        raise HTTPException(status_code=503, detail="Redis not connected")
    try:
        keys = app_state.redis_client.keys("rec:*") + app_state.redis_client.keys("similar:*")
        if keys:
            app_state.redis_client.delete(*keys)
        return {"status": "ok", "deleted_keys": len(keys)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Metrics Endpoint (Prometheus) ────────────────────────

@app.get("/metrics")
async def metrics():
    """Basic metrics for Prometheus scraping."""
    return {
        "ml_service_up": 1,
        "models_loaded": 1 if app_state.engine else 0,
        "is_training": 1 if app_state.is_training else 0,
    }
