"""Feed models — stock tracking and purchase orders."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FeedOrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    DELIVERED = "DELIVERED"


class FeedOrder(Base):
    """Purchase order for feed, sent to supplier group via Telegram."""

    __tablename__ = "feed_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    po_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    quantity_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    feed_type: Mapped[str] = mapped_column(String(100), nullable=False, default="Konsentrat")
    max_price_per_kg: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_max_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[FeedOrderStatus] = mapped_column(
        Enum(FeedOrderStatus, name="feed_order_status", native_enum=False),
        nullable=False,
        default=FeedOrderStatus.OPEN,
        index=True,
    )
    accepted_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    accepted_price_per_kg: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    telegram_message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    recipients = relationship("FeedOrderRecipient", back_populates="order", lazy="selectin")

    def __repr__(self) -> str:
        return f"<FeedOrder id={self.id} po={self.po_number!r} status={self.status.value}>"


class FeedOrderRecipient(Base):
    """Tracks which suppliers received a feed PO broadcast."""

    __tablename__ = "feed_order_recipients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("feed_orders.id"), nullable=False)
    telegram_user_id: Mapped[str] = mapped_column(String(50), nullable=False)
    telegram_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    responded: Mapped[bool] = mapped_column(default=False)
    response: Mapped[str | None] = mapped_column(String(20), nullable=True)  # ACCEPT / REJECT
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    order = relationship("FeedOrder", back_populates="recipients")


class FeedStock(Base):
    """Current feed stock ledger — each entry is a stock movement."""

    __tablename__ = "feed_stock"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    change_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)  # + incoming, - consumed
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FK to order if applicable
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
