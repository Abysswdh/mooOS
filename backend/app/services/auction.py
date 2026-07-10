import threading
from app.database import SessionLocal
from app.models.auction import AuctionBid, AuctionItemType
from app.models.feed import FeedOrder, FeedOrderStatus, FeedStock
from app.models.milk_offer import MilkOffer, MilkOfferStatus
from app.models.waste import FertilizerOffer, FertilizerOfferStatus
from app.bot import bot
from datetime import datetime

def schedule_auction_close(item_type: AuctionItemType, item_id: int, duration_minutes: int):
    """Schedule the auction to close after duration_minutes."""
    # Convert minutes to seconds
    duration_seconds = duration_minutes * 60
    timer = threading.Timer(duration_seconds, close_auction, args=(item_type, item_id))
    timer.daemon = True
    timer.start()

def close_auction(item_type: AuctionItemType, item_id: int):
    """Close the auction, find winner, update DB, and send notifications."""
    if not bot:
        print("Telegram bot not configured. Cannot close auction via Telegram.")
        return

    db = SessionLocal()
    try:
        # Find all bids for this item
        bids = db.query(AuctionBid).filter(
            AuctionBid.item_type == item_type,
            AuctionBid.item_id == item_id
        ).all()

        if not bids:
            # No bids received, expire the order
            expire_order(db, item_type, item_id)
            db.commit()
            return

        # Determine winner
        if item_type == AuctionItemType.PAKAN:
            # We want the LOWEST price
            winning_bid = min(bids, key=lambda b: float(b.price_per_unit))
        else:
            # For SUSU and PUPUK, we want the HIGHEST price
            winning_bid = max(bids, key=lambda b: float(b.price_per_unit))

        # Accept the winning bid
        accept_order(db, item_type, item_id, winning_bid)
        db.commit()

        # Send invoice via PC to the winner
        send_invoice_to_winner(winning_bid, item_type)
        
        # Announce in group (Optional, but good UX)
        announce_winner_to_group(winning_bid, item_type)
        
    except Exception as e:
        print(f"Error closing auction for {item_type.value} {item_id}: {e}")
        db.rollback()
    finally:
        db.close()


def expire_order(db, item_type: AuctionItemType, item_id: int):
    if item_type == AuctionItemType.PAKAN:
        order = db.query(FeedOrder).filter(FeedOrder.id == item_id).first()
        if order and order.status == FeedOrderStatus.OPEN:
            order.status = FeedOrderStatus.EXPIRED
    elif item_type == AuctionItemType.SUSU:
        offer = db.query(MilkOffer).filter(MilkOffer.id == item_id).first()
        if offer and offer.status == MilkOfferStatus.OPEN:
            offer.status = MilkOfferStatus.EXPIRED
    elif item_type == AuctionItemType.PUPUK:
        offer = db.query(FertilizerOffer).filter(FertilizerOffer.id == item_id).first()
        if offer and offer.status == FertilizerOfferStatus.OPEN:
            offer.status = FertilizerOfferStatus.EXPIRED


def accept_order(db, item_type: AuctionItemType, item_id: int, winning_bid: AuctionBid):
    now = datetime.now()
    if item_type == AuctionItemType.PAKAN:
        order = db.query(FeedOrder).filter(FeedOrder.id == item_id).first()
        if order:
            order.status = FeedOrderStatus.CONFIRMED
            order.accepted_by = winning_bid.telegram_username or winning_bid.telegram_user_id
            order.accepted_price_per_kg = winning_bid.price_per_unit
            order.confirmed_at = now
            # Note: We do NOT add FeedStock here yet. Stock is added when goods arrive.
            
    elif item_type == AuctionItemType.SUSU:
        offer = db.query(MilkOffer).filter(MilkOffer.id == item_id).first()
        if offer:
            offer.status = MilkOfferStatus.ACCEPTED
            offer.accepted_by = winning_bid.telegram_username or winning_bid.telegram_user_id
            offer.accepted_quantity = offer.quantity_liters # Assuming they buy all
            offer.total_price = winning_bid.price_per_unit * offer.quantity_liters
            offer.confirmed_at = now
            
    elif item_type == AuctionItemType.PUPUK:
        offer = db.query(FertilizerOffer).filter(FertilizerOffer.id == item_id).first()
        if offer:
            offer.status = FertilizerOfferStatus.ACCEPTED
            offer.accepted_by = winning_bid.telegram_username or winning_bid.telegram_user_id
            offer.total_price = winning_bid.price_per_unit * offer.quantity_kg
            offer.confirmed_at = now


def send_invoice_to_winner(bid: AuctionBid, item_type: AuctionItemType):
    unit = "liter" if item_type == AuctionItemType.SUSU else "kg"
    
    if item_type == AuctionItemType.PAKAN:
        title = "INVOICE PEMBELIAN PAKAN (MOOOS KOPERASI)"
        desc = "Terima kasih telah memenangkan lelang pengadaan pakan kami. Harap segera kirimkan pakan sesuai PO."
    elif item_type == AuctionItemType.SUSU:
        title = "INVOICE PENJUALAN SUSU (MOOOS KOPERASI)"
        desc = "Terima kasih telah memenangkan lelang pembelian susu kami. Harap segera lakukan pembayaran & pengambilan."
    else:
        title = "INVOICE PENJUALAN PUPUK (MOOOS KOPERASI)"
        desc = "Terima kasih telah memenangkan lelang pembelian pupuk kompos kami. Harap segera lakukan pembayaran & pengambilan."

    msg = (
        f"🧾 *{title}*\n\n"
        f"Kepada: {bid.telegram_username or bid.telegram_user_id}\n"
        f"Referensi: `{bid.item_code}`\n\n"
        f"{desc}\n\n"
        f"💰 *Harga Kesepakatan*: Rp{bid.price_per_unit:,.0f}/{unit}\n\n"
        f"_Ini adalah pesan otomatis dari Sistem MooOS._"
    )
    
    try:
        bot.send_message(bid.telegram_user_id, msg, parse_mode="Markdown")
        print(f"Invoice sent to {bid.telegram_user_id} for {bid.item_code}")
    except Exception as e:
        print(f"Failed to send PC invoice to {bid.telegram_user_id}. Did they start the bot? Error: {e}")

def announce_winner_to_group(bid: AuctionBid, item_type: AuctionItemType):
    from app.config import get_settings
    settings = get_settings()
    
    if item_type == AuctionItemType.PAKAN:
        group = settings.TELEGRAM_GROUP_PAKAN
    elif item_type == AuctionItemType.SUSU:
        group = settings.TELEGRAM_GROUP_SUSU
    else:
        group = settings.TELEGRAM_GROUP_PUPUK
        
    if not group:
        return
        
    winner_name = f"@{bid.telegram_username}" if bid.telegram_username else f"User {bid.telegram_user_id}"
    unit = "liter" if item_type == AuctionItemType.SUSU else "kg"
    
    msg = (
        f"🎉 *Lelang Ditutup!*\n\n"
        f"Ref: `{bid.item_code}`\n"
        f"Pemenang: {winner_name}\n"
        f"Harga Deal: Rp{bid.price_per_unit:,.0f}/{unit}\n\n"
        f"Invoice detail telah dikirimkan via Japri (PC) ke pemenang."
    )
    
    try:
        bot.send_message(group, msg, parse_mode="Markdown")
    except Exception as e:
        print(f"Failed to announce winner in group {group}: {e}")
