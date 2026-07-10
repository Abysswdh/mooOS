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


def start_bot_thread():
    if bot:
        thread = threading.Thread(target=bot.infinity_polling, daemon=True)
        thread.start()
        print("Telegram Bot Thread started")
    else:
        print("Telegram Bot disabled (no token provided)")
