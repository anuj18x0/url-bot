"""
Analytics route — direct endpoint for fetching Bitly click analytics.
"""

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from services.bitly import get_click_analytics

router = APIRouter(tags=["analytics"])


class AnalyticsRequest(BaseModel):
    bitlink: str = Field(..., min_length=3, description="The Bitly short link (e.g., bit.ly/abc123)")


class ClickDay(BaseModel):
    date: str
    clicks: int


class AnalyticsResponse(BaseModel):
    bitlink: str
    total_clicks: int
    clicks_by_day: list[ClickDay]
    unit: str
    period: str


@router.post("/analytics", response_model=AnalyticsResponse)
async def analytics(request: AnalyticsRequest):
    """
    Fetch click analytics for a Bitly short link.
    """
    try:
        result = await get_click_analytics(request.bitlink)
        return AnalyticsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
