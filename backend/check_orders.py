import sqlite3
import pandas as pd

conn = sqlite3.connect('mooos.db')
query = "SELECT po_number, status, accepted_by FROM feed_orders ORDER BY id DESC LIMIT 10;"
df = pd.read_sql_query(query, conn)
print(df)
conn.close()
