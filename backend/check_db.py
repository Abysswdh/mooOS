import sqlite3

conn = sqlite3.connect('mooos.db')
cur = conn.cursor()
cur.execute("DELETE FROM daily_market_prices WHERE source='TELEGRAM' AND supplier_telegram_id IS NULL")
conn.commit()
print(cur.rowcount, 'rows deleted')
conn.close()
