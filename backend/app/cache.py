from __future__ import annotations
 
import json
import os
from typing import Any
 
import redis
 
_client: redis.Redis | None = None
 
 
def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _client = redis.from_url(url, decode_responses=True)
    return _client
 
 
def cache_get_json(key: str) -> Any | None:
    try:
        raw = _get_client().get(key)
        return json.loads(raw) if raw is not None else None
    except Exception:
        return None
 
 
def cache_set_json(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    try:
        _get_client().setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def cache_delete(key: str) -> None:
    try:
        _get_client().delete(key)
    except Exception:
        pass