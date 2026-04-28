"""
Redirect route — click tracking endpoint.

GET /t/{code} looks up the tracking code, logs the click, and redirects.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from services.tracking import get_tracking_link, log_click

router = APIRouter(tags=["redirect"])


@router.get("/t/{code}")
async def redirect_tracking(code: str, request: Request):
    """
    Track a click and redirect to the target URL.

    This endpoint is used for both Path A and Path B tracking links.
    It logs the click event (IP, user-agent, referer, timestamp)
    and returns a 302 redirect to the target URL.
    """
    # Look up tracking link
    link = await get_tracking_link(code)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # Log click asynchronously (fire-and-forget for speed)
    await log_click(code, request)

    # 302 redirect to target
    return RedirectResponse(url=link["target_url"], status_code=302)
