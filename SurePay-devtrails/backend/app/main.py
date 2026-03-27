"""
GigGuard FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from models import Worker, Policy, Claim
from app.database import engine, Base

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} Starting...")
    
    # 🌟 NEW: Build database tables here!
    print("🌱 Building database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables built successfully!")
    
    yield
    
    # Shutdown
    print(f"[STOP] {settings.APP_NAME} Shutting down...")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Hosts Middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)


# Health Check Endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "OK",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENV
    }


# Root Endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "api_prefix": settings.API_PREFIX,
        "docs": f"{settings.API_PREFIX}/docs" if settings.DEBUG else None,
        "api_status": "🟢 ACTIVE"
    }


# Include API Routes
from api import auth, policies, demo, admin, claims, payments, weather, workers, anti_spoof

app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["auth"])
app.include_router(policies.router, prefix=f"{settings.API_PREFIX}/policies", tags=["policies"])
app.include_router(claims.router, prefix=f"{settings.API_PREFIX}/claims", tags=["claims"])
app.include_router(payments.router, prefix=f"{settings.API_PREFIX}/payments", tags=["payments"])
app.include_router(weather.router, prefix=f"{settings.API_PREFIX}/weather", tags=["weather"])
app.include_router(workers.router, prefix=f"{settings.API_PREFIX}/workers", tags=["workers"])
app.include_router(demo.router, prefix=f"{settings.API_PREFIX}/demo", tags=["demo"])
app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["admin"])
app.include_router(anti_spoof.router, prefix=f"{settings.API_PREFIX}/anti-spoof", tags=["anti-spoof"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
