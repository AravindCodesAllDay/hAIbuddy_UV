from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from types import SimpleNamespace
from contextlib import asynccontextmanager

from app.core.settings import settings
from app.core.logging_config import setup_logging
from app.utils.limiter import limiter, custom_rate_limit_exceeded_handler
from app.api import interview_ws, interview_route, user_route,code_interview_ws
from app.services.init_services import ServiceContainer

setup_logging(settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """New FastAPI lifespan startup/shutdown handler."""
    # Startup
    await ServiceContainer.warm_up()
    # asyncio.create_task(ServiceContainer.keep_alive())
    yield
    # Shutdown
    await ServiceContainer.close_all()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGIN,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Rate Limiter
# -----------------------------
app.state = SimpleNamespace()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# -----------------------------
# Routers
# -----------------------------
app.include_router(user_route.router)
app.include_router(interview_route.router)
app.include_router(interview_ws.router)
app.include_router(code_interview_ws.router)


# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return {
        "message": f"{settings.APP_NAME} Running",
        "version": settings.VERSION,
    }