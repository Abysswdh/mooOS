"""Market price schemas — daily price input/output."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class MarketPriceCreate(BaseModel):
    date: date
    item_type: str  # PAKAN, SUSU, PUPUK
    price_per_unit: float
    unit: str = "kg"
    source: str = "ADMIN"


class MarketPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    item_type: str
    price_per_unit: float
    unit: str
    source: str
    supplier_telegram_id: str | None = None
    supplier_name: str | None = None
    created_at: datetime


class MarketPriceListResponse(BaseModel):
    items: list[MarketPriceResponse]
    total: int


class TodayPricesSummary(BaseModel):
    """Summary of today's prices for the dashboard price input modal."""
    date: date
    pakan: MarketPriceResponse | None = None
    susu: MarketPriceResponse | None = None
    pupuk: MarketPriceResponse | None = None
    is_auto_generated: bool = False
