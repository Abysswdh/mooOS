"""Telegram contact model — replaces hardcoded ABYASA_ID, AXEL_ID."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TelegramContactRole(str, enum.Enum):
    PJ_KANDANG = "PJ_KANDANG"
    SUPPLIER_PAKAN = "SUPPLIER_PAKAN"
    PEMBELI_SUSU = "PEMBELI_SUSU"
    PEMBELI_PUPUK = "PEMBELI_PUPUK"


class TelegramContact(Base):
    """Dynamic Telegram user registry — no more hardcoded chat IDs."""

    __tablename__ = "telegram_contacts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    telegram_user_id: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    telegram_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    role: Mapped[TelegramContactRole] = mapped_column(
        Enum(TelegramContactRole, name="telegram_contact_role", native_enum=False),
        nullable=False,
    )
    barn_name: Mapped[str | None] = mapped_column(String(100), nullable=True)  # for PJ Kandang
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<TelegramContact id={self.id} "
            f"tg_id={self.telegram_user_id!r} role={self.role.value}>"
        )
