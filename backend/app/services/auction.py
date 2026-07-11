import os
import threading
import tempfile
from datetime import datetime, date, timedelta
from app.database import SessionLocal
from app.models.auction import AuctionBid, AuctionItemType
from app.models.feed import FeedOrder, FeedOrderStatus, FeedStock
from app.models.milk_offer import MilkOffer, MilkOfferStatus
from app.models.waste import FertilizerOffer, FertilizerOfferStatus
from app.models.invoice import Invoice
from app.bot import bot


def schedule_auction_close(item_type: AuctionItemType, item_id: int, duration_minutes: int):
    """Schedule the auction to close after duration_minutes."""
    duration_seconds = duration_minutes * 60
    timer = threading.Timer(duration_seconds, close_auction, args=(item_type, item_id))
    timer.daemon = True
    timer.start()


def close_auction(item_type: AuctionItemType, item_id: int):
    """Close the auction, find winner, update DB, send notifications and PDF invoice."""
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
            # Notify group that auction expired with no bids
            _notify_no_bids(item_type, item_id)
            return

        # Determine winner
        if item_type == AuctionItemType.PAKAN:
            # We want the LOWEST price
            winning_bid = min(bids, key=lambda b: float(b.price_per_unit))
        else:
            # For SUSU and PUPUK, we want the HIGHEST price
            winning_bid = max(bids, key=lambda b: float(b.price_per_unit))

        # Accept the winning bid
        offer_obj = accept_order(db, item_type, item_id, winning_bid)
        db.commit()

        # Generate PDF invoice and save to DB
        invoice = generate_and_save_invoice(db, winning_bid, item_type, item_id, offer_obj)
        db.commit()

        # Send PDF invoice to winner via Telegram
        send_pdf_invoice_to_winner(winning_bid, invoice)

        # Announce in group with full details
        announce_winner_to_group(winning_bid, item_type, offer_obj)

        # Create system notification for all admins in the web dashboard
        _create_admin_notifications(db, winning_bid, item_type, offer_obj)
        db.commit()

    except Exception as e:
        print(f"Error closing auction for {item_type.value} {item_id}: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def _notify_no_bids(item_type: AuctionItemType, item_id: int):
    """Notify group that auction expired without any bids."""
    from app.config import get_settings
    settings = get_settings()

    group_map = {
        AuctionItemType.PAKAN: settings.TELEGRAM_GROUP_PAKAN,
        AuctionItemType.SUSU: settings.TELEGRAM_GROUP_SUSU,
        AuctionItemType.PUPUK: settings.TELEGRAM_GROUP_PUPUK,
    }
    group = group_map.get(item_type)
    if group and bot:
        item_name = {"PAKAN": "Pakan", "SUSU": "Susu", "PUPUK": "Pupuk"}.get(item_type.value, item_type.value)
        try:
            bot.send_message(group, f"⚠️ Lelang {item_name} telah berakhir tanpa penawaran. Lelang ditutup.")
        except Exception as e:
            print(f"Failed to notify no-bids: {e}")


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
    """Accept the winning bid and update the relevant order/offer. Returns the updated object."""
    now = datetime.now()
    obj = None

    if item_type == AuctionItemType.PAKAN:
        order = db.query(FeedOrder).filter(FeedOrder.id == item_id).first()
        if order:
            order.status = FeedOrderStatus.CONFIRMED
            order.accepted_by = winning_bid.telegram_username or winning_bid.telegram_user_id
            order.accepted_price_per_kg = winning_bid.price_per_unit
            order.confirmed_at = now
            obj = order

    elif item_type == AuctionItemType.SUSU:
        offer = db.query(MilkOffer).filter(MilkOffer.id == item_id).first()
        if offer:
            offer.status = MilkOfferStatus.ACCEPTED
            offer.accepted_by = winning_bid.telegram_username or winning_bid.telegram_user_id
            offer.accepted_quantity = offer.quantity_liters  # buyer takes all
            offer.total_price = float(winning_bid.price_per_unit) * float(offer.quantity_liters)
            offer.confirmed_at = now
            obj = offer

    elif item_type == AuctionItemType.PUPUK:
        offer = db.query(FertilizerOffer).filter(FertilizerOffer.id == item_id).first()
        if offer:
            offer.status = FertilizerOfferStatus.ACCEPTED
            offer.accepted_by = winning_bid.telegram_username or winning_bid.telegram_user_id
            offer.total_price = float(winning_bid.price_per_unit) * float(offer.quantity_kg)
            offer.confirmed_at = now
            obj = offer

            from app.models.waste import WasteBatch, WasteBatchStatus
            qty_to_deduct = float(offer.quantity_kg)
            ready_batches = db.query(WasteBatch).filter(WasteBatch.status == WasteBatchStatus.READY).order_by(WasteBatch.created_at.asc()).all()
            
            for batch in ready_batches:
                if qty_to_deduct <= 0:
                    break
                batch_qty = float(batch.estimated_fertilizer_kg)
                if batch_qty <= qty_to_deduct:
                    batch.status = WasteBatchStatus.SOLD
                    qty_to_deduct -= batch_qty
                else:
                    batch.estimated_fertilizer_kg = batch_qty - qty_to_deduct
                    sold_batch = WasteBatch(
                        barn_id=batch.barn_id,
                        batch_code=f"{batch.batch_code}-SOLD",
                        raw_waste_kg=0,
                        estimated_fertilizer_kg=qty_to_deduct,
                        status=WasteBatchStatus.SOLD,
                        created_at=now
                    )
                    db.add(sold_batch)
                    qty_to_deduct = 0

    return obj


# ---------------------------------------------------------------------------
# PDF Invoice Generation
# ---------------------------------------------------------------------------

def generate_and_save_invoice(db, bid: AuctionBid, item_type: AuctionItemType, item_id: int, offer_obj) -> Invoice:
    """Generate a PDF invoice, save to temp file, persist record in DB."""
    today = date.today()
    payment_deadline = today + timedelta(days=3)
    invoice_number = f"INV-{item_type.value}-{item_id}-{today.strftime('%Y%m%d')}"
    unit = "liter" if item_type == AuctionItemType.SUSU else "kg"

    # Resolve quantity
    if item_type == AuctionItemType.SUSU and offer_obj:
        quantity = float(offer_obj.quantity_liters)
    elif item_type == AuctionItemType.PUPUK and offer_obj:
        quantity = float(offer_obj.quantity_kg)
    elif item_type == AuctionItemType.PAKAN and offer_obj:
        quantity = float(offer_obj.quantity_kg)
    else:
        quantity = 0.0

    price_per_unit = float(bid.price_per_unit)
    total_amount = price_per_unit * quantity
    buyer_name = bid.telegram_username or f"User {bid.telegram_user_id}"

    # Generate PDF to temp directory
    pdf_path = _generate_pdf(
        invoice_number=invoice_number,
        item_type=item_type,
        item_code=bid.item_code,
        buyer_name=buyer_name,
        quantity=quantity,
        unit=unit,
        price_per_unit=price_per_unit,
        total_amount=total_amount,
        payment_deadline=payment_deadline,
    )

    # Save invoice record
    invoice = Invoice(
        invoice_number=invoice_number,
        item_type=item_type.value,
        item_id=item_id,
        item_code=bid.item_code,
        buyer_telegram_id=bid.telegram_user_id,
        buyer_name=buyer_name,
        quantity=quantity,
        unit=unit,
        price_per_unit=price_per_unit,
        total_amount=total_amount,
        payment_deadline=payment_deadline,
        pdf_path=pdf_path,
    )
    db.add(invoice)
    return invoice


def _generate_pdf(
    invoice_number: str,
    item_type: AuctionItemType,
    item_code: str,
    buyer_name: str,
    quantity: float,
    unit: str,
    price_per_unit: float,
    total_amount: float,
    payment_deadline: date,
) -> str:
    """Generate a PDF invoice using reportlab. Returns the file path."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT

    # Save to temp directory
    tmp_dir = tempfile.gettempdir()
    pdf_path = os.path.join(tmp_dir, f"{invoice_number}.pdf")

    doc = SimpleDocTemplate(pdf_path, pagesize=A4,
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', fontSize=16, fontName='Helvetica-Bold',
                                 alignment=TA_CENTER, spaceAfter=0.3*cm)
    subtitle_style = ParagraphStyle('subtitle', fontSize=10, fontName='Helvetica',
                                    alignment=TA_CENTER, spaceAfter=0.5*cm, textColor=colors.grey)
    normal = styles['Normal']
    right_style = ParagraphStyle('right', parent=normal, alignment=TA_RIGHT)

    item_labels = {
        AuctionItemType.PAKAN: "Pembelian Pakan",
        AuctionItemType.SUSU: "Penjualan Susu",
        AuctionItemType.PUPUK: "Penjualan Pupuk Kompos",
    }
    item_label = item_labels.get(item_type, item_type.value)

    story = []

    # Header
    story.append(Paragraph("MooOS KOPERASI", title_style))
    story.append(Paragraph("Sistem Manajemen Koperasi Peternak", subtitle_style))
    story.append(Spacer(1, 0.5*cm))

    # Invoice title
    story.append(Paragraph(f"INVOICE — {item_label.upper()}", title_style))
    story.append(Spacer(1, 0.3*cm))

    # Invoice meta
    meta_data = [
        ['No. Invoice', ':', invoice_number],
        ['Referensi', ':', item_code],
        ['Tanggal', ':', date.today().strftime('%d %B %Y')],
        ['Deadline Pembayaran', ':', payment_deadline.strftime('%d %B %Y')],
    ]
    meta_table = Table(meta_data, colWidths=[5*cm, 0.5*cm, None])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.5*cm))

    # Buyer
    story.append(Paragraph("Kepada:", ParagraphStyle('label', fontName='Helvetica-Bold', fontSize=10)))
    story.append(Paragraph(f"Nama  : {buyer_name}", normal))
    story.append(Paragraph(f"Telegram ID : {buyer_name}", normal))
    story.append(Spacer(1, 0.5*cm))

    # Item table
    item_header = ['Deskripsi', 'Qty', 'Satuan', 'Harga Satuan', 'Total']
    item_row = [
        item_label,
        f"{quantity:,.2f}",
        unit,
        f"Rp{price_per_unit:,.0f}",
        f"Rp{total_amount:,.0f}",
    ]
    item_table = Table([item_header, item_row],
                       colWidths=[6*cm, 2*cm, 2*cm, 3.5*cm, 3.5*cm])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 0.3*cm))

    # Total row
    total_data = [['', '', '', 'TOTAL PEMBAYARAN', f"Rp{total_amount:,.0f}"]]
    total_table = Table(total_data, colWidths=[6*cm, 2*cm, 2*cm, 3.5*cm, 3.5*cm])
    total_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('BACKGROUND', (3, 0), (-1, -1), colors.HexColor('#dcfce7')),
        ('TEXTCOLOR', (3, 0), (-1, -1), colors.HexColor('#166534')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 1*cm))

    # Footer
    story.append(Paragraph(
        f"Harap selesaikan pembayaran sebelum <b>{payment_deadline.strftime('%d %B %Y')}</b>.",
        normal
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "<i>Invoice ini digenerate otomatis oleh Sistem MooOS. "
        "Untuk pertanyaan, hubungi admin koperasi.</i>",
        ParagraphStyle('footer', parent=normal, textColor=colors.grey, fontSize=8)
    ))

    doc.build(story)
    print(f"PDF invoice generated: {pdf_path}")
    return pdf_path


def send_pdf_invoice_to_winner(bid: AuctionBid, invoice: Invoice):
    """Send the PDF invoice to the winner via Telegram private message."""
    if not bot or not invoice.pdf_path or not os.path.exists(invoice.pdf_path):
        print(f"Cannot send PDF invoice: bot={bool(bot)}, path={invoice.pdf_path}")
        return

    caption = (
        f"🧾 *Invoice {invoice.invoice_number}*\n\n"
        f"Terima kasih telah memenangkan lelang {invoice.item_type}.\n"
        f"Volume: {invoice.quantity:,.2f} {invoice.unit}\n"
        f"Harga: Rp{invoice.price_per_unit:,.0f}/{invoice.unit}\n"
        f"*Total: Rp{invoice.total_amount:,.0f}*\n\n"
        f"Deadline Pembayaran: {invoice.payment_deadline.strftime('%d %B %Y')}\n\n"
        f"_Ini adalah pesan otomatis dari Sistem MooOS._"
    )

    try:
        with open(invoice.pdf_path, 'rb') as pdf_file:
            bot.send_document(
                bid.telegram_user_id,
                pdf_file,
                caption=caption,
                parse_mode="Markdown",
                visible_file_name=f"{invoice.invoice_number}.pdf"
            )
        # Mark sent timestamp
        db = SessionLocal()
        try:
            inv = db.query(Invoice).filter(Invoice.invoice_number == invoice.invoice_number).first()
            if inv:
                inv.sent_at = datetime.now()
                db.commit()
        finally:
            db.close()
        print(f"PDF invoice sent to {bid.telegram_user_id} for {invoice.invoice_number}")
    except Exception as e:
        print(f"Failed to send PDF invoice to {bid.telegram_user_id}. Error: {e}")


def announce_winner_to_group(bid: AuctionBid, item_type: AuctionItemType, offer_obj=None):
    """Announce the winner in the group with full sale details."""
    from app.config import get_settings
    settings = get_settings()

    group_map = {
        AuctionItemType.PAKAN: settings.TELEGRAM_GROUP_PAKAN,
        AuctionItemType.SUSU: settings.TELEGRAM_GROUP_SUSU,
        AuctionItemType.PUPUK: settings.TELEGRAM_GROUP_PUPUK,
    }
    group = group_map.get(item_type)
    if not group:
        return

    winner_name = f"@{bid.telegram_username}" if bid.telegram_username else f"User {bid.telegram_user_id}"
    unit = "liter" if item_type == AuctionItemType.SUSU else "kg"
    price = float(bid.price_per_unit)

    # Resolve quantity and total from the accepted offer
    quantity = 0.0
    total = 0.0
    if offer_obj:
        if item_type == AuctionItemType.SUSU and hasattr(offer_obj, 'quantity_liters'):
            quantity = float(offer_obj.quantity_liters)
        elif hasattr(offer_obj, 'quantity_kg'):
            quantity = float(offer_obj.quantity_kg)
        total = price * quantity

    if item_type == AuctionItemType.SUSU:
        msg = (
            f"✅ *Penjualan susu berhasil.*\n\n"
            f"Pembeli: {winner_name}\n"
            f"Volume: {quantity:,.2f} {unit}\n"
            f"Harga: Rp{price:,.0f}/{unit}\n"
            f"Total: Rp{total:,.0f}\n\n"
            f"Invoice detail telah dikirimkan via Japri ke pemenang."
        )
    elif item_type == AuctionItemType.PAKAN:
        msg = (
            f"✅ *Pengadaan pakan berhasil.*\n\n"
            f"Supplier: {winner_name}\n"
            f"Ref: `{bid.item_code}`\n"
            f"Harga Deal: Rp{price:,.0f}/{unit}\n\n"
            f"Invoice detail telah dikirimkan via Japri ke pemenang."
        )
    else:
        msg = (
            f"✅ *Penjualan pupuk berhasil.*\n\n"
            f"Pembeli: {winner_name}\n"
            f"Jumlah: {quantity:,.0f} {unit}\n"
            f"Harga: Rp{price:,.0f}/{unit}\n"
            f"Total: Rp{total:,.0f}\n\n"
            f"Invoice detail telah dikirimkan via Japri ke pemenang."
        )

    try:
        bot.send_message(group, msg, parse_mode="Markdown")
    except Exception as e:
        print(f"Failed to announce winner in group {group}: {e}")


def _create_admin_notifications(db, bid: AuctionBid, item_type: AuctionItemType, offer_obj):
    """Create SALE_CONFIRMED notifications for all admin users in the web dashboard."""
    from app.models.user import User, UserRole
    from app.models.notification import Notification, NotificationType

    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
    if not admins:
        return

    winner_name = bid.telegram_username or bid.telegram_user_id
    unit = "liter" if item_type == AuctionItemType.SUSU else "kg"
    price = float(bid.price_per_unit)

    quantity = 0.0
    if offer_obj:
        if item_type == AuctionItemType.SUSU and hasattr(offer_obj, 'quantity_liters'):
            quantity = float(offer_obj.quantity_liters)
        elif hasattr(offer_obj, 'quantity_kg'):
            quantity = float(offer_obj.quantity_kg)
    total = price * quantity

    item_labels = {
        AuctionItemType.PAKAN: "Pakan",
        AuctionItemType.SUSU: "Susu",
        AuctionItemType.PUPUK: "Pupuk",
    }
    label = item_labels.get(item_type, item_type.value)

    title = f"Lelang {label} Selesai — Pemenang: @{winner_name}"
    message = (
        f"Pembeli: {winner_name} | "
        f"Volume: {quantity:,.2f} {unit} | "
        f"Harga: Rp{price:,.0f}/{unit} | "
        f"Total: Rp{total:,.0f}"
    )

    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            type=NotificationType.SALE_CONFIRMED,
            title=title,
            message=message,
            read=False,
        )
        db.add(notif)
