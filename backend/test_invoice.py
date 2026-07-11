import sys
import os
import sqlite3
import datetime as dt

# Adjust sys path if necessary
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.feed import FeedOrder

db = SessionLocal()
order = db.query(FeedOrder).order_by(FeedOrder.id.desc()).first()

print("Testing generate_supplier_invoice for order:", order.id)

from app.services.invoice import generate_supplier_invoice
try:
    path = generate_supplier_invoice(order, None)
    print("Success! Path:", path)
except Exception as e:
    print("Failed!")
    import traceback
    traceback.print_exc()

db.close()
