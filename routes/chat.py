"""
Chat route — main endpoint for the AI agent.
"""

import uuid
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Request

from services.agent import run_agent
from services.auth import decode_token, COOKIE_NAME

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: str | None = Field(
        default=None, description="Session ID for conversation continuity"
    )


class AnalyticsData(BaseModel):
    bitlink: str | None = None
    total_clicks: int | None = None
    clicks_by_day: list[dict] | None = None
    unit: str | None = None
    period: str | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    short_url: str | None = None
    long_url: str | None = None
    qr_code_base64: str | None = None
    analytics: AnalyticsData | None = None
    tracking: dict | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, req: Request):
    """
    Send a message to the AI agent.

    The agent will intelligently decide whether to:
    - Respond conversationally
    - Shorten a URL via Bitly
    - Fetch link analytics

    If user is authenticated (cookie), tracking links are owned by them.
    """
    session_id = request.session_id or str(uuid.uuid4())

    # Extract optional user_id from cookie (chat works for unauthed users too)
    user_id = None
    token = req.cookies.get(COOKIE_NAME)
    if token:
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
        except Exception:
            pass  # Unauthenticated — that's fine

    try:
        result = await run_agent(
            user_message=request.message,
            session_id=session_id,
            user_id=user_id,
        )

        # Build response
        response_data = {
            "reply": result.get("reply", ""),
            "session_id": session_id,
            "short_url": result.get("short_url"),
            "long_url": result.get("long_url"),
            "qr_code_base64": result.get("qr_code_base64"),
            "tracking": result.get("tracking"),
        }

        # Include analytics if present
        if result.get("analytics"):
            response_data["analytics"] = AnalyticsData(**result["analytics"])

        return ChatResponse(**response_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
