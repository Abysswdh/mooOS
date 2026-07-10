"""Milk schemas — production records, offers, summaries."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class MilkRecordCreate(BaseModel):
    cow_id: int
    date: date
    liters: float
    recorded_by: str | None = None


class MilkRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cow_id: int
    date: date
    liters: float
    recorded_by: str | None
    created_at: datetime


class MilkRecordListResponse(BaseModel):
    items: list[MilkRecordResponse]
    total: int


class MilkSummaryResponse(BaseModel):
    today_total_liters: float
    yesterday_total_liters: float
    week_total_liters: float
    month_total_liters: float
    active_dairy_cows: int


class MilkOfferCreate(BaseModel):
    quantity_liters: float
    price_per_liter: float
    min_order_liters: float = 50
    duration_minutes: int | None = None


class MilkOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quantity_liters: float
    price_per_liter: float
    total_price: float
    min_order_liters: float
    status: str
    accepted_by: str | None
    accepted_quantity: float | None
    notes: str | None
    expires_at: datetime | None
    created_at: datetime
    confirmed_at: datetime | None


class MilkOfferListResponse(BaseModel):
    items: list[MilkOfferResponse]
    total: int
