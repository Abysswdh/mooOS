"""System settings model — singleton row for koperasi config."""

from sqlalchemy import Boolean, Integer, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemSettings(Base):
    """Singleton settings row (always id=1)."""

    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)

    koperasi_name: Mapped[str] = mapped_column(String(200), nullable=False, default="KUD Sapi Perah Sejahtera")
    address: Mapped[str] = mapped_column(String(500), nullable=False, default="Jl. Peternakan No. 1, Lembang")

    enable_telegram_notif: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    auto_price_fluctuation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    simpanan_pokok_default: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=100000.0)
    simpanan_wajib_per_sapi: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=50000.0)

    def __repr__(self) -> str:
        return f"<SystemSettings id={self.id} name={self.koperasi_name!r}>"
