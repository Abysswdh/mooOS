"""Notification model — persistent notification history for SSE push."""

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    MILK_REPORT = "MILK_REPORT"
    FEED_REPORT = "FEED_REPORT"
    WASTE_REPORT = "WASTE_REPORT"
    SICK_COW = "SICK_COW"
    DEAD_COW = "DEAD_COW"
    PO_ACCEPTED = "PO_ACCEPTED"
    PO_REJECTED = "PO_REJECTED"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    OFFER_REJECTED = "OFFER_REJECTED"
    COW_ACCEPTED = "COW_ACCEPTED"
    COW_REJECTED = "COW_REJECTED"
    SALE_CONFIRMED = "SALE_CONFIRMED"
    SYSTEM = "SYSTEM"


class Notification(Base):
    """Persistent notification — SSE streams these to the web dashboard."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", native_enum=False),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification id={self.id} type={self.type.value} read={self.read}>"
