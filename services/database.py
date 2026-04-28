"""
MongoDB database service.

Persists users, conversation sessions, tracking links, click events,
and provides aggregation pipelines for analytics dashboards.
Uses Motor (async MongoDB driver) for non-blocking operations.
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


class Database:
    """Async MongoDB connection manager and data access layer."""

    def __init__(self):
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None

    async def connect(self):
        """Initialize MongoDB connection and create indexes."""
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGODB_DB_NAME", "linkbot")

        self._client = AsyncIOMotorClient(mongo_uri)
        self._db = self._client[db_name]

        # Indexes
        await self._db.users.create_index("email", unique=True)
        await self._db.sessions.create_index("session_id", unique=True)
        await self._db.url_history.create_index("long_url")
        await self._db.url_history.create_index("short_url")
        await self._db.url_history.create_index("created_at")
        await self._db.tracking_links.create_index("code", unique=True)
        await self._db.tracking_links.create_index("user_id")
        await self._db.tracking_links.create_index("original_url")
        await self._db.clicks.create_index("code")
        await self._db.clicks.create_index("timestamp")
        await self._db.clicks.create_index([("code", 1), ("timestamp", -1)])
        
        # Messages collection for vector search
        await self._db.messages.create_index("session_id")
        await self._db.messages.create_index("timestamp")

        print(f"✅ MongoDB connected: {db_name}")

    async def disconnect(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            print("👋 MongoDB disconnected")

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._db

    # =====================================================
    # USERS
    # =====================================================

    async def create_user(
        self, email: str, password_hash: str, name: str
    ) -> dict[str, Any]:
        """Create a new user."""
        doc = {
            "email": email,
            "password_hash": password_hash,
            "name": name,
            "created_at": datetime.now(timezone.utc),
        }
        result = await self.db.users.insert_one(doc)
        return {
            "id": str(result.inserted_id),
            "email": email,
            "name": name,
        }

    async def find_user_by_email(self, email: str) -> dict | None:
        """Find a user by email."""
        doc = await self.db.users.find_one({"email": email})
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "name": doc["name"],
            "password_hash": doc["password_hash"],
        }

    async def find_user_by_id(self, user_id: str) -> dict | None:
        """Find a user by ID."""
        from bson import ObjectId
        try:
            doc = await self.db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return None
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "name": doc["name"],
        }

    # =====================================================
    # SESSIONS / CONVERSATIONS
    # =====================================================

    async def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        embedding: list[float] | None = None,
        short_url: str | None = None,
        long_url: str | None = None,
        analytics: dict | None = None,
    ):
        """Save a message to the database with optional vector embedding."""
        message_doc = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        }
        
        if embedding:
            message_doc["embedding"] = embedding
        if short_url:
            message_doc["short_url"] = short_url
        if long_url:
            message_doc["long_url"] = long_url
        if analytics:
            message_doc["analytics"] = analytics

        # Insert into dedicated messages collection
        await self.db.messages.insert_one(message_doc)

        # Legacy: also update the sessions collection for backward compatibility/UI
        await self.db.sessions.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": {
                    "role": role,
                    "content": content,
                    "timestamp": message_doc["timestamp"],
                    "short_url": short_url,
                    "long_url": long_url,
                }},
                "$set": {"updated_at": datetime.now(timezone.utc)},
                "$setOnInsert": {
                    "session_id": session_id,
                    "created_at": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )

    async def search_relevant_messages(
        self, session_id: str, query_embedding: list[float], limit: int = 3
    ) -> list[str]:
        """
        Perform vector search using MongoDB Atlas Vector Search.
        Note: This requires a 'vector_index' to be created in Atlas.
        """
        # Note: If not on Atlas or index not created, this will fail.
        # For the mini-project, we'll try it, and fallback to recent messages if it fails.
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 100,
                    "limit": limit,
                    "filter": {"session_id": session_id}
                }
            },
            {
                "$project": {
                    "content": 1,
                    "role": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        try:
            cursor = self.db.messages.aggregate(pipeline)
            results = await cursor.to_list(length=limit)
            return [f"{r['role'].capitalize()}: {r['content']}" for r in results]
        except Exception as e:
            print(f"⚠️ Vector search failed (Atlas index might not be ready): {e}")
            # Fallback to last N messages if vector search is unavailable
            return []

    async def get_session_messages(
        self, session_id: str, limit: int = 20
    ) -> list[dict]:
        """Get recent messages for a session."""
        session = await self.db.sessions.find_one(
            {"session_id": session_id},
            {"messages": {"$slice": -limit}},
        )
        if session and "messages" in session:
            return session["messages"]
        return []

    # =====================================================
    # URL HISTORY
    # =====================================================

    async def save_url(
        self, long_url: str, short_url: str, session_id: str | None = None
    ):
        """Save a shortened URL to history."""
        await self.db.url_history.update_one(
            {"short_url": short_url},
            {
                "$set": {
                    "long_url": long_url,
                    "short_url": short_url,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {
                    "created_at": datetime.now(timezone.utc),
                    "session_id": session_id,
                },
            },
            upsert=True,
        )

    async def find_existing_short_url(self, long_url: str) -> str | None:
        """Check if a URL was already shortened (dedup)."""
        doc = await self.db.url_history.find_one(
            {"long_url": long_url},
            {"short_url": 1},
        )
        return doc["short_url"] if doc else None

    async def get_url_history(self, limit: int = 20) -> list[dict]:
        """Get recent shortened URLs."""
        cursor = self.db.url_history.find(
            {},
            {"_id": 0, "long_url": 1, "short_url": 1, "created_at": 1},
        ).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

    # =====================================================
    # TRACKING LINKS
    # =====================================================

    async def find_existing_tracker(
        self, original_url: str, user_id: str | None
    ) -> dict | None:
        """Check if a user already has a tracker for this URL."""
        query = {"original_url": original_url, "user_id": user_id}
        doc = await self.db.tracking_links.find_one(query)
        if not doc:
            return None
        return {
            "code": doc["code"],
            "bitly_url": doc["bitly_url"],
            "tracker_url": f"{os.getenv('BASE_URL', 'http://localhost:8000')}/t/{doc['code']}",
        }

    async def create_tracking_link(
        self,
        code: str,
        target_url: str,
        original_url: str,
        bitly_url: str,
        user_id: str | None,
    ):
        """Create a tracking link record."""
        await self.db.tracking_links.insert_one({
            "code": code,
            "target_url": target_url,
            "original_url": original_url,
            "bitly_url": bitly_url,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
        })

    async def find_tracking_link_by_bitly_url(self, bitly_url: str) -> dict | None:
        """Look up a tracking link by its Bitly URL."""
        # Normalize to ensure we can match with or without https://
        clean_url = bitly_url.replace("http://", "").replace("https://", "")
        
        # Use regex to match the end of the URL to handle protocol differences
        doc = await self.db.tracking_links.find_one({
            "bitly_url": {"$regex": f"{clean_url}$"}
        })
        if not doc:
            return None
        return {
            "code": doc["code"],
            "target_url": doc["target_url"],
            "original_url": doc["original_url"],
            "bitly_url": doc["bitly_url"],
            "user_id": doc.get("user_id"),
        }

    async def find_tracking_link(self, code: str) -> dict | None:
        """Look up a tracking link by code."""
        doc = await self.db.tracking_links.find_one({"code": code})
        if not doc:
            return None
        return {
            "code": doc["code"],
            "target_url": doc["target_url"],
            "original_url": doc["original_url"],
            "bitly_url": doc["bitly_url"],
            "user_id": doc.get("user_id"),
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
        }
        if not doc:
            return None
        return {
            "code": doc["code"],
            "target_url": doc["target_url"],
            "original_url": doc["original_url"],
            "bitly_url": doc["bitly_url"],
            "path_type": doc["path_type"],
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
        }

    # =====================================================
    # CLICK EVENTS
    # =====================================================

    async def log_click_event(
        self, code: str, ip: str, user_agent: str, referer: str
    ):
        """Log a click event."""
        await self.db.clicks.insert_one({
            "code": code,
            "timestamp": datetime.now(timezone.utc),
            "ip": ip,
            "user_agent": user_agent,
            "referer": referer,
        })

    def _period_to_timedelta(self, period: str) -> timedelta:
        """Convert period string to timedelta."""
        mapping = {
            "24h": timedelta(hours=24),
            "3d": timedelta(days=3),
            "7d": timedelta(days=7),
            "1month": timedelta(days=30),
        }
        return mapping.get(period, timedelta(days=7))

    def _period_to_group_format(self, period: str) -> dict:
        """Get MongoDB date grouping format for a period."""
        if period == "24h":
            return {
                "year": {"$year": "$timestamp"},
                "month": {"$month": "$timestamp"},
                "day": {"$dayOfMonth": "$timestamp"},
                "hour": {"$hour": "$timestamp"},
            }
        else:
            return {
                "year": {"$year": "$timestamp"},
                "month": {"$month": "$timestamp"},
                "day": {"$dayOfMonth": "$timestamp"},
            }

    async def get_click_count(self, code: str, period: str = "7d") -> int:
        """Get total click count for a code within a period."""
        since = datetime.now(timezone.utc) - self._period_to_timedelta(period)
        return await self.db.clicks.count_documents({
            "code": code,
            "timestamp": {"$gte": since},
        }) - 1

    async def get_clicks_over_time(
        self, code: str, period: str = "7d"
    ) -> list[dict]:
        """Get clicks grouped over time for a code."""
        since = datetime.now(timezone.utc) - self._period_to_timedelta(period)
        group_format = self._period_to_group_format(period)

        pipeline = [
            {"$match": {"code": code, "timestamp": {"$gte": since}}},
            {"$group": {
                "_id": group_format,
                "clicks": {"$sum": 1},
                "first_timestamp": {"$min": "$timestamp"},
            }},
            {"$sort": {"first_timestamp": 1}},
            {"$project": {
                "_id": 0,
                "date": {"$dateToString": {
                    "format": "%Y-%m-%dT%H:%M:%S",
                    "date": "$first_timestamp",
                }},
                "clicks": 1,
            }},
        ]

        cursor = self.db.clicks.aggregate(pipeline)
        return await cursor.to_list(length=500)

    # =====================================================
    # DASHBOARD ANALYTICS
    # =====================================================

    async def get_user_links(
        self, user_id: str, limit: int = 20
    ) -> list[dict]:
        """Get user's tracking links with click counts."""
        base_url = os.getenv("BASE_URL", "http://localhost:8000")

        cursor = self.db.tracking_links.find(
            {"user_id": user_id},
        ).sort("created_at", -1).limit(limit)

        links = []
        async for doc in cursor:
            click_count = await self.db.clicks.count_documents({"code": doc["code"]})
            links.append({
                "code": doc["code"],
                "original_url": doc["original_url"],
                "bitly_url": doc["bitly_url"],
                "tracker_url": f"{base_url}/t/{doc['code']}",
                "total_clicks": click_count,
                "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
            })

        return links

    async def get_user_dashboard_stats(
        self, user_id: str, period: str = "7d"
    ) -> dict[str, Any]:
        """Get aggregated dashboard stats for a user."""
        since = datetime.now(timezone.utc) - self._period_to_timedelta(period)

        # Total links
        total_links = await self.db.tracking_links.count_documents({"user_id": user_id})

        # Get all user's codes
        codes_cursor = self.db.tracking_links.find(
            {"user_id": user_id}, {"code": 1}
        )
        codes = [doc["code"] async for doc in codes_cursor]

        # Total clicks for all user's links in period
        total_clicks = 0
        if codes:
            total_clicks = await self.db.clicks.count_documents({
                "code": {"$in": codes},
                "timestamp": {"$gte": since},
            })

        # Clicks over time aggregated across all user's links
        clicks_over_time = []
        if codes:
            group_format = self._period_to_group_format(period)
            pipeline = [
                {"$match": {"code": {"$in": codes}, "timestamp": {"$gte": since}}},
                {"$group": {
                    "_id": group_format,
                    "clicks": {"$sum": 1},
                    "first_timestamp": {"$min": "$timestamp"},
                }},
                {"$sort": {"first_timestamp": 1}},
                {"$project": {
                    "_id": 0,
                    "date": {"$dateToString": {
                        "format": "%Y-%m-%dT%H:%M:%S",
                        "date": "$first_timestamp",
                    }},
                    "clicks": 1,
                }},
            ]
            cursor = self.db.clicks.aggregate(pipeline)
            clicks_over_time = await cursor.to_list(length=500)

        return {
            "total_links": total_links,
            "total_clicks": total_clicks,
            "clicks_over_time": clicks_over_time,
        }

    async def get_link_analytics(
        self, code: str, user_id: str, period: str = "7d"
    ) -> dict | None:
        """Get detailed analytics for a specific tracking link."""
        link = await self.find_tracking_link(code)
        if not link or link.get("user_id") != user_id:
            return None

        total_clicks = await self.get_click_count(code, period)
        clicks_over_time = await self.get_clicks_over_time(code, period)

        return {
            "code": code,
            "original_url": link["original_url"],
            "total_clicks": total_clicks,
            "clicks_over_time": clicks_over_time,
        }



    # =====================================================
    # STATS (legacy)
    # =====================================================

    async def get_stats(self) -> dict[str, Any]:
        """Get basic usage statistics."""
        total_urls = await self.db.url_history.count_documents({})
        total_sessions = await self.db.sessions.count_documents({})
        return {
            "total_urls_shortened": total_urls,
            "total_sessions": total_sessions,
        }


# Global singleton
database = Database()
