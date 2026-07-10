from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.feed import FeedStock, FeedOrder, FeedOrderStatus
from app.models.cow import Cow, CowStatus
from app.models.user import User
from app.schemas.feed import FeedStockResponse, FeedOrderResponse, FeedOrderCreate, FeedOrderListResponse
from app.dependencies import get_current_user
from app.config import get_settings
from app.services.auction import schedule_auction_close
from app.models.auction import AuctionItemType

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("/stock", response_model=FeedStockResponse)
def get_feed_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current feed stock summary."""
    settings = get_settings()
    
    current_stock = float(db.query(func.sum(FeedStock.change_kg)).scalar() or 0.0)
    
    # Calculate daily consumption
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    daily_consumption = active_cows * settings.DEFAULT_FEED_KG_PER_COW_PER_DAY
    
    days_remaining = current_stock / daily_consumption if daily_consumption > 0 else 999.0
    is_critical = days_remaining <= settings.FEED_CRITICAL_DAYS_THRESHOLD
    
    return FeedStockResponse(
        current_stock_kg=current_stock,
        daily_consumption_kg=daily_consumption,
        days_remaining=days_remaining,
        is_critical=is_critical
    )


@router.get("/orders", response_model=FeedOrderListResponse)
def get_feed_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List feed purchase orders."""
    query = db.query(FeedOrder).order_by(FeedOrder.created_at.desc())
    total = query.count()
    orders = query.offset(skip).limit(limit).all()
    
    return FeedOrderListResponse(items=orders, total=total)


@router.post("/orders", response_model=FeedOrderResponse, status_code=status.HTTP_201_CREATED)
def create_feed_order(
    order_in: FeedOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new feed purchase order (PO)."""
    # Generate PO number
    timestamp_str = datetime.now().strftime("%Y%m%d%H%M")
    po_number = f"PO-FEED-{timestamp_str}"
    
    total_max_price = order_in.quantity_kg * order_in.max_price_per_kg
    
    expires_at = None
    if order_in.duration_minutes:
        expires_at = datetime.now() + timedelta(minutes=order_in.duration_minutes)

    new_order = FeedOrder(
        po_number=po_number,
        quantity_kg=order_in.quantity_kg,
        feed_type=order_in.feed_type,
        max_price_per_kg=order_in.max_price_per_kg,
        total_max_price=total_max_price,
        status=FeedOrderStatus.OPEN,
        expires_at=expires_at
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    if order_in.duration_minutes:
        schedule_auction_close(AuctionItemType.PAKAN, new_order.id, order_in.duration_minutes)
        from app.bot import bot
        settings = get_settings()
        if bot and settings.TELEGRAM_GROUP_PAKAN:
            msg = (
                f"📢 *Lelang Pembelian Pakan*\n\n"
                f"MooOS butuh {order_in.quantity_kg} kg pakan {order_in.feed_type}.\n"
                f"Batas maksimal harga: Rp{order_in.max_price_per_kg:,.0f}/kg.\n"
                f"Waktu lelang: {order_in.duration_minutes} menit.\n\n"
                f"Kirim penawaran Anda dengan format:\n"
                f"`tawar {po_number} <harga_per_kg>`"
            )
            try:
                bot.send_message(settings.TELEGRAM_GROUP_PAKAN, msg, parse_mode="Markdown")
            except Exception as e:
                print(f"Failed to announce auction to Telegram: {e}")

    return new_order
