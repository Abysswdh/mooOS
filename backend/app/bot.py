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
                bot.send_message(chat_id, f"Halo {first_name}! Anda telah terdaftar sebagai PJ Kandang.\nGunakan menu /lapor_susu atau /lapor_limbah, atau scan QR sapi.")
        finally:
            db.close()

    @bot.message_handler(commands=['lapor_susu'])
    def handle_lapor_susu_cmd(message):
        bot.send_message(message.chat.id, "Silakan masukkan ID sapi atau scan QR terlebih dahulu.")

    @bot.message_handler(commands=['lapor_limbah'])
    def handle_lapor_limbah_cmd(message):
        bot.send_message(message.chat.id, "Silakan masukkan ID sapi atau scan QR terlebih dahulu.")

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
                record = MilkRecord(
                    cow_id=int(cow_id),
                    date=datetime.date.today(),
                    liters=liters,
                    quality="GRADE_A",
                    milker_id=None
                )
                db.add(record)
                db.commit()
                bot.send_message(message.chat.id, f"✅ Berhasil mencatat {liters}L susu untuk sapi ID {cow_id}.")
                # Notification could be triggered here or via API
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
                
                record = WasteBatch(
                    barn_id=barn_id,
                    raw_waste_kg=kg,
                    status="COLLECTED"
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
            existing = db.query(DailyMarketPrice).filter(
                DailyMarketPrice.date == dt.date.today(),
                DailyMarketPrice.item_type == item_type,
                DailyMarketPrice.source == PriceSource.TELEGRAM
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
                    source=PriceSource.TELEGRAM
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


def start_bot_thread():
    if bot:
        thread = threading.Thread(target=bot.infinity_polling, daemon=True)
        thread.start()
        print("Telegram Bot Thread started")
    else:
        print("Telegram Bot disabled (no token provided)")
