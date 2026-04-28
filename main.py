"""
FastAPI application entry point for the AI URL Shortener Agent.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.chat import router as chat_router
from routes.shorten import router as shorten_router
from routes.analytics import router as analytics_router
from routes.auth import router as auth_router
from routes.redirect import router as redirect_router
from routes.dashboard import router as dashboard_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup: pre-load the embedding model so first request isn't slow
    from services.database import database
    await database.connect()
    yield
    # Shutdown: cleanup
    await database.disconnect()
    print("👋 Shutting down")


app = FastAPI(
    title="AI URL Shortener Agent",
    description="An AI-powered agent for smart URL shortening with Bitly integration",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://url-bot-tau.vercel.app/",
        "https://url-bot-tau.vercel.app",
        "url-bot-tau.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api")
app.include_router(shorten_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(redirect_router)  # No prefix — /t/{code} at root


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-url-shortener-agent"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
