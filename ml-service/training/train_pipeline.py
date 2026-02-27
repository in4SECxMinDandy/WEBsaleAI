# ============================================================
# Training Pipeline — ML-Ecommerce
# Trains CF (ALS) + CB (TF-IDF) + NCF (Neural CF) models
# with MLflow experiment tracking
# ============================================================

import os
import asyncio
from datetime import datetime, timedelta
from typing import Any, Optional

import pandas as pd
import mlflow
import mlflow.sklearn
from loguru import logger
from sqlalchemy import create_engine

from models.collaborative import CollaborativeModel
from models.content_based import ContentBasedModel
from models.ncf import NCFTrainer
from evaluation.metrics import evaluate_recommendations


async def run_training_pipeline(config: dict[str, Any], settings: Any) -> dict[str, float]:
    """Full training pipeline — runs in a thread pool to avoid blocking the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_train, config, settings)


def _sync_train(config: dict[str, Any], settings: Any) -> dict[str, float]:
    """
    Synchronous training function executed in a background thread.

    Steps:
    1. Load events + products from PostgreSQL
    2. Time-based train/test split
    3. Train CF (ALS)
    4. Train CB (TF-IDF)
    5. Train NCF (optional, requires enough data)
    6. Evaluate all models
    7. Save artifacts + log to MLflow
    8. Persist model metadata to DB
    """
    logger.info("🚀 Starting training pipeline...")

    # ─── MLflow Setup ─────────────────────────────────────────
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
            "ncf_epochs": config.get("ncf_epochs", 20),
            "ncf_embed_dim": config.get("ncf_embed_dim", 64),
        })

        # ─── Train-Test Split (time-based) ────────────────────
        metrics: dict[str, float] = {}

        if n_events > 100:
            split_date = events_df['created_at'].quantile(0.8)
            train_events = events_df[events_df['created_at'] <= split_date]
            test_events = events_df[events_df['created_at'] > split_date]
            logger.info(f"Train: {len(train_events)} events | Test: {len(test_events)} events")
        else:
            train_events = events_df
            test_events = pd.DataFrame()

        os.makedirs(settings.MODEL_DIR, exist_ok=True)

        # ─── Train Collaborative Filtering (ALS) ──────────────
        logger.info("🏋️ Training Collaborative Filtering (ALS)...")
        cf_model = CollaborativeModel(
            factors=config.get("cf_factors", 128),
            iterations=config.get("cf_iterations", 30),
        )

        if n_events > 10:
            cf_model.fit(train_events)
        else:
            logger.warning("⚠️ Not enough events for CF training, skipping fit...")

        cf_path = os.path.join(settings.MODEL_DIR, "cf_model.pkl")
        cf_model.save(cf_path)
        mlflow.log_artifact(cf_path)
        logger.info(f"✅ CF model saved → {cf_path}")

        # ─── Train Content-Based (TF-IDF) ─────────────────────
        logger.info("🏋️ Training Content-Based (TF-IDF)...")
        cb_model = ContentBasedModel()

        if n_products > 0:
            cb_model.fit(products_df)
        else:
            logger.warning("⚠️ No products found for CB training")

        cb_path = os.path.join(settings.MODEL_DIR, "cb_model.pkl")
        cb_model.save(cb_path)
        mlflow.log_artifact(cb_path)
        logger.info(f"✅ CB model saved → {cb_path}")

        # ─── Train NCF (Neural Collaborative Filtering) ───────
        ncf_model = _train_ncf(
            events_df=train_events,
            cf_model=cf_model,
            config=config,
            settings=settings,
        )

        # ─── Evaluate Models ──────────────────────────────────
        if not test_events.empty and n_events > 100:
            logger.info("📊 Evaluating CF model...")
            try:
                cf_metrics = evaluate_recommendations(cf_model, test_events, k=10)
                metrics.update(cf_metrics)
                mlflow.log_metrics({f"cf_{k}": v for k, v in cf_metrics.items()})
                logger.info(f"📈 CF Metrics: {cf_metrics}")
            except Exception as e:
                logger.warning(f"CF evaluation failed: {e}")

            if ncf_model is not None:
                logger.info("📊 Evaluating NCF model...")
                try:
                    ncf_metrics = _evaluate_ncf(ncf_model, test_events, k=10)
                    metrics.update({f"ncf_{k}": v for k, v in ncf_metrics.items()})
                    mlflow.log_metrics({f"ncf_{k}": v for k, v in ncf_metrics.items()})
                    logger.info(f"📈 NCF Metrics: {ncf_metrics}")
                except Exception as e:
                    logger.warning(f"NCF evaluation failed: {e}")

        # ─── Save Model Metadata to DB ────────────────────────
        run_id = mlflow.active_run().info.run_id
        _save_model_to_db(settings, run_id, metrics)

        logger.info("✅ Training pipeline complete!")
        return metrics


def _train_ncf(
    events_df: pd.DataFrame,
    cf_model: CollaborativeModel,
    config: dict[str, Any],
    settings: Any,
) -> Optional['NCFTrainer']:
    """
    Train NCF model using the same user/item index as CF model.
    Requires at least 50 events to be meaningful.
    Returns None if training is skipped.
    """

    n_events = len(events_df)
    if n_events < 50:
        logger.warning(f"⚠️ Only {n_events} events — skipping NCF training (need ≥ 50)")
        return None

    if not cf_model.user_index or not cf_model.item_index:
        logger.warning("⚠️ CF model has no user/item index — skipping NCF training")
        return None

    logger.info("🧠 Training Neural Collaborative Filtering (NCF)...")

    try:
        n_users = len(cf_model.user_index)
        n_items = len(cf_model.item_index)

        ncf_trainer = NCFTrainer(
            n_users=n_users,
            n_items=n_items,
            embed_dim=config.get("ncf_embed_dim", 64),
            lr=config.get("ncf_lr", 0.001),
            device=config.get("ncf_device", "cpu"),
        )

        # Share the same user/item mappings as CF model for consistency
        ncf_trainer.user_index = cf_model.user_index.copy()
        ncf_trainer.item_index = cf_model.item_index.copy()
        ncf_trainer.user_map = cf_model.user_map.copy()
        ncf_trainer.item_map = cf_model.item_map.copy()

        # Build interaction list: (user_idx, item_idx) pairs
        interactions: list[tuple[int, int]] = []
        for _, row in events_df.iterrows():
            uid = str(row['user_id'])
            pid = str(row['product_id'])
            if uid in ncf_trainer.user_index and pid in ncf_trainer.item_index:
                interactions.append((
                    ncf_trainer.user_index[uid],
                    ncf_trainer.item_index[pid],
                ))

        if len(interactions) < 20:
            logger.warning(f"⚠️ Only {len(interactions)} valid interactions — skipping NCF")
            return None

        logger.info(f"NCF training on {len(interactions)} interactions...")
        losses = ncf_trainer.train(
            interactions=interactions,
            epochs=config.get("ncf_epochs", 20),
            batch_size=config.get("ncf_batch_size", 1024),
        )

        # Log training loss curve
        for epoch, loss in enumerate(losses):
            mlflow.log_metric("ncf_train_loss", loss, step=epoch)

        ncf_path = os.path.join(settings.MODEL_DIR, "ncf_model.pt")
        ncf_trainer.save(ncf_path)
        mlflow.log_artifact(ncf_path)
        logger.info(f"✅ NCF model saved → {ncf_path}")

        return ncf_trainer

    except Exception as e:
        logger.error(f"❌ NCF training failed: {e}")
        return None


def _evaluate_ncf(
    ncf_model: 'NCFTrainer',
    test_events: pd.DataFrame,
    k: int = 10,
) -> dict[str, float]:
    """Evaluate NCF model using the same Precision/Recall/NDCG metrics as CF."""
    from evaluation.metrics import precision_at_k, recall_at_k, ndcg_at_k
    import numpy as np

    test_users = test_events['user_id'].unique()
    if len(test_users) > 500:
        test_users = np.random.choice(test_users, 500, replace=False)

    precisions, recalls, ndcgs = [], [], []

    for user_id in test_users:
        user_test = test_events[test_events['user_id'] == user_id]
        relevant_items = set(user_test['product_id'].astype(str).tolist())
        if not relevant_items:
            continue

        recs = ncf_model.recommend(str(user_id), top_n=k * 2)
        if not recs:
            continue

        recommended_ids = [r['product_id'] for r in recs]
        precisions.append(precision_at_k(recommended_ids, relevant_items, k))
        recalls.append(recall_at_k(recommended_ids, relevant_items, k))
        ndcgs.append(ndcg_at_k(recommended_ids, relevant_items, k))

    if not precisions:
        return {}

    return {
        f"precision_at_{k}": float(np.mean(precisions)),
        f"recall_at_{k}": float(np.mean(recalls)),
        f"ndcg_at_{k}": float(np.mean(ndcgs)),
        "n_evaluated_users": len(precisions),
    }


def _save_model_to_db(settings: Any, run_id: str, metrics: dict) -> None:
    """Persist model metadata to PostgreSQL ml_models table."""
    try:
        from sqlalchemy import create_engine, text
        import json as _json

        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Deactivate all previous production models
            conn.execute(text("UPDATE ml_models SET is_production = false"))
            # Insert new production model record
            conn.execute(text("""
                INSERT INTO ml_models (name, version, strategy, mlflow_run_id, metrics, is_production, trained_at)
                VALUES (:name, :version, :strategy, :run_id, :metrics::jsonb, true, NOW())
            """), {
                "name": "HybridEngine",
                "version": datetime.now().strftime("%Y%m%d.%H%M"),
                "strategy": "hybrid",
                "run_id": run_id,
                "metrics": _json.dumps(metrics),
            })
            conn.commit()
        engine.dispose()
        logger.info("✅ Model metadata saved to database")
    except Exception as e:
        logger.error(f"❌ Failed to save model metadata to DB: {e}")
