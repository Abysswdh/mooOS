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
    
    new_order = FeedOrder(
        po_number=po_number,
        quantity_kg=order_in.quantity_kg,
        feed_type=order_in.feed_type,
        max_price_per_kg=order_in.max_price_per_kg,
        total_max_price=total_max_price,
        status=FeedOrderStatus.OPEN,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    if order_in.supplier_telegram_id:
        from app.models.feed import FeedOrderRecipient
        recipient = FeedOrderRecipient(
            order_id=new_order.id,
            telegram_user_id=order_in.supplier_telegram_id
        )
        db.add(recipient)
        db.commit()
        
        from app.bot import bot
        if bot:
            msg = (
                f"📦 *Purchase Order Baru*\n\n"
                f"Pembeli: Koperasi Harapan Baru\n"
                f"Jenis Pakan: {order_in.feed_type}\n"
                f"Jumlah: {order_in.quantity_kg:,.0f} kg\n"
                f"Harga: Rp{order_in.max_price_per_kg:,.0f}/kg\n"
                f"Total: Rp{total_max_price:,.0f}\n\n"
                f"Balas:\n"
                f"`1` = Terima PO\n"
                f"`2` = Tolak PO"
            )
            try:
                bot.send_message(order_in.supplier_telegram_id, msg, parse_mode="Markdown")
            except Exception as e:
                print(f"Failed to send PO to Telegram: {e}")

    return new_order

@router.post("/orders/{order_id}/pay", response_model=FeedOrderResponse)
def pay_feed_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark PO as PAID and notify supplier via Telegram."""
    order = db.query(FeedOrder).filter(FeedOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status != FeedOrderStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Only CONFIRMED orders can be paid")
        
    order.status = FeedOrderStatus.PAID
    db.commit()
    db.refresh(order)
    
    # Notify supplier via Telegram that payment has been made
    try:
        from app.models.feed import FeedOrderRecipient
        from app.bot import bot
        if bot:
            recipient = db.query(FeedOrderRecipient).filter(
                FeedOrderRecipient.order_id == order.id,
                FeedOrderRecipient.response == "ACCEPT"
            ).first()
            if recipient:
                msg = (
                    f"💰 *Pembayaran Diterima!*\n\n"
                    f"PO: {order.po_number}\n"
                    f"Jenis Pakan: {order.feed_type}\n"
                    f"Jumlah: {order.quantity_kg:,.0f} kg\n"
                    f"Total: Rp{float(order.total_max_price):,.0f}\n\n"
                    f"Pembayaran sudah kami transfer. Mohon segera kirimkan barang!"
                )
                bot.send_message(recipient.telegram_user_id, msg, parse_mode="Markdown")
    except Exception as e:
        print(f"Failed to notify supplier of payment: {e}")
    
    return order

@router.post("/orders/{order_id}/deliver", response_model=FeedOrderResponse)
def deliver_feed_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark PO as DELIVERED, increase FeedStock, and notify supplier."""
    order = db.query(FeedOrder).filter(FeedOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status != FeedOrderStatus.PAID:
        raise HTTPException(status_code=400, detail="Only PAID orders can be delivered")
        
    order.status = FeedOrderStatus.DELIVERED
    
    # Increase stock - fix: include required date field
    new_stock = FeedStock(
        date=datetime.now(),
        change_kg=float(order.quantity_kg),
        reason=f"Penerimaan PO {order.po_number}",
        reference_id=order.id,
    )
    db.add(new_stock)
    db.commit()
    db.refresh(order)
    
    # Notify supplier via Telegram that delivery has been confirmed
    try:
        from app.models.feed import FeedOrderRecipient
        from app.bot import bot
        if bot:
            recipient = db.query(FeedOrderRecipient).filter(
                FeedOrderRecipient.order_id == order.id,
                FeedOrderRecipient.response == "ACCEPT"
            ).first()
            if recipient:
                msg = (
                    f"✅ *Barang Diterima!*\n\n"
                    f"PO: {order.po_number}\n"
                    f"Jenis Pakan: {order.feed_type}\n"
                    f"Jumlah: {order.quantity_kg:,.0f} kg\n"
                    f"Total: Rp{float(order.total_max_price):,.0f}\n\n"
                    f"Terima kasih! Stok pakan kami telah diperbarui. Transaksi selesai!"
                )
                bot.send_message(recipient.telegram_user_id, msg, parse_mode="Markdown")
    except Exception as e:
        print(f"Failed to notify supplier of delivery: {e}")
    
    return order
