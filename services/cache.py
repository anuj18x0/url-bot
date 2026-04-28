"""
In-memory TTL cache for API responses.

Simple LRU cache with time-to-live expiration to avoid
hitting Bitly rate limits and speed up repeated requests.
No Redis/Upstash needed — just Python dicts with timestamps.
"""

import time
import threading
from typing import Any


class TTLCache:
    """
    Thread-safe in-memory cache with TTL expiration and max size.

    Entries expire after `ttl` seconds and the cache evicts
    the oldest entry when `max_size` is reached.
    """

    def __init__(self, ttl: int = 300, max_size: int = 256):
        self._ttl = ttl
        self._max_size = max_size
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expires_at)
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        """Get a value from cache. Returns None if missing or expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Set a value in cache with optional custom TTL."""
        with self._lock:
            # Evict oldest if at capacity
            if len(self._store) >= self._max_size and key not in self._store:
                oldest_key = min(self._store, key=lambda k: self._store[k][1])
                del self._store[oldest_key]

            expires_at = time.time() + (ttl if ttl is not None else self._ttl)
            self._store[key] = (value, expires_at)

    def delete(self, key: str) -> bool:
        """Remove a key from cache. Returns True if it existed."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._store.clear()

    def cleanup(self) -> int:
        """Remove all expired entries. Returns count of removed items."""
        with self._lock:
            now = time.time()
            expired = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired:
                del self._store[k]
            return len(expired)

    @property
    def size(self) -> int:
        return len(self._store)


# --- Global cache instances ---

# Cache shortened URLs for 1 hour (same URL → same short link)
url_cache = TTLCache(ttl=3600, max_size=512)

# Cache analytics for 5 minutes (clicks change frequently)
analytics_cache = TTLCache(ttl=300, max_size=128)
