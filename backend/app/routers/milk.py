from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.milk import MilkRecord
from app.models.milk_offer import MilkOffer, MilkOfferStatus
from app.models.cow import Cow, CowStatus
from app.models.user import User
from app.schemas.milk import (
    MilkRecordCreate, MilkRecordResponse, MilkRecordListResponse, MilkSummaryResponse,
    MilkOfferCreate, MilkOfferResponse, MilkOfferListResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/milk", tags=["Milk"])


@router.post("/records", response_model=MilkRecordResponse, status_code=status.HTTP_201_CREATED)
def create_milk_record(
    record_in: MilkRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record milk production."""
    cow = db.query(Cow).filter(Cow.id == record_in.cow_id).first()
    if not cow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sapi tidak ditemukan")
        
    new_record = MilkRecord(
        cow_id=record_in.cow_id,
        date=record_in.date,
        liters=record_in.liters,
        recorded_by=current_user.name,
    )
    # assuming we just use created_at for it.
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/records", response_model=MilkRecordListResponse)
def get_milk_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List milk records."""
    query = db.query(MilkRecord).order_by(MilkRecord.created_at.desc())
    total = query.count()
    records = query.offset(skip).limit(limit).all()
    
    # We need to map `liters` instead of `volume_liters` for response because of schema diff
    response_items = []
    for r in records:
        resp = MilkRecordResponse(
            id=r.id,
            cow_id=r.cow_id,
            date=r.created_at.date(),
            liters=r.liters,
            recorded_by=r.recorded_by,
            created_at=r.created_at
        )
        response_items.append(resp)
        
    return MilkRecordListResponse(items=response_items, total=total)


@router.get("/summary", response_model=MilkSummaryResponse)
def get_milk_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get milk production summary."""
    today = date.today()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    today_total = db.query(func.sum(MilkRecord.liters)).filter(func.date(MilkRecord.created_at) == today).scalar() or 0.0
    yesterday_total = db.query(func.sum(MilkRecord.liters)).filter(func.date(MilkRecord.created_at) == yesterday).scalar() or 0.0
    week_total = db.query(func.sum(MilkRecord.liters)).filter(func.date(MilkRecord.created_at) >= week_ago).scalar() or 0.0
    month_total = db.query(func.sum(MilkRecord.liters)).filter(func.date(MilkRecord.created_at) >= month_ago).scalar() or 0.0
    
    active_dairy_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    
    return MilkSummaryResponse(
        today_total_liters=today_total,
        yesterday_total_liters=yesterday_total,
        week_total_liters=week_total,
        month_total_liters=month_total,
        active_dairy_cows=active_dairy_cows
    )


@router.get("/offers", response_model=MilkOfferListResponse)
def get_milk_offers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List milk offers to buyers."""
    query = db.query(MilkOffer).order_by(MilkOffer.created_at.desc())
    total = query.count()
    offers = query.offset(skip).limit(limit).all()
    return MilkOfferListResponse(items=offers, total=total)


@router.post("/offers", response_model=MilkOfferResponse, status_code=status.HTTP_201_CREATED)
def create_milk_offer(
    offer_in: MilkOfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new milk offer."""
    total_price = offer_in.quantity_liters * offer_in.price_per_liter
    
    new_offer = MilkOffer(
        quantity_liters=offer_in.quantity_liters,
        price_per_liter=offer_in.price_per_liter,
        total_price=total_price,
        min_order_liters=offer_in.min_order_liters,
        status=MilkOfferStatus.OPEN
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer
