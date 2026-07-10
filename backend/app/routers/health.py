from fastapi import APIRouter
from app.schemas.dashboard import HealthCheckResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    """Simple healthcheck endpoint."""
    return HealthCheckResponse(
        status="OK",
        database="OK",
        version="2.0.0"
    )
