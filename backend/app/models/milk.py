"""Milk models — daily production records and daily barn logs."""

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MilkRecord(Base):
    """Per-cow daily milk production record (entered by PJ via Telegram)."""

    __tablename__ = "milk_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cow_id: Mapped[int] = mapped_column(ForeignKey("cows.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    liters: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    recorded_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    cow = relationship("Cow", back_populates="milk_records")

    def __repr__(self) -> str:
        return f"<MilkRecord cow_id={self.cow_id} date={self.date} liters={self.liters}>"


class DailyBarnLogType(str, enum.Enum):
    PAKAN = "PAKAN"
    SUSU = "SUSU"
    LIMBAH = "LIMBAH"


class DailyBarnLog(Base):
    """Tracks whether a daily task (pakan/susu/limbah) was completed for a barn."""

    __tablename__ = "daily_barn_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    barn_id: Mapped[int] = mapped_column(ForeignKey("barns.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    log_type: Mapped[DailyBarnLogType] = mapped_column(
        Enum(DailyBarnLogType, name="daily_barn_log_type", native_enum=False),
        nullable=False,
    )
    reported_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    barn = relationship("Barn", back_populates="daily_logs")

    def __repr__(self) -> str:
        return f"<DailyBarnLog barn_id={self.barn_id} date={self.date} type={self.log_type.value}>"
