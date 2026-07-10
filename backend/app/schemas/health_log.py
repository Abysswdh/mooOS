"""Health log schemas — cow health event tracking."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HealthLogCreate(BaseModel):
    cow_id: int
    event_type: str  # SICK, RECOVERED, TREATMENT, DEAD, CHECKUP
    description: str | None = None
    reported_by: str | None = None


class HealthLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cow_id: int
    event_type: str
    description: str | None
    reported_by: str | None
    created_at: datetime


class HealthLogListResponse(BaseModel):
    items: list[HealthLogResponse]
    total: int
