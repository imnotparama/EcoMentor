"""
EcoMentor AI — FastAPI Application Entry Point

Architecture:
- CORS: whitelist frontend origin
- Rate limiting: via slowapi
- JWT auth: httpOnly cookies
- SQLite (dev) → PostgreSQL (prod) via SQLAlchemy
- Agentic AI: Claude config.ANTHROPIC_MODEL with 4 tools
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import create_db_tables, get_db
from routers import auth, assessment, dashboard, chat, challenges, progress
from schemas.pydantic_schemas import HealthResponse
from auth_utils import limiter

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Application Lifespan
# ──────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    logger.info("EcoMentor AI starting up...")
    create_db_tables()
    logger.info("Database tables initialized.")
    if not settings.ANTHROPIC_API_KEY:
        logger.warning(
            "ANTHROPIC_API_KEY is not set. AI features will be unavailable."
        )
    yield
    logger.info("EcoMentor AI shutting down.")


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="EcoMentor AI",
    description=(
        "Personal AI sustainability coach — carbon footprint calculation, "
        "agentic insights, weekly challenges, and conversational coaching."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — whitelist frontend origin only
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
if settings.FRONTEND_URL:
    stripped_url = settings.FRONTEND_URL.rstrip("/")
    allowed_origins.extend([stripped_url, f"{stripped_url}/"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://ecomentor-ai(-[a-z0-9-]+)?\.vercel\.app",  # covers Vercel preview deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject security headers on every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ──────────────────────────────────────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(assessment.router)
app.include_router(dashboard.router)
app.include_router(chat.router)
app.include_router(challenges.router)
app.include_router(progress.router)


# ──────────────────────────────────────────────────────────────────────────────
# Core Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for Render deployment."""
    db.execute(text("SELECT 1"))
    return HealthResponse(status="ok", version="1.0.0")


@app.get("/", tags=["root"])
def root():
    """Root endpoint — redirects API consumers to docs."""
    return {
        "message": "EcoMentor AI API",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0",
    }


# ──────────────────────────────────────────────────────────────────────────────
# Global Exception Handler
# ──────────────────────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )
