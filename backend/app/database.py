from __future__ import annotations

import os
from functools import lru_cache

from sqlalchemy import create_engine, text


def _normalize_database_url(url: str | None) -> str:
    if not url:
        return "postgresql+psycopg2://gtp:gtp@localhost:5432/gtp"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


@lru_cache(maxsize=1)
def get_engine():
    database_url = _normalize_database_url(os.getenv("DATABASE_URL"))
    return create_engine(
        database_url, 
        future=True, 
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600
    )


def fetch_all(query: str, params: dict | None = None) -> list[dict]:
    with get_engine().connect() as connection:
        result = connection.execute(text(query), params or {})
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_one(query: str, params: dict | None = None) -> dict | None:
    with get_engine().connect() as connection:
        result = connection.execute(text(query), params or {})
        row = result.mappings().first()
        return dict(row) if row else None


def fetch_scalar(query: str, params: dict | None = None):
    with get_engine().connect() as connection:
        result = connection.execute(text(query), params or {})
        return result.scalar_one_or_none()
