# ============================================================
# ML Service — FastAPI Application Entry Point
# Hybrid Recommendation Engine: CF (ALS) + CB (TF-IDF) + NCF
# ============================================================

import os
from contextlib import asynccontextmanager

import redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from config import settings
from models.hybrid import HybridEngine
from models.collaborative import CollaborativeModel
from models.content_based import ContentBasedModel
from models.ncf import NCFTrainer


# ─── Shared Application State ─────────────────────────────

class AppState:
    """Singleton container for shared ML service state."""
    engine: HybridEngine | None = None
    redis_client: redis.Redis | None = None
    is_training: bool = False


app_state = AppState()


# ─── Lifespan (Startup / Shutdown) ────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    - Startup: connect Redis, load ML models
    - Shutdown: close Redis connection
    """
    logger.info("🚀 Starting ML Service...")

    # ── Connect Redis ──────────────────────────────────────
    if settings.REDIS_PASSWORD:
        redis_url = (
            f"redis://:{settings.REDIS_PASSWORD}@"
            f"{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
        )
    else:
        redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

    app_state.redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    try:
        app_state.redis_client.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.warning(f"⚠️ Redis not available: {e}. Caching disabled.")

    # ── Load ML Models ─────────────────────────────────────
    cf_path = settings.CF_MODEL_PATH
    cb_path = settings.CB_MODEL_PATH
    ncf_path = settings.NCF_MODEL_PATH

    if os.path.exists(cf_path) and os.path.exists(cb_path):
        try:
            cf_model = CollaborativeModel.load(cf_path)
            cb_model = ContentBasedModel.load(cb_path)

            # NCF is optional — engine degrades gracefully without it
            ncf_model = None
            if os.path.exists(ncf_path):
                try:
                    ncf_model = NCFTrainer.load(ncf_path)
                    logger.info("✅ NCF model loaded")
                except Exception as e:
                    logger.warning(f"⚠️ Could not load NCF model: {e}")
            else:
                logger.info("ℹ️ NCF model not found — running CF+CB only")

            app_state.engine = HybridEngine(
                cf_model=cf_model,
                cb_model=cb_model,
                redis_client=app_state.redis_client,
                ncf_model=ncf_model,
                cf_weight=settings.CF_WEIGHT,
                cb_weight=settings.CB_WEIGHT,
                ncf_weight=settings.NCF_WEIGHT,
            )
            logger.info(f"✅ HybridEngine loaded — {app_state.engine.get_info()}")
        except Exception as e:
            logger.warning(f"⚠️ Could not load models: {e}. Running in stub mode.")
    else:
        logger.warning(
            "⚠️ Model files not found. "
            "Run POST /admin/retrain to train models first."
        )

    yield  # ← Application runs here

    # ── Shutdown ───────────────────────────────────────────
    logger.info("👋 Shutting down ML Service...")
    if app_state.redis_client:
        app_state.redis_client.close()


# ─── FastAPI Application ───────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "🤖 **ML-Ecommerce Recommendation Engine**\n\n"
        "Hybrid system combining:\n"
        "- **CF** (Collaborative Filtering via ALS)\n"
        "- **CB** (Content-Based via TF-IDF)\n"
        "- **NCF** (Neural Collaborative Filtering)\n\n"
        "Cold-start fallback to popularity-based recommendations."
    ),
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


# ─── Include Routers ──────────────────────────────────────

from routers.recommendations import router as rec_router
from routers.recommendations import similar_router, trending_router
from routers.events import router as events_router
from routers.admin import router as admin_router

app.include_router(rec_router)
app.include_router(similar_router)
app.include_router(trending_router)
app.include_router(events_router)
app.include_router(admin_router)


# ─── Health Check ─────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Service health check.
    Returns status of Redis connection, model loading, and training state.
    """
    redis_ok = False
    if app_state.redis_client:
        try:
            app_state.redis_client.ping()
            redis_ok = True
        except Exception:
            pass

    engine_info = app_state.engine.get_info() if app_state.engine else None

    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "models_loaded": app_state.engine is not None,
        "redis_connected": redis_ok,
        "is_training": app_state.is_training,
        "engine": engine_info,
    }


# ─── Prometheus Metrics ───────────────────────────────────

@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """
    Basic Prometheus-compatible metrics endpoint.
    For full metrics, integrate prometheus-fastapi-instrumentator.
    """
    return {
        "ml_service_up": 1,
        "models_loaded": 1 if app_state.engine else 0,
        "ncf_loaded": 1 if (app_state.engine and app_state.engine.ncf) else 0,
        "is_training": 1 if app_state.is_training else 0,
    }
