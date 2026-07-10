from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.market_price import DailyMarketPrice, MarketItemType
from app.models.user import User
from app.schemas.market_price import (
    MarketPriceCreate, MarketPriceResponse, MarketPriceListResponse, TodayPricesSummary
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/prices", tags=["Market Prices"])


@router.post("", response_model=MarketPriceResponse, status_code=status.HTTP_201_CREATED)
def create_market_price(
    price_in: MarketPriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new market price."""
    new_price = DailyMarketPrice(
        date=price_in.date,
        item_type=price_in.item_type,
        price_per_unit=price_in.price_per_unit,
        unit=price_in.unit,
        source=price_in.source
    )
    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    return new_price


@router.get("", response_model=MarketPriceListResponse)
def get_market_prices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List market prices."""
    query = db.query(DailyMarketPrice).order_by(DailyMarketPrice.date.desc(), DailyMarketPrice.item_type)
    total = query.count()
    prices = query.offset(skip).limit(limit).all()
    return MarketPriceListResponse(items=prices, total=total)


@router.get("/today", response_model=TodayPricesSummary)
def get_today_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summary of today's prices."""
    today = date.today()
    prices = db.query(DailyMarketPrice).filter(DailyMarketPrice.date == today).all()
    
    summary = TodayPricesSummary(date=today, is_auto_generated=False)
    for p in prices:
        resp = MarketPriceResponse.model_validate(p)
        if p.item_type == MarketItemType.PAKAN:
            summary.pakan = resp
        elif p.item_type == MarketItemType.SUSU:
            summary.susu = resp
        elif p.item_type == MarketItemType.PUPUK:
            summary.pupuk = resp
            
    return summary
