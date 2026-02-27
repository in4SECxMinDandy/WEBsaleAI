# ============================================================
# Events Router — FastAPI
# Endpoint: POST /events/track
# Receives user behavior events for real-time model updates
# ============================================================

from typing import Optional

from fastapi import APIRouter, BackgroundTasks
from loguru import logger
from pydantic import BaseModel, Field

from config import settings

router = APIRouter(prefix="/events", tags=["Event Tracking"])


# ─── Pydantic Schemas ─────────────────────────────────────

class EventRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="User UUID (null for anonymous)")
    session_id: str = Field(..., description="Browser/app session ID")
    product_id: Optional[str] = Field(None, description="Product UUID")
    category_id: Optional[str] = Field(None, description="Category UUID")
    event_type: str = Field(
        ...,
        description=(
            "Event type: page_view | product_view | search | add_to_cart | "
            "remove_from_cart | wishlist | purchase | review | click_recommendation"
        ),
    )
    event_data: Optional[dict] = Field(None, description="Additional event metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "session_id": "sess_abc123",
                "product_id": "prod-uuid-here",
                "event_type": "product_view",
                "event_data": {"source": "recommendation"},
            }
        }


# ─── POST /events/track ───────────────────────────────────

@router.post("/track", summary="Track a user behavior event")
async def track_event(req: EventRequest, background_tasks: BackgroundTasks):
    """
    Receive and persist a user behavior event.

    - Saves to MongoDB asynchronously (non-blocking)
    - Invalidates the user's recommendation cache if applicable
    - Used as training data for the next model retraining cycle
    """
    background_tasks.add_task(_save_event_to_mongo, req.dict())

    # Invalidate user's recommendation cache on high-signal events
    high_signal_events = {'purchase', 'add_to_cart', 'wishlist', 'review'}
    if req.user_id and req.event_type in high_signal_events:
        from main import app_state
        if app_state.engine:
            background_tasks.add_task(app_state.engine.invalidate_cache, req.user_id)

    return {"status": "ok", "message": "Event tracked"}


async def _save_event_to_mongo(event_data: dict) -> None:
    """Persist event document to MongoDB asynchronously."""
    try:
        import datetime
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB]
        await db.user_events.insert_one({
            **event_data,
            "created_at": datetime.datetime.utcnow(),
        })
        client.close()
    except Exception as e:
        logger.error(f"MongoDB event save error: {e}")
