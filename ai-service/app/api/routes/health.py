from fastapi import APIRouter, Depends

from app import __version__
from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["system"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health",
    description="Returns the current health and identity of the AI service.",
)
def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=__version__,
        environment=settings.environment,
    )
