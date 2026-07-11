import sqlite3

conn = sqlite3.connect('mooos.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='feed_order_recipients'")
print(cur.fetchone())
conn.close()
