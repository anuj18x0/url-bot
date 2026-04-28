"""
Authentication service.

JWT token management with HTTP-only cookies and bcrypt password hashing.
"""

import os
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any

import jwt
from passlib.context import CryptContext
from fastapi import Request, HTTPException

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7
COOKIE_NAME = "access_token"


def _get_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET environment variable is not set")
    return secret


def _truncate(password: str) -> str:
    """Encode password to 32 characters using SHA256."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()[:32]


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-SHA256."""
    return pwd_context.hash(_truncate(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a PBKDF2-SHA256 hash."""
    return pwd_context.verify(_truncate(plain_password), hashed_password)


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, _get_secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT token."""
    try:
        return jwt.decode(token, _get_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(request: Request) -> dict[str, Any]:
    """
    FastAPI dependency: extract and verify the current user from HTTP-only cookie.

    Returns dict with 'user_id' and 'email'.
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)
    return {
        "user_id": payload["sub"],
        "email": payload["email"],
    }


def set_auth_cookie(response: Any, token: str) -> None:
    """Set the JWT token as an HTTP-only cookie on the response."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRY_DAYS * 24 * 3600,
        path="/",
    )


def clear_auth_cookie(response: Any) -> None:
    """Clear the auth cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
