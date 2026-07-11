"""Invoice model — auto-generated after auction winner is determined."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Invoice(Base):
    """PDF invoice record generated after a successful auction."""

    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    invoice_number: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)

    # Auction reference
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)   # PAKAN / SUSU / PUPUK
    item_id: Mapped[int] = mapped_column(Integer, nullable=False)         # FeedOrder.id / MilkOffer.id / etc.
    item_code: Mapped[str] = mapped_column(String(80), nullable=False)    # PO-FEED-xxx / OF-MILK-xxx

    # Buyer info (from winning AuctionBid)
    buyer_telegram_id: Mapped[str] = mapped_column(String(50), nullable=False)
    buyer_name: Mapped[str] = mapped_column(String(150), nullable=False)

    # Financials
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")
    price_per_unit: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    payment_deadline: Mapped[date] = mapped_column(Date, nullable=False)

    # PDF delivery
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<Invoice {self.invoice_number} buyer={self.buyer_name} total={self.total_amount}>"
