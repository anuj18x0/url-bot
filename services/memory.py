"""
MongoDB Atlas Vector Search based conversational memory store.

Replaces the local FAISS index with persistent storage in MongoDB.
Uses SentenceTransformer for local embedding generation and MongoDB
for semantic retrieval.
"""

from typing import Any
from sentence_transformers import SentenceTransformer
from services.database import database


class MemoryStore:
    """
    Persistent vector memory store using MongoDB Atlas Vector Search.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self._model_name = model_name
        self._model: SentenceTransformer | None = None

    def initialize(self):
        """Pre-load the embedding model (called at startup)."""
        if self._model is None:
            print("⏳ Loading embedding model...")
            self._model = SentenceTransformer(self._model_name)
            print(f"✅ Embedding model loaded")

    def _ensure_model(self):
        if self._model is None:
            self.initialize()

    def generate_embedding(self, text: str) -> list[float]:
        """Generate a vector embedding for a given text."""
        self._ensure_model()
        embedding = self._model.encode([text])[0]
        return embedding.tolist()

    async def retrieve_relevant(
        self, session_id: str, query: str, top_k: int = 3
    ) -> list[str]:
        """
        Retrieve the most relevant past messages for a query using MongoDB.
        """
        self._ensure_model()
        query_embedding = self.generate_embedding(query)
        
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
