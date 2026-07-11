"""Daily report endpoint — GET /reports/daily?date=YYYY-MM-DD"""

from datetime import date as date_type
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional

from app.services.report_generator import get_daily_report_data, get_financial_summary_data, get_shu_distribution_data

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
        
    data = get_daily_report_data(db, date)
    return DailyReportResponse(**data)


@router.get("/financial-summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_financial_summary_data(db)
    return FinancialSummaryResponse(**data)


@router.get("/shu-distribution", response_model=ShuDistributionResponse)
def get_shu_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_shu_distribution_data(db)
    return ShuDistributionResponse(**data)
