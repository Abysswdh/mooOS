"""Feed schemas — PO creation, stock responses."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FeedOrderCreate(BaseModel):
    quantity_kg: float
    feed_type: str = "Konsentrat"
    max_price_per_kg: float
    duration_minutes: int | None = None


class FeedOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    po_number: str
    quantity_kg: float
    feed_type: str
    max_price_per_kg: float
    total_max_price: float
    status: str
    accepted_by: str | None
    accepted_price_per_kg: float | None
    notes: str | None
    expires_at: datetime | None
    created_at: datetime
    confirmed_at: datetime | None


class FeedOrderListResponse(BaseModel):
    items: list[FeedOrderResponse]
    total: int


class FeedStockResponse(BaseModel):
    current_stock_kg: float
    daily_consumption_kg: float
    days_remaining: float
    is_critical: bool


class FeedStockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: datetime
    change_kg: float
    reason: str
    created_at: datetime
