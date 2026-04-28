"""
Dashboard API routes — analytics, links, and stats.

All endpoints require authentication (HTTP-only cookie).
"""

from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query

from services.auth import get_current_user
from services.database import database

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class StatsResponse(BaseModel):
    total_links: int
    total_clicks: int
    clicks_over_time: list[dict]
    period: str


class LinkItem(BaseModel):
    code: str
    original_url: str
    bitly_url: str
    tracker_url: str
    total_clicks: int
    created_at: str


class LinksResponse(BaseModel):
    links: list[LinkItem]
    total: int


class LinkAnalyticsResponse(BaseModel):
    code: str
    original_url: str
    total_clicks: int
    clicks_over_time: list[dict]
    period: str


@router.get("/stats", response_model=StatsResponse)
async def get_dashboard_stats(
    period: str = Query("7d", regex="^(24h|3d|7d|1month)$"),
    current_user: dict = Depends(get_current_user),
):
    """Get overview stats for the authenticated user."""
    stats = await database.get_user_dashboard_stats(
        current_user["user_id"], period
    )
    return StatsResponse(**stats, period=period)


@router.get("/links", response_model=LinksResponse)
async def get_user_links(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Get the authenticated user's tracking links with click counts."""
    links = await database.get_user_links(current_user["user_id"], limit)
    return LinksResponse(links=links, total=len(links))


@router.get("/links/{code}/analytics", response_model=LinkAnalyticsResponse)
async def get_link_analytics(
    code: str,
    period: str = Query("7d", regex="^(24h|3d|7d|1month)$"),
    current_user: dict = Depends(get_current_user),
):
    """Get detailed analytics for a specific tracking link."""
    analytics = await database.get_link_analytics(
        code, current_user["user_id"], period
    )
    if not analytics:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Link not found")
    return LinkAnalyticsResponse(**analytics, period=period)



