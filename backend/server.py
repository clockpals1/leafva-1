"""LEAFVA main FastAPI server."""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from db import get_db, close_db  # noqa: E402
from auth import (  # noqa: E402
    create_token,
    require_admin,
    seed_admin,
    verify_password,
)
from models import AdminUser, LoginRequest, TokenResponse  # noqa: E402
from routes_chat import router as chat_router  # noqa: E402
from routes_business import router as admin_router  # noqa: E402
from routes_payments import router as payments_router  # noqa: E402

app = FastAPI(title="LEAFVA API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "LEAFVA API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    sb = await get_db()
    result = await sb.table("admin_users").select("*").eq("email", payload.email.lower().strip()).execute()
    doc = result.data[0] if result.data else None
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = AdminUser.from_db(doc)
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role},
    )


@api_router.get("/auth/me")
async def auth_me(user: AdminUser = Depends(require_admin)):
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role}


app.include_router(api_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(payments_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("leafva")


@app.on_event("startup")
async def on_startup():
    await seed_admin()
    from email_service import get_settings
    await get_settings()
    logger.info("LEAFVA backend started. Admin seeded.")


@app.on_event("shutdown")
async def on_shutdown():
    await close_db()
    logger.info("LEAFVA backend stopping.")
