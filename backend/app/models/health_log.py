"""Health log model — cow health history (replaces just setting status to SICK)."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HealthEventType(str, enum.Enum):
    SICK = "SICK"
    RECOVERED = "RECOVERED"
    TREATMENT = "TREATMENT"
    DEAD = "DEAD"
    CHECKUP = "CHECKUP"


class HealthLog(Base):
    """Tracks cow health events over time for audit trail."""

    __tablename__ = "health_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cow_id: Mapped[int] = mapped_column(ForeignKey("cows.id"), nullable=False, index=True)
    event_type: Mapped[HealthEventType] = mapped_column(
        Enum(HealthEventType, name="health_event_type", native_enum=False),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reported_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    cow = relationship("Cow", back_populates="health_logs")

    def __repr__(self) -> str:
        return f"<HealthLog id={self.id} cow_id={self.cow_id} event={self.event_type.value}>"
