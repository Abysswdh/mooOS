"""Waste schemas — batch tracking, fertilizer offers."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class WasteBatchCreate(BaseModel):
    barn_id: int
    raw_waste_kg: float


class WasteBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    barn_id: int
    batch_code: str
    raw_waste_kg: float
    estimated_fertilizer_kg: float
    status: str
    fermentation_start: date | None
    fermentation_end: date | None
    created_at: datetime


class WasteBatchListResponse(BaseModel):
    items: list[WasteBatchResponse]
    total: int


class WasteSummaryResponse(BaseModel):
    total_raw_waste_kg: float
    total_fertilizer_ready_kg: float
    batches_fermenting: int
    batches_ready: int


class FertilizerOfferCreate(BaseModel):
    quantity_kg: float
    price_per_kg: float


class FertilizerOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quantity_kg: float
    price_per_kg: float
    total_price: float
    status: str
    accepted_by: str | None
    notes: str | None
    expires_at: datetime | None
    created_at: datetime
    confirmed_at: datetime | None


class FertilizerOfferListResponse(BaseModel):
    items: list[FertilizerOfferResponse]
    total: int
