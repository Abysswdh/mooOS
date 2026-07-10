"""Cow schemas — request/response models for cow CRUD."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CowCreate(BaseModel):
    code: str
    name: str | None = None
    breed: str | None = None
    gender: str = "FEMALE"
    cow_type: str = "DAIRY"
    weight_kg: float = 0
    birth_date: datetime | None = None
    owner_id: int | None = None
    barn_id: int | None = None


class CowUpdate(BaseModel):
    name: str | None = None
    breed: str | None = None
    gender: str | None = None
    cow_type: str | None = None
    weight_kg: float | None = None
    birth_date: datetime | None = None
    status: str | None = None
    owner_id: int | None = None
    barn_id: int | None = None
    photo_url: str | None = None


class CowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str | None
    breed: str | None
    gender: str
    cow_type: str
    weight_kg: float
    birth_date: datetime | None
    photo_url: str | None
    status: str
    owner_id: int | None
    barn_id: int | None
    created_at: datetime
    updated_at: datetime


class CowListResponse(BaseModel):
    items: list[CowResponse]
    total: int
