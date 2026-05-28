"""MongoDB helpers and base model."""
import os
from datetime import datetime, timezone
from typing import Annotated, Any, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
import uuid


def _validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_uuid() -> str:
    return str(uuid.uuid4())


class BaseDocument(BaseModel):
    """Base model: uses uuid string id stored as `id` (not _id)."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(default_factory=new_uuid)
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)

    def to_mongo(self) -> dict:
        d = self.model_dump()
        return d

    @classmethod
    def from_mongo(cls, doc: Optional[dict]):
        if not doc:
            return None
        doc = dict(doc)
        doc.pop("_id", None)
        return cls(**doc)


_client: Optional[AsyncIOMotorClient] = None


def get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return _client[os.environ["DB_NAME"]]
