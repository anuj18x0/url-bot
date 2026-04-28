"""
Bitly API integration service.

Handles URL shortening and click analytics via the Bitly v4 API.
"""

import os
from typing import Any

import httpx
from dotenv import load_dotenv

from services.cache import url_cache, analytics_cache

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
    Fetch click analytics for a Bitly short link.

    Args:
        bitlink: The Bitly short link ID (e.g., 'bit.ly/abc123').

    Returns:
        Dictionary with 'total_clicks' and 'clicks_by_day' data.
    """
    # Clean up the bitlink - remove protocol if present
    bitlink = bitlink.replace("https://", "").replace("http://", "")

    # Check analytics cache (5 min TTL)
    cached = analytics_cache.get(bitlink)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Get click summary
        summary_response = await client.get(
            f"{BITLY_BASE_URL}/bitlinks/{bitlink}/clicks/summary",
            headers=_get_headers(),
            params={"unit": "day", "units": 30},
        )

        # Get detailed clicks by day
        clicks_response = await client.get(
            f"{BITLY_BASE_URL}/bitlinks/{bitlink}/clicks",
            headers=_get_headers(),
            params={"unit": "day", "units": 7},
        )

        if summary_response.status_code != 200:
            if summary_response.status_code == 404:
                raise ValueError(f"Bitlink '{bitlink}' not found")
            raise RuntimeError(
                f"Bitly API error ({summary_response.status_code}): {summary_response.text}"
            )

        summary_data = summary_response.json()
        total_clicks = summary_data.get("total_clicks", 0)

        clicks_by_day = []
        if clicks_response.status_code == 200:
            clicks_data = clicks_response.json()
            for entry in clicks_data.get("link_clicks", []):
                clicks_by_day.append({
                    "date": entry.get("date", ""),
                    "clicks": entry.get("clicks", 0),
                })

        result = {
            "bitlink": bitlink,
            "total_clicks": total_clicks,
            "clicks_by_day": clicks_by_day,
            "unit": "day",
            "period": "last 30 days (summary) / last 7 days (daily)",
        }
        analytics_cache.set(bitlink, result)  # Cache for 5 min
        return result
