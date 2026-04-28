"""
MongoDB Atlas Vector Search based conversational memory store.

Replaces the local FAISS index with persistent storage in MongoDB.
Uses SentenceTransformer for local embedding generation and MongoDB
for semantic retrieval.
"""

from typing import Any
import os
from google import genai
from services.database import database


class MemoryStore:
    """
    Persistent vector memory store using MongoDB Atlas Vector Search.
    Uses Gemini API for lightweight text embeddings.
    """

    def __init__(self, model_name: str = "gemini-embedding-001"):
        self._model_name = model_name
        self._client = None

    def _ensure_client(self):
        if self._client is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is not set")
            self._client = genai.Client(api_key=api_key)

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate a vector embedding for a given text using Gemini API."""
        self._ensure_client()
        # The new SDK provides async support via aio
        response = await self._client.aio.models.embed_content(
            model=self._model_name, 
            contents=text
        )
        # response.embeddings is a list, we take the first item's values
        return response.embeddings[0].values

    async def retrieve_relevant(
        self, session_id: str, query: str, top_k: int = 3
    ) -> list[str]:
        """
        Retrieve the most relevant past messages for a query using MongoDB.
        """
        query_embedding = await self.generate_embedding(query)
        
        # Use our new database method for vector search
        return await database.search_relevant_messages(
            session_id=session_id,
            query_embedding=query_embedding,
            limit=top_k
        )

    async def get_recent_history(self, session_id: str, n: int = 5) -> list[str]:
        """
        Get the N most recent interactions from MongoDB.
        """
        messages = await database.get_session_messages(session_id, limit=n)
        return [f"{m['role'].capitalize()}: {m['content']}" for m in messages]


# Global singleton instance
memory_store = MemoryStore()
