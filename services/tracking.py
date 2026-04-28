"""
Click tracking service.

Generates tracking codes and logs click events for analytics.
Flow: Bitly Link → Our Tracker → Original URL
"""

import os
import string
import secrets
from datetime import datetime, timezone
from typing import Any

from services.database import database

CODE_LENGTH = 8
CODE_CHARS = string.ascii_letters + string.digits


def _get_base_url() -> str:
    return os.getenv("BASE_URL", "http://localhost:8000")


def _generate_code() -> str:
    """Generate a random 8-character alphanumeric code."""
    return "".join(secrets.choice(CODE_CHARS) for _ in range(CODE_LENGTH))


async def create_tracker(
    original_url: str,
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Create a tracking link record and return the tracker URL.
    
    This URL should be shortened by Bitly.
    """
    base_url = _get_base_url()

    code = _generate_code()
    while await database.find_tracking_link(code):
        code = _generate_code()

    # Create the link record (path_type "A" remains as default for compatibility)
    await database.create_tracking_link(
        code=code,
        target_url=original_url,
        original_url=original_url,
        bitly_url="",  # Will be updated after Bitly shortening
        user_id=user_id,
        path_type="A",
    )

    tracker_url = f"{base_url}/t/{code}"
    
    return {
        "code": code,
        "tracker_url": tracker_url,
        "original_url": original_url,
    }


async def update_tracker_bitly_url(code: str, bitly_url: str):
    """Update a tracking record with its Bitly short link."""
    # We can reuse database.db.tracking_links.update_one directly or add a method to Database class
    await database.db.tracking_links.update_one(
        {"code": code},
        {"$set": {"bitly_url": bitly_url}}
    )


async def log_click(code: str, request: Any) -> None:
    """
    Log a click event for a tracking link.
    Captures timestamp, IP, user-agent, and referer.
    """
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    referer = request.headers.get("referer", "")

    await database.log_click_event(
        code=code,
        ip=ip,
        user_agent=user_agent,
        referer=referer,
    )


async def get_tracking_link(code: str) -> dict | None:
    """Look up a tracking link by its code."""
    return await database.find_tracking_link(code)
