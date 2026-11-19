import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.router import api_router
from app.core.config import get_settings
from app.services.rabbitmq_consumer import launch_worker_thread

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("boostup.ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start RabbitMQ worker daemon on FastAPI startup
    logger.info("Initializing RabbitMQ background consumer worker...")
    worker = launch_worker_thread()
    yield
    # Graceful shutdown
    logger.info("Stopping RabbitMQ worker...")
    worker.stop()


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="BoostUP Async AI Service: PDF OCR & Ollama LLM Backlog Decomposer",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.api_prefix)

    @application.get("/", include_in_schema=False)
    async def root():
        return {
            "service": settings.app_name,
            "version": __version__,
            "docs": "/docs",
            "health": f"{settings.api_prefix}/health",
        }

    return application


app = create_app()
