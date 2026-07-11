import threading
from telebot import TeleBot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

from app.config import get_settings
from app.database import SessionLocal
from app.models.telegram_contact import TelegramContact, TelegramContactRole
from app.models.cow import Cow
from app.models.milk import MilkRecord
from app.models.waste import WasteBatch
import datetime

settings = get_settings()

bot = TeleBot(settings.TELEGRAM_BOT_TOKEN) if settings.TELEGRAM_BOT_TOKEN else None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if bot:
    @bot.message_handler(commands=['start'])
    def handle_start(message):
        text = message.text
        chat_id = message.chat.id
        tg_user_id = str(message.from_user.id)
        username = message.from_user.username
        first_name = message.from_user.first_name

        db = SessionLocal()
        try:
            # Register user if not exists
            contact = db.query(TelegramContact).filter(TelegramContact.telegram_user_id == tg_user_id).first()
            if not contact:
                contact = TelegramContact(
                    telegram_user_id=tg_user_id,
                    telegram_username=username,
                    display_name=first_name,
                    role=TelegramContactRole.PJ_KANDANG,
                    barn_name="Kandang Utama"
                )
                db.add(contact)
                db.commit()

            parts = text.split(' ')
            if len(parts) > 1 and parts[1].startswith('cow_'):
                cow_id_str = parts[1].split('_')[1]
                try:
                    cow_id = int(cow_id_str)
                    cow = db.query(Cow).filter(Cow.id == cow_id).first()
                    if cow:
                        msg = f"🐮 *Info Sapi*\n\nKode: {cow.code}\nNama: {cow.name or '-'}\nTipe: {cow.cow_type.name if hasattr(cow.cow_type, 'name') else cow.cow_type}\nStatus: {cow.status.name if hasattr(cow.status, 'name') else cow.status}"
                        
                        markup = InlineKeyboardMarkup()
                        if (hasattr(cow.cow_type, 'name') and cow.cow_type.name == "DAIRY") or cow.cow_type == "DAIRY":
                            markup.add(InlineKeyboardButton("Lapor Susu 🥛", callback_data=f"lapor_susu_{cow.id}"))
                        markup.add(InlineKeyboardButton("Lapor Limbah 💩", callback_data=f"lapor_limbah_{cow.id}"))
                        
                        bot.send_message(chat_id, msg, parse_mode="Markdown", reply_markup=markup)
                    else:
                        bot.send_message(chat_id, "❌ Sapi tidak ditemukan.")
                except ValueError:
                    bot.send_message(chat_id, "❌ Format QR tidak valid.")
            else:
                bot.send_message(chat_id, (
                    f"Halo {first_name}! \U0001f44b\n"
                    f"Anda telah terdaftar sebagai PJ Kandang.\n\n"
                    f"*Perintah tersedia:*\n"
                    f"\u2022 Scan QR sapi di menu Ternak\n"
                    f"\u2022 /lapor\\_susu \u2014 lapor produksi susu\n"
                    f"\u2022 /lapor\\_limbah \u2014 lapor limbah\n"
                    f"\u2022 /lelang \u2014 cara ikut lelang\n"
                    f"\u2022 /harga \u2014 lihat sesi harga grup"
                ), parse_mode="Markdown")
        finally:
            db.close()

    @bot.message_handler(commands=['lapor_susu'])
    def handle_lapor_susu_cmd(message):
        parts = message.text.split(' ', 1)
        if len(parts) > 1:
            process_cow_input_for_susu(message, parts[1].strip())
        else:
            msg = bot.send_message(message.chat.id, "Silakan ketik Kode Sapi atau ID Sapi yang ingin dilaporkan susunya:")
            bot.register_next_step_handler(msg, process_cow_input_for_susu_step)

    def process_cow_input_for_susu_step(message):
        process_cow_input_for_susu(message, message.text.strip())

    def process_cow_input_for_susu(message, cow_input):
        db = SessionLocal()
        try:
            if cow_input.isdigit():
                cow = db.query(Cow).filter(Cow.id == int(cow_input)).first()
            else:
                cow = db.query(Cow).filter(Cow.code == cow_input).first()
                
            if cow:
                if (hasattr(cow.cow_type, 'name') and cow.cow_type.name != "DAIRY") and (isinstance(cow.cow_type, str) and cow.cow_type != "DAIRY"):
                    bot.send_message(message.chat.id, "❌ Sapi ini bukan sapi perah (DAIRY).")
                    return

                msg = bot.send_message(message.chat.id, f"Berapa liter susu yang dihasilkan sapi {cow.code}?")
                bot.register_next_step_handler(msg, process_lapor_susu, cow.id)
            else:
                bot.send_message(message.chat.id, "❌ Sapi tidak ditemukan. Silakan cek kembali Kode/ID Sapi.")
        finally:
            db.close()

    @bot.message_handler(commands=['lapor_limbah'])
    def handle_lapor_limbah_cmd(message):
        parts = message.text.split(' ', 1)
        if len(parts) > 1:
            process_cow_input_for_limbah(message, parts[1].strip())
        else:
            msg = bot.send_message(message.chat.id, "Silakan ketik Kode Sapi atau ID Sapi yang ingin dilaporkan limbahnya:")
            bot.register_next_step_handler(msg, process_cow_input_for_limbah_step)

    def process_cow_input_for_limbah_step(message):
        process_cow_input_for_limbah(message, message.text.strip())

    def process_cow_input_for_limbah(message, cow_input):
        db = SessionLocal()
        try:
            if cow_input.isdigit():
                cow = db.query(Cow).filter(Cow.id == int(cow_input)).first()
            else:
                cow = db.query(Cow).filter(Cow.code == cow_input).first()
                
            if cow:
                msg = bot.send_message(message.chat.id, f"Berapa kg limbah yang dihasilkan dari kandang sapi {cow.code}?")
                bot.register_next_step_handler(msg, process_lapor_limbah, cow.id)
            else:
                bot.send_message(message.chat.id, "❌ Sapi tidak ditemukan. Silakan cek kembali Kode/ID Sapi.")
        finally:
            db.close()

    @bot.callback_query_handler(func=lambda call: call.data.startswith('lapor_susu_'))
    def callback_lapor_susu(call):
        cow_id = call.data.split('_')[2]
        msg = bot.send_message(call.message.chat.id, f"Berapa liter susu yang dihasilkan sapi ID {cow_id}?")
        bot.register_next_step_handler(msg, process_lapor_susu, cow_id)

    def process_lapor_susu(message, cow_id):
        try:
            liters = float(message.text)
            db = SessionLocal()
            try:
                cow = db.query(Cow).filter(Cow.id == int(cow_id)).first()
                cow_code = cow.code if cow else f"#{cow_id}"

                record = MilkRecord(
                    cow_id=int(cow_id),
                    date=datetime.date.today(),
                    liters=liters,
                    recorded_by=message.from_user.first_name or message.from_user.username or "PJ Kandang",
                )
                db.add(record)
                db.commit()

                # Create admin dashboard notification
                from app.models.notification import Notification, NotificationType
                from app.models.user import User, UserRole
                admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
                reporter = message.from_user.first_name or message.from_user.username or "PJ Kandang"
                for admin in admins:
                    notif = Notification(
                        user_id=admin.id,
                        type=NotificationType.MILK_REPORT,
                        title=f"Produksi susu via Telegram: Sapi {cow_code} — {liters} L",
                        message=f"Dilaporkan oleh: {reporter} pada {datetime.date.today()}",
                        read=False,
                    )
                    db.add(notif)
                db.commit()

                bot.send_message(
                    message.chat.id,
                    f"✅ Berhasil mencatat {liters}L susu untuk sapi {cow_code}.\n"
                    f"Stok susu koperasi telah diperbarui."
                )
            finally:
                db.close()
        except ValueError:
            bot.send_message(message.chat.id, "❌ Angka tidak valid. Silakan coba lagi.")

    @bot.callback_query_handler(func=lambda call: call.data.startswith('lapor_limbah_'))
    def callback_lapor_limbah(call):
        cow_id = call.data.split('_')[2]
        msg = bot.send_message(call.message.chat.id, f"Berapa kg limbah yang dihasilkan dari kandang sapi ID {cow_id}?")
        bot.register_next_step_handler(msg, process_lapor_limbah, cow_id)

    def process_lapor_limbah(message, cow_id):
        try:
            kg = float(message.text)
            db = SessionLocal()
            try:
                cow = db.query(Cow).filter(Cow.id == int(cow_id)).first()
                barn_id = cow.barn_id if cow and cow.barn_id else 1 # fallback
                
                # Generate a unique batch code
                import uuid
                batch_code = f"WB-{datetime.date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
                
                record = WasteBatch(
                    barn_id=barn_id,
                    batch_code=batch_code,
                    raw_waste_kg=kg,
                    estimated_fertilizer_kg=kg * 0.5, # Assuming 50% yield for estimation
                    status="COLLECTING"
                )
                db.add(record)
                db.commit()
                bot.send_message(message.chat.id, f"✅ Berhasil mencatat {kg}kg limbah.")
            finally:
                db.close()
        except ValueError:
            bot.send_message(message.chat.id, "❌ Angka tidak valid. Silakan coba lagi.")


    @bot.message_handler(commands=['harga'])
    def handle_harga(message):
        """
        Group-aware price voting.
        - GRUP_PAKAN → asks for pakan (picks cheapest)
        - GRUP_SUSU  → asks for susu (picks highest)
        - GRUP_PUPUK → asks for pupuk (picks highest)
        """
        chat_id_str = str(message.chat.id)

        if chat_id_str == settings.TELEGRAM_GROUP_PAKAN:
            msg = (
                "🌾 *Sesi Harga Pakan*\n\n"
                "Kirim harga pakan Anda (per kg):\n"
                "`pakan <harga>` — contoh: `pakan 3500`\n\n"
                "Bot pilih harga *termurah*. Ketik /tutup\\_harga untuk tutup sesi."
            )
        elif chat_id_str == settings.TELEGRAM_GROUP_SUSU:
            msg = (
                "🥛 *Sesi Harga Susu*\n\n"
                "Kirim harga beli susu Anda (per liter):\n"
                "`susu <harga>` — contoh: `susu 7000`\n\n"
                "Bot pilih harga *tertinggi*. Ketik /tutup\\_harga untuk tutup sesi."
            )
        elif chat_id_str == settings.TELEGRAM_GROUP_PUPUK:
            msg = (
                "🌿 *Sesi Harga Pupuk*\n\n"
                "Kirim harga beli pupuk Anda (per kg):\n"
                "`pupuk <harga>` — contoh: `pupuk 2000`\n\n"
                "Bot pilih harga *tertinggi*. Ketik /tutup\\_harga untuk tutup sesi."
            )
        else:
            msg = (
                "📊 *Voting Harga MooOS*\n\n"
                "Gunakan /harga di grup yang sesuai:\n"
                "• Grup Pakan → `pakan <harga>`\n"
                "• Grup Susu  → `susu <harga>`\n"
                "• Grup Pupuk → `pupuk <harga>`"
            )
        bot.send_message(message.chat.id, msg, parse_mode="Markdown")

    @bot.message_handler(commands=['lelang'])
    def handle_lelang_help(message):
        """Show bidding commands for buyers and sellers."""
        msg = (
            "\U0001f4e2 *Cara Ikut Lelang MooOS*\n\n"
            "*Buyer Susu* \U0001f95b\n"
            "Kirim di grup atau chat bot:\n"
            "`beli susu <harga>` — contoh: `beli susu 7000`\n"
            "Bot pilih harga *tertinggi*.\n\n"
            "*Buyer Limbah/Pupuk* \U0001f33f\n"
            "`beli limbah <harga>` — contoh: `beli limbah 2000`\n"
            "Bot pilih harga *tertinggi*.\n\n"
            "*Supplier Pakan* \U0001f33e\n"
            "`jual pakan <harga>` — contoh: `jual pakan 3500`\n"
            "Bot pilih harga *termurah*.\n\n"
            "\u26a0\ufe0f Sistem otomatis memilih penawaran terbaik saat waktu lelang habis.\n"
            "Anda bisa kirim ulang untuk mengubah penawaran sebelum waktu habis."
        )
        bot.send_message(message.chat.id, msg, parse_mode="Markdown")



    @bot.message_handler(func=lambda msg: True)
    def catch_all(message):
        """Catch all messages to print Chat ID for easy setup."""
        # Print the Chat ID to the console so the user can easily copy it to .env
        print(f"=====================================")
        print(f"Pesan dari: {message.chat.title or message.from_user.first_name}")
        print(f"CHAT ID: {message.chat.id}")
        print(f"=====================================")
        
        # If the message starts with pakan/susu/pupuk, route it to the price handler
        text = message.text.lower() if message.text else ""
        if text.startswith('pakan ') or text.startswith('susu ') or text.startswith('pupuk '):
            handle_price_submission(message)
        elif text.startswith('tawar '):
            handle_auction_bid(message)
        elif (
            text.startswith('beli susu ')
            or text.startswith('beli limbah ')
            or text.startswith('beli pupuk ')
            or text.startswith('jual pakan ')
        ):
            handle_simple_bid(message)
        elif text == "1" or text == "2":
            handle_po_response(message, text)

    def handle_po_response(message, response):
        telegram_user_id = str(message.from_user.id)
        db = SessionLocal()
        try:
            from app.models.feed import FeedOrder, FeedOrderRecipient, FeedOrderStatus
            
            # Find the recipient record that hasn't responded yet, for an OPEN order
            recipient = db.query(FeedOrderRecipient).join(FeedOrder).filter(
                FeedOrderRecipient.telegram_user_id == telegram_user_id,
                FeedOrderRecipient.responded == False,
                FeedOrder.status == FeedOrderStatus.OPEN
            ).order_by(FeedOrderRecipient.id.desc()).first()
            
            if not recipient:
                bot.reply_to(message, "ℹ️ Tidak ada Purchase Order (PO) yang menunggu konfirmasi Anda.")
                return
                
            recipient.responded = True
            recipient.response = "ACCEPT" if response == "1" else "REJECT"
            import datetime as dt
            recipient.responded_at = dt.datetime.now()
            
            order = recipient.order
            
            if response == "1":
                order.status = FeedOrderStatus.CONFIRMED
                order.accepted_by = message.from_user.first_name or message.from_user.username
                order.accepted_price_per_kg = order.max_price_per_kg
                order.confirmed_at = dt.datetime.now()
                db.commit()
                db.refresh(order)
                
                bot.reply_to(message, "✅ Terima kasih! PO telah disetujui. Invoice sedang dibuat...")
                
                # Capture order values BEFORE any potential detach
                po_number = order.po_number
                accepted_by = order.accepted_by
                feed_type = order.feed_type
                quantity_kg = float(order.quantity_kg)
                price_per_kg = float(order.max_price_per_kg)
                total_price = float(order.total_max_price)
                
                # Generate Invoice
                from app.services.invoice import generate_supplier_invoice
                pdf_path = generate_supplier_invoice(order, recipient)
                
                # Notify Admin (if configured)
                settings = get_settings()
                
                # We will reuse the same caption for both Supplier and Admin
                invoice_msg = (
                    f"📄 *Invoice Purchase Order*\n\n"
                    f"Supplier: {accepted_by}\n"
                    f"Jenis: {feed_type}\n"
                    f"Jumlah: {quantity_kg:,.0f} kg\n"
                    f"Harga: Rp{price_per_kg:,.0f}/kg\n"
                    f"Total: Rp{total_price:,.0f}\n"
                    f"Status: Menunggu Pembayaran\n\n"
                    f"Silakan simpan invoice ini sebagai bukti pemesanan."
                )
                
                # Send to Supplier
                with open(pdf_path, 'rb') as pdf_file:
                    bot.send_document(message.chat.id, pdf_file, caption=invoice_msg, parse_mode="Markdown")
                
                # Send to Admin Group
                if settings.TELEGRAM_GROUP_ADMIN:
                    with open(pdf_path, 'rb') as pdf_file:
                        bot.send_document(settings.TELEGRAM_GROUP_ADMIN, pdf_file, caption=f"[Tembusan Admin]\n{invoice_msg}", parse_mode="Markdown")
            
            else:
                db.commit()
                bot.reply_to(message, "❌ Anda telah menolak PO ini.")
                
                # Fallback logic: Find next cheapest supplier
                from app.models.market_price import DailyMarketPrice, MarketItemType
                today = dt.date.today()
                
                # Get all suppliers who offered Pakan today, ordered by price ASC
                all_prices = db.query(DailyMarketPrice).filter(
                    DailyMarketPrice.date == today,
                    DailyMarketPrice.item_type == MarketItemType.PAKAN
                ).order_by(DailyMarketPrice.price_per_unit.asc()).all()
                
                # Get telegram IDs of those who already received this PO
                contacted_ids = [r.telegram_user_id for r in order.recipients]
                
                next_supplier = None
                for price_record in all_prices:
                    if price_record.supplier_telegram_id and price_record.supplier_telegram_id not in contacted_ids:
                        next_supplier = price_record
                        break
                        
                if next_supplier:
                    # Update order max_price to match the new supplier's price
                    order.max_price_per_kg = float(next_supplier.price_per_unit)
                    order.total_max_price = order.quantity_kg * order.max_price_per_kg
                    
                    new_recipient = FeedOrderRecipient(
                        order_id=order.id,
                        telegram_user_id=next_supplier.supplier_telegram_id
                    )
                    db.add(new_recipient)
                    db.commit()
                    
                    # Send PO
                    msg = (
                        f"📦 *Purchase Order Baru*\n\n"
                        f"Pembeli: Koperasi Harapan Baru\n"
                        f"Jenis Pakan: {order.feed_type}\n"
                        f"Jumlah: {order.quantity_kg:,.0f} kg\n"
                        f"Harga: Rp{order.max_price_per_kg:,.0f}/kg\n"
                        f"Total: Rp{order.total_max_price:,.0f}\n\n"
                        f"Balas:\n"
                        f"`1` = Terima PO\n"
                        f"`2` = Tolak PO"
                    )
                    try:
                        bot.send_message(next_supplier.supplier_telegram_id, msg, parse_mode="Markdown")
                    except Exception as e:
                        print(f"Failed to send fallback PO: {e}")
                else:
                    # No more suppliers
                    order.status = FeedOrderStatus.REJECTED
                    db.commit()
                    settings = get_settings()
                    if settings.TELEGRAM_GROUP_ADMIN:
                        admin_msg = (
                            f"❌ *Semua supplier menolak Purchase Order*\n\n"
                            f"PO Number: {order.po_number}\n"
                            f"Silakan lakukan permintaan harga ulang atau buat PO baru."
                        )
                        bot.send_message(settings.TELEGRAM_GROUP_ADMIN, admin_msg, parse_mode="Markdown")

        except Exception as e:
            import traceback
            traceback.print_exc()
            bot.reply_to(message, f"❌ Terjadi kesalahan sistem: {str(e)}")
        finally:
            db.close()
            
    def handle_auction_bid(message):
        """Handle auction bids e.g. tawar PO-FEED-XXX 3500"""
        parts = message.text.upper().split()
        if len(parts) < 3:
            bot.reply_to(message, "❌ Format salah. Gunakan: `tawar <KODE> <HARGA>`\nContoh: `tawar PO-FEED-123 3500`", parse_mode="Markdown")
            return
            
        item_code = parts[1]
        try:
            price_val = float(parts[2].replace(",", ""))
        except ValueError:
            bot.reply_to(message, "❌ Format harga tidak valid.", parse_mode="Markdown")
            return
            
        from app.models.auction import AuctionItemType, AuctionBid
        from app.models.feed import FeedOrder, FeedOrderStatus
        from app.models.milk_offer import MilkOffer, MilkOfferStatus
        from app.models.waste import FertilizerOffer, FertilizerOfferStatus
        
        db = SessionLocal()
        try:
            item_type = None
            item_id = None
            
            if item_code.startswith("PO-FEED-"):
                order = db.query(FeedOrder).filter(FeedOrder.po_number == item_code, FeedOrder.status == FeedOrderStatus.OPEN).first()
                if not order:
                    bot.reply_to(message, "❌ Lelang Pakan tidak ditemukan atau sudah ditutup.")
                    return
                item_type = AuctionItemType.PAKAN
                item_id = order.id
            elif item_code.startswith("OF-MILK-"):
                try:
                    offer_id = int(item_code.split("-")[-1])
                    offer = db.query(MilkOffer).filter(MilkOffer.id == offer_id, MilkOffer.status == MilkOfferStatus.OPEN).first()
                    if not offer:
                        bot.reply_to(message, "❌ Lelang Susu tidak ditemukan atau sudah ditutup.")
                        return
                    item_type = AuctionItemType.SUSU
                    item_id = offer.id
                except ValueError:
                    bot.reply_to(message, "❌ Kode tidak valid.")
                    return
            elif item_code.startswith("OF-FERT-"):
                try:
                    offer_id = int(item_code.split("-")[-1])
                    offer = db.query(FertilizerOffer).filter(FertilizerOffer.id == offer_id, FertilizerOffer.status == FertilizerOfferStatus.OPEN).first()
                    if not offer:
                        bot.reply_to(message, "❌ Lelang Pupuk tidak ditemukan atau sudah ditutup.")
                        return
                    item_type = AuctionItemType.PUPUK
                    item_id = offer.id
                except ValueError:
                    bot.reply_to(message, "❌ Kode tidak valid.")
                    return
            else:
                bot.reply_to(message, "❌ Kode lelang tidak dikenali.")
                return
                
            bid = AuctionBid(
                item_type=item_type,
                item_id=item_id,
                item_code=item_code,
                telegram_user_id=str(message.from_user.id),
                telegram_username=message.from_user.username,
                price_per_unit=price_val
            )
            db.add(bid)
            db.commit()
            bot.reply_to(message, f"✅ Penawaran Rp{price_val:,.0f} untuk `{item_code}` berhasil dicatat!\nMohon tunggu hingga waktu lelang habis.", parse_mode="Markdown")
            
        except Exception as e:
            print(f"Error handling bid: {e}")
            bot.reply_to(message, "❌ Terjadi kesalahan pada sistem.")
        finally:
            db.close()

    def handle_simple_bid(message):
        """
        Handle simplified bidding commands from buyers/sellers.

        Supported formats:
          beli susu <harga>    → Buyer bids on the latest OPEN milk (SUSU) auction
          beli limbah <harga>  → Buyer bids on the latest OPEN fertilizer (PUPUK) auction
          jual pakan <harga>   → Supplier bids on the latest OPEN feed (PAKAN) order

        The system automatically finds the most recent active auction — no code needed.
        """
        from app.models.auction import AuctionItemType, AuctionBid
        from app.models.feed import FeedOrder, FeedOrderStatus
        from app.models.milk_offer import MilkOffer, MilkOfferStatus
        from app.models.waste import FertilizerOffer, FertilizerOfferStatus

        text = message.text.lower().strip()
        parts = text.split()

        # Determine command type and extract price
        if len(parts) < 3:
            bot.reply_to(
                message,
                "❌ Format salah. Contoh:\n"
                "`beli susu 7000`\n"
                "`beli limbah 2000`\n"
                "`jual pakan 3500`",
                parse_mode="Markdown"
            )
            return

        # Parse: "beli susu 7000" → verb="beli", item="susu", price="7000"
        #        "jual pakan 3500" → verb="jual", item="pakan", price="3500"
        verb = parts[0]   # beli / jual
        item = parts[1]   # susu / limbah / pupuk / pakan
        price_str = parts[2]

        try:
            price_val = float(price_str.replace(",", "").replace(".", ""))
            if price_val <= 0:
                raise ValueError("Price must be positive")
        except ValueError:
            bot.reply_to(message, "❌ Format harga tidak valid. Masukkan angka, contoh: `beli susu 7000`", parse_mode="Markdown")
            return

        db = SessionLocal()
        try:
            item_type = None
            item_id = None
            item_code = None
            role_label = ""      # for confirmation message
            item_label = ""

            if verb == "beli" and item == "susu":
                # Find latest OPEN milk offer
                offer = (
                    db.query(MilkOffer)
                    .filter(MilkOffer.status == MilkOfferStatus.OPEN)
                    .order_by(MilkOffer.created_at.desc())
                    .first()
                )
                if not offer:
                    bot.reply_to(message, "⚠️ Tidak ada lelang susu yang sedang buka saat ini.")
                    return
                item_type = AuctionItemType.SUSU
                item_id = offer.id
                item_code = f"OF-MILK-{offer.id}"
                item_label = f"susu {float(offer.quantity_liters):,.0f} liter"
                role_label = "Penawaran beli"

            elif verb == "beli" and (item == "limbah" or item == "pupuk"):
                # Find latest OPEN fertilizer offer
                offer = (
                    db.query(FertilizerOffer)
                    .filter(FertilizerOffer.status == "OPEN")
                    .order_by(FertilizerOffer.created_at.desc())
                    .first()
                )
                if not offer:
                    bot.reply_to(message, "⚠️ Tidak ada lelang limbah/pupuk yang sedang buka saat ini.")
                    return
                item_type = AuctionItemType.PUPUK
                item_id = offer.id
                item_code = f"OF-FERT-{offer.id}"
                item_label = f"pupuk {float(offer.quantity_kg):,.0f} kg"
                role_label = "Penawaran beli"

            elif verb == "jual" and item == "pakan":
                # Find latest OPEN feed order
                order = (
                    db.query(FeedOrder)
                    .filter(FeedOrder.status == FeedOrderStatus.OPEN)
                    .order_by(FeedOrder.created_at.desc())
                    .first()
                )
                if not order:
                    bot.reply_to(message, "⚠️ Tidak ada pesanan pakan yang sedang buka saat ini.")
                    return
                item_type = AuctionItemType.PAKAN
                item_id = order.id
                item_code = order.po_number
                item_label = f"pakan {float(order.quantity_kg):,.0f} kg"
                role_label = "Penawaran jual"

            else:
                bot.reply_to(
                    message,
                    "❌ Perintah tidak dikenali. Gunakan:\n"
                    "`beli susu <harga>`\n"
                    "`beli limbah <harga>`\n"
                    "`jual pakan <harga>`",
                    parse_mode="Markdown"
                )
                return

            # Check for duplicate bid from same user
            existing_bid = db.query(AuctionBid).filter(
                AuctionBid.item_type == item_type,
                AuctionBid.item_id == item_id,
                AuctionBid.telegram_user_id == str(message.from_user.id)
            ).first()

            unit = "liter" if item_type == AuctionItemType.SUSU else "kg"

            if existing_bid:
                # Update the existing bid instead of creating a duplicate
                old_price = float(existing_bid.price_per_unit)
                existing_bid.price_per_unit = price_val
                db.commit()
                bot.reply_to(
                    message,
                    f"🔄 *Penawaran Diperbarui*\n\n"
                    f"Item: {item_label}\n"
                    f"Harga lama: Rp{old_price:,.0f}/{unit}\n"
                    f"Harga baru: Rp{price_val:,.0f}/{unit}\n\n"
                    f"Mohon tunggu hingga waktu lelang habis.",
                    parse_mode="Markdown"
                )
                return

            # Save new bid
            bid = AuctionBid(
                item_type=item_type,
                item_id=item_id,
                item_code=item_code,
                telegram_user_id=str(message.from_user.id),
                telegram_username=message.from_user.username,
                price_per_unit=price_val
            )
            db.add(bid)
            db.commit()

            bot.reply_to(
                message,
                f"✅ {role_label} berhasil dicatat!\n\n"
                f"Item: {item_label}\n"
                f"Harga: Rp{price_val:,.0f}/{unit}\n\n"
                f"⏳ Mohon tunggu hingga waktu lelang habis.\n"
                f"Sistem akan otomatis memilih penawaran terbaik.",
                parse_mode="Markdown"
            )

        except Exception as e:
            print(f"Error handling simple bid: {e}")
            import traceback
            traceback.print_exc()
            bot.reply_to(message, "❌ Terjadi kesalahan pada sistem. Coba lagi.")
        finally:
            db.close()

    def handle_price_submission(message):
        """Handle price submissions, validated against the correct group."""
        parts = message.text.lower().split()
        if len(parts) < 2:
            return
        item_key, price_str = parts[0], parts[1]

        # Each group only accepts its own item type
        chat_id_str = str(message.chat.id)
        group_to_item = {
            settings.TELEGRAM_GROUP_PAKAN: "pakan",
            settings.TELEGRAM_GROUP_SUSU: "susu",
            settings.TELEGRAM_GROUP_PUPUK: "pupuk",
        }
        expected = group_to_item.get(chat_id_str)
        if expected and item_key != expected:
            return  # Silently ignore wrong type in wrong group

        try:
            price_val = float(price_str.replace(",", ""))
        except ValueError:
            bot.reply_to(message, "❌ Format harga tidak valid. Contoh: `pakan 3500`", parse_mode="Markdown")
            return

        item_map = {"pakan": "PAKAN", "susu": "SUSU", "pupuk": "PUPUK"}
        item_type = item_map.get(item_key)
        if not item_type:
            return

        import datetime as dt
        from app.models.market_price import DailyMarketPrice, PriceSource

        db = SessionLocal()
        try:
            telegram_user_id = str(message.from_user.id)
            supplier_name = message.from_user.first_name or message.from_user.username
            
            existing = db.query(DailyMarketPrice).filter(
                DailyMarketPrice.date == dt.date.today(),
                DailyMarketPrice.item_type == item_type,
                DailyMarketPrice.source == PriceSource.TELEGRAM,
                DailyMarketPrice.supplier_telegram_id == telegram_user_id
            ).first()

            unit = "liter" if item_type == "SUSU" else "kg"
            if existing:
                current = float(existing.price_per_unit)
                if item_type == "PAKAN" and price_val < current:
                    existing.price_per_unit = price_val
                    db.commit()
                    bot.reply_to(message, f"✅ Harga pakan diperbarui: Rp{price_val:,.0f}/{unit} (lebih murah!)")
                elif item_type in ("SUSU", "PUPUK") and price_val > current:
                    existing.price_per_unit = price_val
                    db.commit()
                    bot.reply_to(message, f"✅ Harga {item_key} diperbarui: Rp{price_val:,.0f}/{unit} (lebih tinggi!)")
                else:
                    bot.reply_to(message, f"ℹ️ Harga {item_key}: Rp{current:,.0f}/{unit}. Tawaran Anda tidak mengubah harga terbaik.")
            else:
                new_price = DailyMarketPrice(
                    date=dt.date.today(),
                    item_type=item_type,
                    price_per_unit=price_val,
                    unit=unit,
                    source=PriceSource.TELEGRAM,
                    supplier_telegram_id=telegram_user_id,
                    supplier_name=supplier_name
                )
                db.add(new_price)
                db.commit()
                bot.reply_to(message, f"✅ Harga {item_key} tercatat: Rp{price_val:,.0f}/{unit}")
        finally:
            db.close()

    @bot.message_handler(commands=['tutup_harga'])
    def handle_tutup_harga(message):
        """Close the pricing session for this group and announce winner."""
        import datetime as dt
        from app.models.market_price import DailyMarketPrice

        chat_id_str = str(message.chat.id)
        today = dt.date.today()

        # Map group → which item to announce
        group_to_item = {
            settings.TELEGRAM_GROUP_PAKAN: ("PAKAN", "🌾", "kg"),
            settings.TELEGRAM_GROUP_SUSU:  ("SUSU",  "🥛", "liter"),
            settings.TELEGRAM_GROUP_PUPUK: ("PUPUK", "🌿", "kg"),
        }

        db = SessionLocal()
        try:
            prices = db.query(DailyMarketPrice).filter(DailyMarketPrice.date == today).all()
            price_map = {p.item_type: float(p.price_per_unit) for p in prices}

            if chat_id_str in group_to_item:
                # Show only the relevant item for this group
                item_type, emoji, unit = group_to_item[chat_id_str]
                if item_type in price_map:
                    lines = [
                        f"📢 *Harga Final {item_type.capitalize()} Hari Ini*\n",
                        f"{emoji} Rp{price_map[item_type]:,.0f}/{unit}",
                        "\n✅ Harga tersimpan ke sistem MooOS."
                    ]
                else:
                    lines = ["❌ Belum ada harga yang masuk untuk grup ini hari ini."]
            else:
                # Show all (private chat / other group)
                if not price_map:
                    lines = ["❌ Belum ada harga yang masuk hari ini."]
                else:
                    lines = ["📢 *Harga Final Hari Ini*\n"]
                    if "PAKAN" in price_map: lines.append(f"🌾 Pakan: Rp{price_map['PAKAN']:,.0f}/kg")
                    if "SUSU"  in price_map: lines.append(f"🥛 Susu:  Rp{price_map['SUSU']:,.0f}/liter")
                    if "PUPUK" in price_map: lines.append(f"🌿 Pupuk: Rp{price_map['PUPUK']:,.0f}/kg")
                    lines.append("\n✅ Harga tersimpan ke sistem MooOS.")

            bot.send_message(message.chat.id, "\n".join(lines), parse_mode="Markdown")
        finally:
            db.close()


# Add a flag to indicate if we are shutting down
_is_shutting_down = False

def stop_bot_thread():
    global _is_shutting_down
    _is_shutting_down = True
    if bot:
        bot.stop_polling()

def start_bot_thread():
    if bot:
        def _poll():
            while not _is_shutting_down:
                try:
                    bot.infinity_polling(skip_pending=True, allowed_updates=["message", "callback_query"])
                except Exception as e:
                    if _is_shutting_down:
                        break
                    import time
                    print(f"Telegram Bot polling error: {e}. Restarting in 5s...")
                    time.sleep(5)
                if _is_shutting_down:
                    break

        thread = threading.Thread(target=_poll, daemon=True)
        thread.start()
        print("Telegram Bot Thread started")
    else:
        print("Telegram Bot disabled (no token provided)")
