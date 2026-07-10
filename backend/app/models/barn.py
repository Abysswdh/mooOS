"""Barn model — proper barn entity (replaces string column on cows)."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Barn(Base):
    __tablename__ = "barns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    capacity: Mapped[int] = mapped_column(default=50)
    caretaker_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    cows = relationship("Cow", back_populates="barn", lazy="selectin")
    daily_logs = relationship("DailyBarnLog", back_populates="barn", lazy="dynamic")
    waste_batches = relationship("WasteBatch", back_populates="barn", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Barn id={self.id} name={self.name!r}>"
