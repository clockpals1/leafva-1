"""JWT auth + admin seed."""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from db import get_db
from models import AdminUser

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"
TOKEN_TTL_HOURS = 24 * 7

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None


async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> AdminUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    db = get_db()
    doc = await db.admin_users.find_one({"id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=401, detail="User not found")
    user = AdminUser.from_mongo(doc)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


async def seed_admin():
    """Idempotently create default admin user."""
    db = get_db()
    default_email = "admin@leafva.com"
    default_password = "LeafvaAdmin@2026"
    existing = await db.admin_users.find_one({"email": default_email})
    if existing:
        return
    user = AdminUser(
        email=default_email,
        name="LEAFVA Admin",
        password_hash=hash_password(default_password),
    )
    await db.admin_users.insert_one(user.to_mongo())
