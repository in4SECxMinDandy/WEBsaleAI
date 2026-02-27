# ============================================================
# Admin Router — FastAPI
# Endpoints: /admin/retrain, /admin/models, /admin/cache/*
# ============================================================

import os

from fastapi import APIRouter, BackgroundTasks, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

from config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Pydantic Schemas ─────────────────────────────────────

class RetrainConfig(BaseModel):
    cf_factors: int = Field(128, ge=16, le=512, description="ALS latent factors")
    cf_iterations: int = Field(30, ge=5, le=100, description="ALS training iterations")
    ncf_epochs: int = Field(20, ge=1, le=200, description="NCF training epochs")
    ncf_embed_dim: int = Field(64, ge=16, le=256, description="NCF embedding dimension")
    ncf_lr: float = Field(0.001, gt=0, description="NCF learning rate")
    ncf_batch_size: int = Field(1024, ge=64, le=8192, description="NCF batch size")
    cf_weight: float = Field(0.5, ge=0.0, le=1.0, description="CF weight in hybrid")
    cb_weight: float = Field(0.3, ge=0.0, le=1.0, description="CB weight in hybrid")
    ncf_weight: float = Field(0.2, ge=0.0, le=1.0, description="NCF weight in hybrid")

    class Config:
        json_schema_extra = {
            "example": {
                "cf_factors": 128,
                "cf_iterations": 30,
                "ncf_epochs": 20,
                "ncf_embed_dim": 64,
                "cf_weight": 0.5,
                "cb_weight": 0.3,
                "ncf_weight": 0.2,
            }
        }


# ─── POST /admin/retrain ──────────────────────────────────

@router.post("/retrain", summary="Trigger model retraining")
async def trigger_retrain(
    config: RetrainConfig = RetrainConfig(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Trigger a full model retraining pipeline in the background.
    Trains CF (ALS) + CB (TF-IDF) + NCF models.
    Returns immediately; check /health for training status.
    """
    from main import app_state

    if app_state.is_training:
        raise HTTPException(status_code=409, detail="Training already in progress")

    background_tasks.add_task(_run_training, config)
    return {
        "status": "training_started",
        "config": config.dict(),
        "message": "Training started in background. Check GET /health for status.",
    }


async def _run_training(config: RetrainConfig) -> None:
    """Execute the full training pipeline and reload models on completion."""
    from main import app_state
    from models.collaborative import CollaborativeModel
    from models.content_based import ContentBasedModel
    from models.ncf import NCFTrainer
    from models.hybrid import HybridEngine

    app_state.is_training = True
    try:
        from training.train_pipeline import run_training_pipeline
        metrics = await run_training_pipeline(config.dict(), settings)
        logger.info(f"Training complete. Metrics: {metrics}")

        # ─── Reload models after training ─────────────────────
        cf_path = settings.CF_MODEL_PATH
        cb_path = settings.CB_MODEL_PATH
        ncf_path = settings.NCF_MODEL_PATH

        if os.path.exists(cf_path) and os.path.exists(cb_path):
            cf_model = CollaborativeModel.load(cf_path)
            cb_model = ContentBasedModel.load(cb_path)

            # Load NCF if available
            ncf_model = None
            if os.path.exists(ncf_path):
                try:
                    ncf_model = NCFTrainer.load(ncf_path)
                    logger.info("✅ NCF model reloaded")
                except Exception as e:
                    logger.warning(f"⚠️ Could not reload NCF model: {e}")

            app_state.engine = HybridEngine(
                cf_model=cf_model,
                cb_model=cb_model,
                redis_client=app_state.redis_client,
                ncf_model=ncf_model,
                cf_weight=config.cf_weight,
                cb_weight=config.cb_weight,
                ncf_weight=config.ncf_weight,
            )
            logger.info("✅ All models reloaded after training")
        else:
            logger.error("❌ Model files not found after training")

    except Exception as e:
        logger.error(f"❌ Training pipeline error: {e}")
    finally:
        app_state.is_training = False


# ─── GET /admin/models ────────────────────────────────────

@router.get("/models", summary="List MLflow experiment runs")
async def list_models():
    """List recent model training runs from MLflow."""
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
                "params": r.data.params,
                "start_time": r.info.start_time,
            } for r in exp_runs])
        return {"models": runs, "count": len(runs)}
    except Exception as e:
        logger.warning(f"MLflow unavailable: {e}")
        return {"models": [], "count": 0, "error": str(e)}


# ─── GET /admin/engine/info ───────────────────────────────

@router.get("/engine/info", summary="Get loaded engine metadata")
async def engine_info():
    """Return metadata about the currently loaded HybridEngine."""
    from main import app_state

    if app_state.engine is None:
        return {"loaded": False, "message": "No engine loaded. Run POST /admin/retrain first."}

    return {"loaded": True, **app_state.engine.get_info()}


# ─── PUT /admin/engine/weights ────────────────────────────

@router.put("/engine/weights", summary="Update hybrid model weights")
async def update_weights(
    cf_weight: float = 0.5,
    cb_weight: float = 0.3,
    ncf_weight: float = 0.2,
):
    """
    Dynamically update the hybrid engine's model weights without retraining.
    Useful for A/B testing different weight configurations.
    """
    from main import app_state

    if app_state.engine is None:
        raise HTTPException(status_code=503, detail="Engine not loaded")

    app_state.engine.update_weights(cf_weight, cb_weight, ncf_weight)
    return {
        "status": "ok",
        "weights": app_state.engine.get_info()["weights"],
    }


# ─── GET /admin/cache/stats ───────────────────────────────

@router.get("/cache/stats", summary="Get Redis cache statistics")
async def cache_stats():
    """Return Redis memory usage and recommendation cache key counts."""
    from main import app_state

    if not app_state.redis_client:
        return {"error": "Redis not connected"}
    try:
        info = app_state.redis_client.info()
        rec_keys = len(app_state.redis_client.keys("rec:*"))
        similar_keys = len(app_state.redis_client.keys("similar:*"))
        cat_keys = len(app_state.redis_client.keys("cat_products:*"))
        return {
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "recommendation_cache_keys": rec_keys,
            "similar_cache_keys": similar_keys,
            "category_cache_keys": cat_keys,
            "total_cache_keys": rec_keys + similar_keys + cat_keys,
        }
    except Exception as e:
        return {"error": str(e)}


# ─── DELETE /admin/cache/flush ────────────────────────────

@router.delete("/cache/flush", summary="Flush all recommendation caches")
async def flush_cache():
    """Delete all recommendation, similar, and category cache keys from Redis."""
    from main import app_state

    if not app_state.redis_client:
        raise HTTPException(status_code=503, detail="Redis not connected")
    try:
        patterns = ["rec:*", "similar:*", "cat_products:*"]
        total_deleted = 0
        for pattern in patterns:
            keys = app_state.redis_client.keys(pattern)
            if keys:
                app_state.redis_client.delete(*keys)
                total_deleted += len(keys)
        return {"status": "ok", "deleted_keys": total_deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
