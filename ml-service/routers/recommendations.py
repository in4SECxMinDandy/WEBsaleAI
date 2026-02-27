# ============================================================
# Recommendations Router — FastAPI
# Endpoints: /recommend, /similar, /trending
# ============================================================

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from pydantic import BaseModel, Field

from config import settings

router = APIRouter(prefix="/recommend", tags=["Recommendations"])


# ─── Pydantic Schemas ─────────────────────────────────────

class RecommendRequest(BaseModel):
    user_id: str = Field(..., description="User UUID or 'anonymous'")
    category_id: Optional[str] = Field(None, description="Filter by category UUID")
    limit: int = Field(20, ge=1, le=100, description="Number of recommendations")
    strategy: str = Field(
        "hybrid",
        description="Strategy: 'hybrid' | 'cf' | 'cb' | 'ncf' | 'popular'",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "category_id": None,
                "limit": 20,
                "strategy": "hybrid",
            }
        }


class RecommendResponse(BaseModel):
    user_id: str
    strategy: str
    recommendations: list[dict]
    count: int
    cached: bool = False


# ─── Dependency: get engine from app state ────────────────

def _get_engine():
    """Import app_state lazily to avoid circular imports."""
    from main import app_state
    return app_state.engine


# ─── POST /recommend ──────────────────────────────────────

@router.post("", response_model=RecommendResponse, summary="Get personalized recommendations")
async def get_recommendations(req: RecommendRequest):
    """
    Get personalized product recommendations for a user.

    - **hybrid**: CF + CB + NCF weighted merge (default)
    - **cf**: Collaborative Filtering (ALS) only
    - **cb**: Content-Based (TF-IDF) only
    - **ncf**: Neural Collaborative Filtering only
    - **popular**: Popularity-based (no personalization)
    """
    engine = _get_engine()

    if engine is None:
        return RecommendResponse(
            user_id=req.user_id,
            strategy="fallback",
            recommendations=[],
            count=0,
        )

    try:
        recs = engine.recommend(
            user_id=req.user_id,
            category_id=req.category_id,
            n=min(req.limit, settings.MAX_LIMIT),
            strategy=req.strategy,
        )
        return RecommendResponse(
            user_id=req.user_id,
            strategy=req.strategy,
            recommendations=recs,
            count=len(recs),
        )
    except Exception as e:
        logger.error(f"Recommendation error for user '{req.user_id}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /recommend/{user_id} ─────────────────────────────

@router.get(
    "/{user_id}",
    response_model=RecommendResponse,
    summary="Get recommendations (GET version)",
)
async def get_recommendations_get(
    user_id: str,
    category_id: Optional[str] = Query(None, description="Filter by category UUID"),
    limit: int = Query(20, ge=1, le=100),
    strategy: str = Query("hybrid"),
):
    """GET version of the recommendations endpoint — convenient for browser/curl testing."""
    req = RecommendRequest(
        user_id=user_id,
        category_id=category_id,
        limit=limit,
        strategy=strategy,
    )
    return await get_recommendations(req)


# ─── GET /similar/{product_id} ────────────────────────────

similar_router = APIRouter(prefix="/similar", tags=["Recommendations"])


@similar_router.get(
    "/{product_id}",
    summary="Get similar products",
)
async def get_similar_products(
    product_id: str,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get products similar to a given product.
    Uses CF item factors + CB content similarity (merged).
    """
    engine = _get_engine()

    if engine is None:
        return {"product_id": product_id, "similar": [], "count": 0}

    try:
        similar = engine.get_similar(product_id, n=limit)
        return {
            "product_id": product_id,
            "similar": similar,
            "count": len(similar),
        }
    except Exception as e:
        logger.error(f"Similar products error for '{product_id}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /trending ────────────────────────────────────────

trending_router = APIRouter(prefix="/trending", tags=["Recommendations"])


@trending_router.get("", summary="Get trending/popular products")
async def get_trending(
    category_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get trending/popular products.
    Uses purchase_count from the CB model's product dataframe.
    """
    engine = _get_engine()

    if engine is None:
        return {"recommendations": [], "strategy": "popular", "count": 0}

    recs = engine.cb.recommend_for_category(category_id, limit)
    return {
        "recommendations": recs,
        "strategy": "popular",
        "count": len(recs),
    }
