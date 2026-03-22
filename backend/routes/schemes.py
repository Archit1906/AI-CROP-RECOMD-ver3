from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from services.schemes_updater import get_schemes, BASE_SCHEMES, mark_expired_schemes, sort_schemes
from datetime import datetime
import asyncio

router = APIRouter()

# Keep schemes in memory — refresh every 6 hours
_cached_schemes = None
_last_fetch     = None

async def refresh_schemes():
    global _cached_schemes, _last_fetch
    _cached_schemes = await get_schemes()
    _last_fetch     = datetime.now()

@router.get("/schemes")
async def get_all_schemes():
    global _cached_schemes, _last_fetch

    # Refresh if cache is old or empty
    if _cached_schemes is None or (
        _last_fetch and (datetime.now() - _last_fetch).seconds > 21600
    ):
        await refresh_schemes()

    # Always recompute expiry status (deadline might have passed)
    fresh = mark_expired_schemes(_cached_schemes or BASE_SCHEMES)
    active  = [s for s in fresh if not s.get("is_expired")]
    expired = [s for s in fresh if s.get("is_expired")]

    return {
        "schemes":       sort_schemes(fresh),
        "total":         len(fresh),
        "active_count":  len(active),
        "expired_count": len(expired),
        "new_count":     sum(1 for s in fresh if s.get("is_new")),
        "last_updated":  _last_fetch.isoformat() if _last_fetch else None
    }

@router.post("/schemes/refresh")
async def force_refresh(background_tasks: BackgroundTasks):
    """Force refresh schemes from live sources"""
    background_tasks.add_task(refresh_schemes)
    return {"message": "Refresh initiated", "status": "ok"}

class FarmerProfile(BaseModel):
    state:       str
    crop:        str = ""
    land_acres:  float = 1.0
    category:    str = "small"

@router.post("/schemes/recommend")
async def recommend_schemes(profile: FarmerProfile):
    schemes = _cached_schemes or BASE_SCHEMES
    fresh   = mark_expired_schemes(schemes)

    relevant = []
    for s in fresh:
        if s.get("is_expired"):
            continue
        # State matching
        is_tn_scheme = "tn" in s["id"] or "tamil" in s["name"].lower()
        if is_tn_scheme and profile.state.lower() not in ["tamil nadu", "tn"]:
            continue
        # Loan eligibility
        if s["category"] == "loan" and profile.land_acres < 0.25:
            continue
        relevant.append(s)

    return {
        "schemes": sort_schemes(relevant),
        "total":   len(relevant),
        "state":   profile.state
    }
