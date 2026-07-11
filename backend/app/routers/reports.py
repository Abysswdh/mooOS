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
from app.models.member import Member

class PieData(BaseModel):
    name: str
    value: float
    color: Optional[str] = None

class FinancialSummaryResponse(BaseModel):
    income: list[PieData]
    expenses: list[PieData]
    net_profit: float

class ShuDistributionItem(BaseModel):
    member_name: str
    total_cows: int
    total_milk_contribution_liters: float
    shu_amount: float

class ShuDistributionResponse(BaseModel):
    ratios: dict[str, int]
    distribution: list[ShuDistributionItem]

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

@router.get("/financial-summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_milk = float(db.query(func.sum(MilkRecord.liters)).scalar() or 0.0)
    milk_rev = total_milk * 7000.0

    fert = float(
        db.query(func.sum(WasteBatch.estimated_fertilizer_kg))
        .filter(WasteBatch.status == WasteBatchStatus.SOLD)
        .scalar() or 0.0
    )
    fert_rev = fert * 1500.0

    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    feed_exp = active_cows * 10.0 * 30 * 5000.0
    salary_exp = 10000000.0
    maintenance_exp = 3000000.0
    utilities_exp = 2000000.0

    net_profit = (milk_rev + fert_rev) - (feed_exp + salary_exp + maintenance_exp + utilities_exp)

    return FinancialSummaryResponse(
        income=[
            PieData(name="Penjualan Susu", value=milk_rev, color="#3b82f6"),
            PieData(name="Penjualan Pupuk", value=fert_rev, color="#10b981"),
        ],
        expenses=[
            PieData(name="Beli Pakan", value=feed_exp, color="#f59e0b"),
            PieData(name="Biaya Gaji", value=salary_exp, color="#ef4444"),
            PieData(name="Perawatan Kandang", value=maintenance_exp, color="#8b5cf6"),
            PieData(name="Listrik & Fasilitas", value=utilities_exp, color="#ec4899"),
        ],
        net_profit=net_profit
    )


@router.get("/shu-distribution", response_model=ShuDistributionResponse)
def get_shu_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = db.query(Member).filter(Member.is_active == True).all()

    total_milk = float(db.query(func.sum(MilkRecord.liters)).scalar() or 0.0)
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    
    net_profit = (total_milk * 7000.0) - (active_cows * 10.0 * 30 * 5000.0) - 15000000.0
    member_pool = max(net_profit * 0.7, 0)

    total_milk_factor = total_milk if total_milk > 0 else 1.0

    distribution = []
    for m in members:
        m_cows = db.query(Cow).filter(Cow.owner_id == m.id).all()
        m_cow_ids = [c.id for c in m_cows]

        m_milk = 0.0
        if m_cow_ids:
            m_milk = float(
                db.query(func.sum(MilkRecord.liters))
                .filter(MilkRecord.cow_id.in_(m_cow_ids))
                .scalar() or 0.0
            )

        proportion = m_milk / total_milk_factor
        shu = member_pool * proportion

        distribution.append(
            ShuDistributionItem(
                member_name=m.name,
                total_cows=len(m_cow_ids),
                total_milk_contribution_liters=m_milk,
                shu_amount=shu
            )
        )

    distribution.sort(key=lambda x: x.shu_amount, reverse=True)

    return ShuDistributionResponse(
        ratios={"koperasi_cut_percent": 30, "member_cut_percent": 70},
        distribution=distribution
    )
