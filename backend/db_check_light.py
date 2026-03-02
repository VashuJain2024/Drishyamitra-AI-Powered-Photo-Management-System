import sqlite3
import os

db_path = "d:/Drishyamitra/backend/database/drishyamitra.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT COUNT(*) FROM photo")
    photos = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM face")
    faces = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM delivery_history")
    delivery_rows = cursor.fetchone()[0]
    
    # Check for pending status in details JSON string
    cursor.execute("SELECT details FROM delivery_history WHERE details LIKE '%pending_whatsapp%'")
    pending = cursor.fetchall()
    
    print(f"Photos: {photos}")
    print(f"Faces: {faces}")
    print(f"Delivery History Rows: {delivery_rows}")
    print(f"Pending WhatsApp in Logs: {len(pending)}")

except Exception as e:
    print(f"Error querying database: {e}")
finally:
    conn.close()
