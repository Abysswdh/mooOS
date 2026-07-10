"""Market price model — daily prices for pakan, susu, pupuk."""

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MarketItemType(str, enum.Enum):
    PAKAN = "PAKAN"
    SUSU = "SUSU"
    PUPUK = "PUPUK"


class PriceSource(str, enum.Enum):
    ADMIN = "ADMIN"
    AUTO = "AUTO"
    TELEGRAM = "TELEGRAM"


class DailyMarketPrice(Base):
    """Daily prices — replaces ALL hardcoded price constants from v1."""

    __tablename__ = "daily_market_prices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    item_type: Mapped[MarketItemType] = mapped_column(
        Enum(MarketItemType, name="market_item_type", native_enum=False),
        nullable=False,
    )
    price_per_unit: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")
    source: Mapped[PriceSource] = mapped_column(
        Enum(PriceSource, name="price_source", native_enum=False),
        nullable=False,
        default=PriceSource.ADMIN,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<DailyMarketPrice date={self.date} "
            f"item={self.item_type.value} price={self.price_per_unit}>"
        )
