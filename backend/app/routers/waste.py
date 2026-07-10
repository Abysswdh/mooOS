from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.waste import WasteBatch, WasteBatchStatus, FertilizerOffer, FertilizerOfferStatus
from app.models.barn import Barn
from app.models.user import User
from app.schemas.waste import (
    WasteBatchCreate, WasteBatchResponse, WasteBatchListResponse, WasteSummaryResponse,
    FertilizerOfferCreate, FertilizerOfferResponse, FertilizerOfferListResponse
)
from app.dependencies import get_current_user
from app.services.auction import schedule_auction_close
from app.models.auction import AuctionItemType

waste_router = APIRouter(prefix="/waste", tags=["Waste"])
fertilizer_router = APIRouter(prefix="/fertilizer", tags=["Fertilizer"])


@waste_router.post("/batches", response_model=WasteBatchResponse, status_code=status.HTTP_201_CREATED)
def create_waste_batch(
    batch_in: WasteBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new waste batch."""
    barn = db.query(Barn).filter(Barn.id == batch_in.barn_id).first()
    if not barn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kandang tidak ditemukan")
        
    timestamp_str = datetime.now().strftime("%Y%m%d%H%M")
    batch_code = f"WB-{timestamp_str}"
    
    # Simple estimation: 1kg waste -> 0.6kg fertilizer
    estimated_fertilizer = batch_in.raw_waste_kg * 0.6
    
    new_batch = WasteBatch(
        barn_id=batch_in.barn_id,
        batch_code=batch_code,
        raw_waste_kg=batch_in.raw_waste_kg,
        estimated_fertilizer_kg=estimated_fertilizer,
        status=WasteBatchStatus.COLLECTING
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch


@waste_router.get("/batches", response_model=WasteBatchListResponse)
def get_waste_batches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List waste batches."""
    query = db.query(WasteBatch).order_by(WasteBatch.created_at.desc())
    total = query.count()
    batches = query.offset(skip).limit(limit).all()
    return WasteBatchListResponse(items=batches, total=total)


@waste_router.get("/summary", response_model=WasteSummaryResponse)
def get_waste_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get waste processing summary."""
    total_raw = float(db.query(func.sum(WasteBatch.raw_waste_kg)).scalar() or 0.0)
    total_ready = float(db.query(func.sum(WasteBatch.estimated_fertilizer_kg)).filter(
        WasteBatch.status == WasteBatchStatus.READY
    ).scalar() or 0.0)
    
    fermenting = db.query(WasteBatch).filter(WasteBatch.status == WasteBatchStatus.FERMENTING).count()
    ready = db.query(WasteBatch).filter(WasteBatch.status == WasteBatchStatus.READY).count()
    
    return WasteSummaryResponse(
        total_raw_waste_kg=total_raw,
        total_fertilizer_ready_kg=total_ready,
        batches_fermenting=fermenting,
        batches_ready=ready
    )


@fertilizer_router.post("/offers", response_model=FertilizerOfferResponse, status_code=status.HTTP_201_CREATED)
def create_fertilizer_offer(
    offer_in: FertilizerOfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new fertilizer offer."""
    total_price = offer_in.quantity_kg * offer_in.price_per_kg
    
    expires_at = None
    if offer_in.duration_minutes:
        expires_at = datetime.now() + timedelta(minutes=offer_in.duration_minutes)

    new_offer = FertilizerOffer(
        quantity_kg=offer_in.quantity_kg,
        price_per_kg=offer_in.price_per_kg,
        total_price=total_price,
        status=FertilizerOfferStatus.OPEN,
        expires_at=expires_at
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)

    if offer_in.duration_minutes:
        schedule_auction_close(AuctionItemType.PUPUK, new_offer.id, offer_in.duration_minutes)
        from app.bot import bot
        from app.config import get_settings
        settings = get_settings()
        if bot and settings.TELEGRAM_GROUP_PUPUK:
            offer_code = f"OF-FERT-{new_offer.id}"
            msg = (
                f"📢 *Lelang Penjualan Pupuk*\n\n"
                f"MooOS menjual {offer_in.quantity_kg} kg pupuk kompos.\n"
                f"Harga dasar/min: Rp{offer_in.price_per_kg:,.0f}/kg.\n"
                f"Waktu lelang: {offer_in.duration_minutes} menit.\n\n"
                f"Kirim penawaran Anda dengan format:\n"
                f"`tawar {offer_code} <harga_per_kg>`"
            )
            try:
                bot.send_message(settings.TELEGRAM_GROUP_PUPUK, msg, parse_mode="Markdown")
            except Exception as e:
                print(f"Failed to announce auction to Telegram: {e}")

    return new_offer


@fertilizer_router.get("/offers", response_model=FertilizerOfferListResponse)
def get_fertilizer_offers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List fertilizer offers."""
    query = db.query(FertilizerOffer).order_by(FertilizerOffer.created_at.desc())
    total = query.count()
    offers = query.offset(skip).limit(limit).all()
    return FertilizerOfferListResponse(items=offers, total=total)
