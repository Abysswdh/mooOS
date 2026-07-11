"""Member schemas — request/response models for member CRUD."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MemberCreate(BaseModel):
    nik: str
    name: str
    phone: str | None = None
    address: str | None = None
    simpanan_pokok: float = 0
    simpanan_wajib: float = 0


class MemberUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    simpanan_pokok: float | None = None
    simpanan_wajib: float | None = None
    is_active: bool | None = None


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nik: str
    name: str
    phone: str | None
    address: str | None
    simpanan_pokok: float
    simpanan_wajib: float
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MemberListResponse(BaseModel):
    items: list[MemberResponse]
    total: int
