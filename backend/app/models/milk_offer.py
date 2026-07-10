"""Milk offer model — sale offers sent to buyer group via Telegram."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MilkOfferStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class MilkOffer(Base):
    """Daily milk sale offer, broadcast to buyer group."""

    __tablename__ = "milk_offers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    quantity_liters: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    price_per_liter: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    min_order_liters: Mapped[float] = mapped_column(Numeric(10, 2), default=50)
    status: Mapped[MilkOfferStatus] = mapped_column(
        Enum(MilkOfferStatus, name="milk_offer_status", native_enum=False),
        nullable=False,
        default=MilkOfferStatus.OPEN,
        index=True,
    )
    accepted_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    accepted_quantity: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    telegram_message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    recipients = relationship("MilkOfferRecipient", back_populates="offer", lazy="selectin")


class MilkOfferRecipient(Base):
    """Tracks which buyers received a milk sale broadcast."""

    __tablename__ = "milk_offer_recipients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    offer_id: Mapped[int] = mapped_column(ForeignKey("milk_offers.id"), nullable=False)
    telegram_user_id: Mapped[str] = mapped_column(String(50), nullable=False)
    telegram_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    responded: Mapped[bool] = mapped_column(default=False)
    response: Mapped[str | None] = mapped_column(String(20), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    offer = relationship("MilkOffer", back_populates="recipients")
