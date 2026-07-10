"""Daily report endpoint — GET /reports/daily?date=YYYY-MM-DD"""

from datetime import date as date_type
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.cow import Cow, CowStatus
from app.models.milk import MilkRecord
from app.models.feed import FeedStock
from app.models.waste import WasteBatch, WasteBatchStatus
from app.models.market_price import DailyMarketPrice, MarketItemType
from app.models.user import User
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional


class DailyReportResponse(BaseModel):
    date: date_type
    # Milk
    total_milk_liters: float
    # Feed
    feed_stock_kg: float
    feed_consumed_kg: float  # estimated based on cow count
    # Revenue
    milk_revenue: float
    fertilizer_revenue: float
    total_revenue: float
    # Expenses
    feed_expense: float
    total_expense: float
    # Net
    net_profit: float
    # Counts
    active_cows: int
    sick_cows: int
    total_members_active: int
    # Prices used
    susu_price_per_liter: Optional[float]
    pakan_price_per_kg: Optional[float]
    pupuk_price_per_kg: Optional[float]


router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/daily", response_model=DailyReportResponse)
def get_daily_report(
    date: date_type = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns aggregated daily summary for reporting and PDF generation."""
    if date is None:
        date = date_type.today()

    # --- Prices ---
    prices = db.query(DailyMarketPrice).filter(DailyMarketPrice.date == date).all()
    price_map = {p.item_type: float(p.price_per_unit) for p in prices}
    susu_price = price_map.get(MarketItemType.SUSU, 0.0)
    pakan_price = price_map.get(MarketItemType.PAKAN, 0.0)
    pupuk_price = price_map.get(MarketItemType.PUPUK, 0.0)

    # --- Cows ---
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    sick_cows = db.query(Cow).filter(Cow.status == CowStatus.SICK).count()

    # --- Milk ---
    total_milk = float(
        db.query(func.sum(MilkRecord.liters))
        .filter(func.date(MilkRecord.created_at) == date)
        .scalar() or 0.0
    )

    # --- Feed ---
    feed_stock = float(db.query(func.sum(FeedStock.change_kg)).scalar() or 0.0)
    daily_feed_consumed = active_cows * 10.0  # default 10kg/cow/day

    # --- Fertilizer sold today (SOLD status, rough estimate) ---
    fertilizer_sold_kg = float(
        db.query(func.sum(WasteBatch.estimated_fertilizer_kg))
        .filter(WasteBatch.status == WasteBatchStatus.SOLD)
        .scalar() or 0.0
    )

    # --- Revenue ---
    milk_revenue = total_milk * susu_price
    fertilizer_revenue = fertilizer_sold_kg * pupuk_price
    total_revenue = milk_revenue + fertilizer_revenue

    # --- Expenses ---
    feed_expense = daily_feed_consumed * pakan_price
    total_expense = feed_expense

    net_profit = total_revenue - total_expense

    return DailyReportResponse(
        date=date,
        total_milk_liters=total_milk,
        feed_stock_kg=feed_stock,
        feed_consumed_kg=daily_feed_consumed,
        milk_revenue=milk_revenue,
        fertilizer_revenue=fertilizer_revenue,
        total_revenue=total_revenue,
        feed_expense=feed_expense,
        total_expense=total_expense,
        net_profit=net_profit,
        active_cows=active_cows,
        sick_cows=sick_cows,
        total_members_active=0,  # can wire later
        susu_price_per_liter=susu_price or None,
        pakan_price_per_kg=pakan_price or None,
        pupuk_price_per_kg=pupuk_price or None,
    )
