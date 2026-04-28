"""
Bitly API integration service.

Handles URL shortening and click analytics via the Bitly v4 API.
"""

import os
from typing import Any

import httpx
from dotenv import load_dotenv

from services.cache import url_cache, analytics_cache
from services.database import database

load_dotenv()

BITLY_BASE_URL = "https://api-ssl.bitly.com/v4"


def _get_headers() -> dict[str, str]:
    token = os.getenv("BITLY_ACCESS_TOKEN")
    if not token:
        raise ValueError("BITLY_ACCESS_TOKEN environment variable is not set")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


async def shorten_url(long_url: str) -> dict[str, Any]:
    """
    Shorten a URL using the Bitly API.

    Args:
        long_url: The original long URL to shorten.

    Returns:
        Dictionary with 'link' (short URL) and 'long_url' (original URL).
    """
    # Check cache first — avoid duplicate API calls for same URL
    cached = url_cache.get(long_url)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{BITLY_BASE_URL}/shorten",
            headers=_get_headers(),
            json={"long_url": long_url},
        )

        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            result = {
                "link": data["link"],
                "long_url": data["long_url"],
                "id": data["id"],
            }
            url_cache.set(long_url, result)  # Cache for 1 hour
            return result
        elif response.status_code == 400:
            error_data = response.json()
            raise ValueError(
                f"Invalid URL: {error_data.get('description', 'Bad request')}"
            )
        elif response.status_code == 403:
            raise PermissionError("Bitly API: Invalid or expired access token")
        elif response.status_code == 429:
            raise RuntimeError("Bitly API: Rate limit exceeded. Please try again later.")
        else:
            raise RuntimeError(
                f"Bitly API error ({response.status_code}): {response.text}"
            )


async def get_click_analytics(bitlink: str) -> dict[str, Any]:
    """
    Fetch click analytics from our internal database instead of Bitly.
    The free tier of Bitly no longer supports the /clicks endpoint.

    Args:
        bitlink: The Bitly short link ID (e.g., 'bit.ly/abc123') or our internal tracker code.

    Returns:
        Dictionary with 'total_clicks' and 'clicks_by_day' data.
    """
    # Clean up the bitlink - remove protocol if present
    clean_bitlink = bitlink.replace("https://", "").replace("http://", "")

    # Check analytics cache (5 min TTL)
    cached = analytics_cache.get(clean_bitlink)
    if cached:
        return cached

    # Find the tracker code associated with this bitlink
    tracker = await database.find_tracking_link_by_bitly_url(clean_bitlink)
    
    # If the user passed our internal code directly instead of the bitly url
    if not tracker:
        tracker = await database.find_tracking_link(clean_bitlink)
        
    if not tracker:
        raise ValueError(f"Could not find internal tracking record for '{bitlink}'")

    code = tracker["code"]

    # Get local click data from our database
    total_clicks = await database.get_click_count(code, period="30d")
    clicks_over_time = await database.get_clicks_over_time(code, period="7d")
    
    # Format clicks_by_day to match expected API output format
    clicks_by_day = []
    for entry in clicks_over_time:
        # entry["date"] is like "2023-10-25T14:30:00"
        # We just need the date part "2023-10-25T00:00:00Z"
        date_str = entry["date"].split("T")[0] + "T00:00:00Z"
        clicks_by_day.append({
            "date": date_str,
            "clicks": entry["clicks"],
        })

    result = {
        "bitlink": clean_bitlink,
        "total_clicks": total_clicks,
        "clicks_by_day": clicks_by_day,
        "unit": "day",
        "period": "last 30 days (summary) / last 7 days (daily)",
    }
    
    analytics_cache.set(clean_bitlink, result)  # Cache for 5 min
    return result
