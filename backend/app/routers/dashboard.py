from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.cow import Cow, CowStatus
from app.models.member import Member
from app.models.milk import MilkRecord
from app.models.feed import FeedStock
from app.models.waste import WasteBatch, WasteBatchStatus
from app.models.user import User
from app.schemas.dashboard import DashboardSummary
from app.dependencies import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get aggregated KPIs for the dashboard."""
    settings = get_settings()
    
    # Cows
    total_cows = db.query(Cow).count()
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    sick_cows = db.query(Cow).filter(Cow.status == CowStatus.SICK).count()
    
    # Members
    total_members = db.query(Member).count()
    
    # Milk
    today = date.today()
    today_milk = db.query(func.sum(MilkRecord.liters)).filter(
        func.date(MilkRecord.created_at) == today
    ).scalar() or 0.0
    
    # Feed Stock (ledger sum) — cast from Decimal to float
    feed_stock = float(db.query(func.sum(FeedStock.change_kg)).scalar() or 0.0)
    
    # Feed days remaining
    daily_feed_req = active_cows * settings.DEFAULT_FEED_KG_PER_COW_PER_DAY
    feed_days_remaining = feed_stock / daily_feed_req if daily_feed_req > 0 else 999.0
    feed_is_critical = feed_days_remaining <= settings.FEED_CRITICAL_DAYS_THRESHOLD
    
    # Fertilizer — cast from Decimal to float
    fertilizer_ready = float(db.query(func.sum(WasteBatch.estimated_fertilizer_kg)).filter(
        WasteBatch.status == WasteBatchStatus.READY
    ).scalar() or 0.0)
    
    # Revenue (Mock for now, can be implemented by querying Transaction/Payment tables later)
    # Since we don't have a generic transaction table in the current context yet.
    today_revenue = 0.0
    month_revenue = 0.0

    return DashboardSummary(
        total_cows=total_cows,
        active_cows=active_cows,
        sick_cows=sick_cows,
        total_members=total_members,
        today_milk_liters=today_milk,
        feed_stock_kg=feed_stock,
        feed_days_remaining=feed_days_remaining,
        feed_is_critical=feed_is_critical,
        fertilizer_ready_kg=fertilizer_ready,
        today_revenue=today_revenue,
        month_revenue=month_revenue
    )
