"""Barn schemas — response models for barn entity."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BarnCreate(BaseModel):
    name: str
    location: str | None = None
    capacity: int = 50
    caretaker_name: str | None = None


class BarnUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    capacity: int | None = None
    caretaker_name: str | None = None


class BarnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str | None
    capacity: int
    caretaker_name: str | None
    created_at: datetime


class BarnListResponse(BaseModel):
    items: list[BarnResponse]
    total: int
