"""Waste models — waste batches, fermentation tracking, fertilizer offers."""

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WasteBatchStatus(str, enum.Enum):
    COLLECTING = "COLLECTING"
    FERMENTING = "FERMENTING"
    READY = "READY"
    SOLD = "SOLD"


class WasteBatch(Base):
    """A batch of waste going through the fermentation lifecycle."""

    __tablename__ = "waste_batches"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    barn_id: Mapped[int] = mapped_column(ForeignKey("barns.id"), nullable=False, index=True)
    batch_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    raw_waste_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estimated_fertilizer_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[WasteBatchStatus] = mapped_column(
        Enum(WasteBatchStatus, name="waste_batch_status", native_enum=False),
        nullable=False,
        default=WasteBatchStatus.COLLECTING,
        index=True,
    )
    fermentation_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    fermentation_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    barn = relationship("Barn", back_populates="waste_batches")

    def __repr__(self) -> str:
        return f"<WasteBatch id={self.id} code={self.batch_code!r} status={self.status.value}>"


class FertilizerOfferStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class FertilizerOffer(Base):
    """Sale offer for ready fertilizer, sent to buyer group via Telegram."""

    __tablename__ = "fertilizer_offers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    quantity_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[FertilizerOfferStatus] = mapped_column(
        Enum(FertilizerOfferStatus, name="fertilizer_offer_status", native_enum=False),
        nullable=False,
        default=FertilizerOfferStatus.OPEN,
        index=True,
    )
    accepted_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telegram_message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    recipients = relationship("FertilizerOfferRecipient", back_populates="offer", lazy="selectin")


class FertilizerOfferRecipient(Base):
    """Tracks which buyers received a fertilizer sale broadcast."""

    __tablename__ = "fertilizer_offer_recipients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    offer_id: Mapped[int] = mapped_column(ForeignKey("fertilizer_offers.id"), nullable=False)
    telegram_user_id: Mapped[str] = mapped_column(String(50), nullable=False)
    telegram_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    responded: Mapped[bool] = mapped_column(default=False)
    response: Mapped[str | None] = mapped_column(String(20), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    offer = relationship("FertilizerOffer", back_populates="recipients")
