"""Supabase helpers and base model."""
import os
from datetime import datetime, timezone
from typing import Optional
from supabase import AsyncClient, create_async_client
from pydantic import BaseModel, ConfigDict, Field
import uuid


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_uuid() -> str:
    return str(uuid.uuid4())


class BaseDocument(BaseModel):
    """Base model with UUID string id."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(default_factory=new_uuid)
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)

    def to_db(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_db(cls, doc: Optional[dict]):
        if not doc:
            return None
        return cls(**doc)


_client: Optional[AsyncClient] = None


async def get_db() -> AsyncClient:
    global _client
    if _client is None:
        _client = await create_async_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _client


async def close_db():
    global _client
    _client = None
