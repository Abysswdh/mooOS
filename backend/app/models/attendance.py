"""Attendance model — Absen masuk/pulang for admin users."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttendanceLog(Base):
    """Clock in/out records for admin shift tracking."""

    __tablename__ = "attendance_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    clock_in: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    clock_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    daily_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="attendance_logs")

    def __repr__(self) -> str:
        return f"<AttendanceLog id={self.id} user_id={self.user_id} in={self.clock_in}>"
