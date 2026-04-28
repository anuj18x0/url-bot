"""
Authentication routes — signup, login, logout, and current user.
"""

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    set_auth_cookie,
    clear_auth_cookie,
)
from services.database import database

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str


@router.post("/signup", response_model=UserResponse)
async def signup(request: SignupRequest):
    """Create a new user account and set auth cookie."""
    # Check if email already exists
    existing = await database.find_user_by_email(request.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create user
    password_hash = hash_password(request.password)
    user = await database.create_user(
        email=request.email,
        password_hash=password_hash,
        name=request.name,
    )

    # Generate token and set cookie
    token = create_access_token(user["id"], user["email"])
    response = JSONResponse(
        content={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        }
    )
    set_auth_cookie(response, token)
    return response


@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    """Authenticate user and set auth cookie."""
    user = await database.find_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate token and set cookie
    token = create_access_token(user["id"], user["email"])
    response = JSONResponse(
        content={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        }
    )
    set_auth_cookie(response, token)
    return response


@router.post("/logout")
async def logout():
    """Clear the auth cookie."""
    response = JSONResponse(content={"message": "Logged out"})
    clear_auth_cookie(response)
    return response


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user."""
    user = await database.find_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
    )
