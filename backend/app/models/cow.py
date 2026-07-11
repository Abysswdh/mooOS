"""Cow model — cattle with status lifecycle, linked to member + barn."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CowStatus(str, enum.Enum):
    LOOKING_FOR_CARETAKER = "LOOKING_FOR_CARETAKER"
    AVAILABLE = "AVAILABLE"
    SICK = "SICK"
    DEAD = "DEAD"
    SOLD = "SOLD"


class CowType(str, enum.Enum):
    DAIRY = "DAIRY"
    BEEF = "BEEF"
    BREEDING = "BREEDING"


class CowGender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class Cow(Base):
    __tablename__ = "cows"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    breed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gender: Mapped[CowGender] = mapped_column(
        Enum(CowGender, name="cow_gender", native_enum=False),
        nullable=False,
        default=CowGender.FEMALE,
    )
    cow_type: Mapped[CowType] = mapped_column(
        Enum(CowType, name="cow_type", native_enum=False),
        nullable=False,
        default=CowType.DAIRY,
    )
    weight_kg: Mapped[float] = mapped_column(Numeric(8, 2), default=0)
    birth_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CowStatus] = mapped_column(
        Enum(CowStatus, name="cow_status", native_enum=False),
        nullable=False,
        default=CowStatus.LOOKING_FOR_CARETAKER,
        index=True,
    )

    # Foreign keys
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("members.id"), nullable=True)
    barn_id: Mapped[int | None] = mapped_column(ForeignKey("barns.id"), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner = relationship("Member", back_populates="cows")
    barn = relationship("Barn", back_populates="cows")
    milk_records = relationship("MilkRecord", back_populates="cow", lazy="dynamic")
    health_logs = relationship("HealthLog", back_populates="cow", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Cow id={self.id} code={self.code!r} status={self.status.value}>"
