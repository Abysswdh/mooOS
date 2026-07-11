import os
import sys
import tempfile
import telebot

# Load settings directly to get bot token
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import get_settings
from app.database import SessionLocal
from app.models.feed import FeedOrder
from app.services.invoice import generate_supplier_invoice

settings = get_settings()
bot = telebot.TeleBot(settings.TELEGRAM_BOT_TOKEN)

db = SessionLocal()
order = db.query(FeedOrder).filter(FeedOrder.id == 8).first()

print("Generating invoice for order 8...")
pdf_path = generate_supplier_invoice(order, None)
print("PDF generated at:", pdf_path)

chat_id = "1569808018"
invoice_msg = (
    f"📄 *Invoice Purchase Order*\n\n"
    f"Supplier: {order.accepted_by}\n"
    f"Jenis: {order.feed_type}\n"
    f"Jumlah: {order.quantity_kg:,.0f} kg\n"
    f"Harga: Rp{order.max_price_per_kg:,.0f}/kg\n"
    f"Total: Rp{order.total_max_price:,.0f}\n"
    f"Status: Menunggu Pembayaran\n\n"
    f"Silakan simpan invoice ini sebagai bukti pemesanan."
)

print("Trying to send to supplier...")
try:
    with open(pdf_path, 'rb') as pdf_file:
        bot.send_document(chat_id, pdf_file, caption=invoice_msg, parse_mode="Markdown")
    print("Sent to supplier successfully.")
except Exception as e:
    print("Error sending to supplier:", e)

print("TELEGRAM_GROUP_ADMIN is:", repr(settings.TELEGRAM_GROUP_ADMIN))
if settings.TELEGRAM_GROUP_ADMIN:
    print("Trying to send to admin group...")
    try:
        with open(pdf_path, 'rb') as pdf_file:
            bot.send_document(settings.TELEGRAM_GROUP_ADMIN, pdf_file, caption=f"[Tembusan Admin]\n{invoice_msg}", parse_mode="Markdown")
        print("Sent to admin successfully.")
    except Exception as e:
        print("Error sending to admin:", e)
else:
    print("TELEGRAM_GROUP_ADMIN is falsy, not sending.")

db.close()
