"""Universal auction bid tracking."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuctionItemType(str, enum.Enum):
    PAKAN = "PAKAN"
    SUSU = "SUSU"
    PUPUK = "PUPUK"


class AuctionBid(Base):
    """Tracks bids submitted by suppliers/buyers via Telegram."""

    __tablename__ = "auction_bids"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    item_type: Mapped[AuctionItemType] = mapped_column(
        Enum(AuctionItemType, name="auction_item_type", native_enum=False),
        nullable=False,
        index=True,
    )
    item_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    item_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    telegram_user_id: Mapped[str] = mapped_column(String(50), nullable=False)
    telegram_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price_per_unit: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<AuctionBid {self.item_type.value} {self.item_code} price={self.price_per_unit}>"
