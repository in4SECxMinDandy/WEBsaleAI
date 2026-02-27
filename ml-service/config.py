# ============================================================
# ML Service Configuration — Pydantic Settings
# ============================================================

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ML Recommendation Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    CACHE_TTL: int = 3600  # 1 hour

    # PostgreSQL
    DATABASE_URL: str = "postgresql://ecom_user:ecom_pass_2024@localhost:5432/ecommerce"

    # MongoDB
    MONGODB_URI: str = "mongodb://mongo_user:mongo_pass_2024@localhost:27017/ecommerce_events?authSource=admin"
    MONGODB_DB: str = "ecommerce_events"

    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"

    # Model paths
    MODEL_DIR: str = "/app/models"
    CF_MODEL_PATH: str = "/app/models/cf_model.pkl"
    CB_MODEL_PATH: str = "/app/models/cb_model.pkl"
    NCF_MODEL_PATH: str = "/app/models/ncf_model.pt"

    # Hybrid weights (CF + CB + NCF must sum to 1.0 — engine normalizes automatically)
    CF_WEIGHT: float = 0.5
    CB_WEIGHT: float = 0.3
    NCF_WEIGHT: float = 0.2

    # Recommendation defaults
    DEFAULT_LIMIT: int = 20
    MAX_LIMIT: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
