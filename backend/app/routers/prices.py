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
    
    # We might have multiple prices per item_type (one per supplier).
    # We want MIN for PAKAN, MAX for SUSU and PUPUK
    best_pakan = None
    best_susu = None
    best_pupuk = None
    
    for p in prices:
        if p.item_type == MarketItemType.PAKAN:
            # For PAKAN, we require a telegram supplier for POs
            if p.source.name == "TELEGRAM":
                if best_pakan is None or p.price_per_unit < best_pakan.price_per_unit:
                    best_pakan = p
        elif p.item_type == MarketItemType.SUSU:
            if best_susu is None or p.price_per_unit > best_susu.price_per_unit:
                best_susu = p
        elif p.item_type == MarketItemType.PUPUK:
            if best_pupuk is None or p.price_per_unit > best_pupuk.price_per_unit:
                best_pupuk = p
                
    if best_pakan:
        summary.pakan = MarketPriceResponse.model_validate(best_pakan)
    if best_susu:
        summary.susu = MarketPriceResponse.model_validate(best_susu)
    if best_pupuk:
        summary.pupuk = MarketPriceResponse.model_validate(best_pupuk)
            
    return summary
