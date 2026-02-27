# ============================================================
# Training Pipeline — ML-Ecommerce
# Trains CF (ALS) + CB (TF-IDF) models with MLflow tracking
# ============================================================

import os
import asyncio
from datetime import datetime, timedelta
from typing import Any

import pandas as pd
import mlflow
import mlflow.sklearn
from loguru import logger
from sqlalchemy import create_engine

from models.collaborative import CollaborativeModel
from models.content_based import ContentBasedModel
from evaluation.metrics import evaluate_recommendations


async def run_training_pipeline(config: dict[str, Any], settings: Any) -> dict[str, float]:
    """Full training pipeline with MLflow tracking."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_train, config, settings)


def _sync_train(config: dict[str, Any], settings: Any) -> dict[str, float]:
    """Synchronous training function (runs in thread pool)."""
    logger.info("🚀 Starting training pipeline...")

    # Setup MLflow
    mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    mlflow.set_experiment("recommendation-system")

    run_name = f"train-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    with mlflow.start_run(run_name=run_name):
        # ─── Load Data ────────────────────────────────────────
        logger.info("📥 Loading data from PostgreSQL...")
        engine = create_engine(settings.DATABASE_URL)

        cutoff_date = datetime.now() - timedelta(days=180)

        events_df = pd.read_sql(f"""
            SELECT
                user_id::text,
                product_id::text,
                category_id::text,
                event_type,
                created_at
            FROM user_events
            WHERE created_at > '{cutoff_date.isoformat()}'
              AND user_id IS NOT NULL
              AND product_id IS NOT NULL
            ORDER BY created_at
        """, engine)

        products_df = pd.read_sql("""
            SELECT
                p.id::text,
                p.name,
                p.description,
                p.category_id::text,
                p.tags,
                p.base_price,
                p.purchase_count,
                p.view_count,
                c.name as category_name,
                b.name as brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.is_active = true
        """, engine)

        engine.dispose()

        n_events = len(events_df)
        n_products = len(products_df)
        n_users = events_df['user_id'].nunique() if n_events > 0 else 0

        logger.info(f"📊 Data: {n_events} events, {n_products} products, {n_users} users")

        mlflow.log_params({
            "n_events": n_events,
            "n_products": n_products,
            "n_users": n_users,
            "cf_factors": config.get("cf_factors", 128),
            "cf_iterations": config.get("cf_iterations", 30),
        })

        # ─── Train-Test Split (time-based) ────────────────────
        metrics: dict[str, float] = {}

        if n_events > 100:
            split_date = events_df['created_at'].quantile(0.8)
            train_events = events_df[events_df['created_at'] <= split_date]
            test_events = events_df[events_df['created_at'] > split_date]
            logger.info(f"Train: {len(train_events)} events, Test: {len(test_events)} events")
        else:
            train_events = events_df
            test_events = pd.DataFrame()

        # ─── Train Collaborative Filtering ────────────────────
        logger.info("🏋️ Training Collaborative Filtering (ALS)...")
        cf_model = CollaborativeModel(
            factors=config.get("cf_factors", 128),
            iterations=config.get("cf_iterations", 30),
        )

        if n_events > 10:
            cf_model.fit(train_events)
        else:
            logger.warning("Not enough events for CF training, skipping...")

        cf_path = os.path.join(settings.MODEL_DIR, "cf_model.pkl")
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        cf_model.save(cf_path)
        mlflow.log_artifact(cf_path)

        # ─── Train Content-Based ──────────────────────────────
        logger.info("🏋️ Training Content-Based (TF-IDF)...")
        cb_model = ContentBasedModel()

        if n_products > 0:
            cb_model.fit(products_df)
        else:
            logger.warning("No products found for CB training")

        cb_path = os.path.join(settings.MODEL_DIR, "cb_model.pkl")
        cb_model.save(cb_path)
        mlflow.log_artifact(cb_path)

        # ─── Evaluate ─────────────────────────────────────────
        if not test_events.empty and n_events > 100:
            logger.info("📊 Evaluating models...")
            try:
                metrics = evaluate_recommendations(cf_model, test_events, k=10)
                mlflow.log_metrics(metrics)
                logger.info(f"📈 Metrics: {metrics}")
            except Exception as e:
                logger.warning(f"Evaluation failed: {e}")
                metrics = {}

        # ─── Save to DB ───────────────────────────────────────
        run_id = mlflow.active_run().info.run_id
        _save_model_to_db(settings, run_id, metrics)

        logger.info("✅ Training pipeline complete!")
        return metrics


def _save_model_to_db(settings: Any, run_id: str, metrics: dict) -> None:
    """Save model metadata to PostgreSQL."""
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Deactivate previous production models
            conn.execute(text("UPDATE ml_models SET is_production = false"))
            # Insert new model
            conn.execute(text("""
                INSERT INTO ml_models (name, version, strategy, mlflow_run_id, metrics, is_production, trained_at)
                VALUES (:name, :version, :strategy, :run_id, :metrics::jsonb, true, NOW())
            """), {
                "name": "HybridEngine",
                "version": datetime.now().strftime("%Y%m%d.%H%M"),
                "strategy": "hybrid",
                "run_id": run_id,
                "metrics": str(metrics).replace("'", '"'),
            })
            conn.commit()
        engine.dispose()
        logger.info("✅ Model metadata saved to database")
    except Exception as e:
        logger.error(f"Failed to save model to DB: {e}")
