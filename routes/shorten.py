"""
Direct URL shortening route (bypasses the AI agent).
"""

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from services.bitly import shorten_url as bitly_shorten
from services.qr import generate_qr_base64

router = APIRouter(tags=["shorten"])


class ShortenRequest(BaseModel):
    url: str = Field(..., min_length=5, description="The long URL to shorten")


class ShortenResponse(BaseModel):
    short_url: str
    long_url: str
    qr_code_base64: str


@router.post("/shorten", response_model=ShortenResponse)
async def shorten(request: ShortenRequest):
    """
    Directly shorten a URL via Bitly (no AI agent involved).
    """
    url = request.url
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        result = await bitly_shorten(url)
        qr_code = generate_qr_base64(result["link"])

        return ShortenResponse(
            short_url=result["link"],
            long_url=result["long_url"],
            qr_code_base64=qr_code,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
