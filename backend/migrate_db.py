import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "mooos.db")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if columns exist before adding
    cursor.execute("PRAGMA table_info(daily_market_prices)")
    columns = [info[1] for info in cursor.fetchall()]
    
    try:
        if "supplier_telegram_id" not in columns:
            cursor.execute("ALTER TABLE daily_market_prices ADD COLUMN supplier_telegram_id VARCHAR(50);")
            print("Added supplier_telegram_id to daily_market_prices")
        else:
            print("Column supplier_telegram_id already exists")
            
        if "supplier_name" not in columns:
            cursor.execute("ALTER TABLE daily_market_prices ADD COLUMN supplier_name VARCHAR(100);")
            print("Added supplier_name to daily_market_prices")
        else:
            print("Column supplier_name already exists")
            
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
