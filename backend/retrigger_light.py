from celery import Celery
import sqlite3
import os

# Minimal Celery for dispatching
celery_app = Celery('tasks', broker='redis://localhost:6379/0')

db_path = "d:/Drishyamitra/backend/database/drishyamitra.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # 1. Trigger Faces for photos that don't have them
    cursor.execute("SELECT id FROM photos")
    photo_ids = [row[0] for row in cursor.fetchall()]
    
    triggered_faces = 0
    for p_id in photo_ids:
        cursor.execute("SELECT COUNT(*) FROM faces WHERE photo_id = ?", (p_id,))
        count = cursor.fetchone()[0]
        if count == 0:
            print(f"Queuing process_photo_faces for photo {p_id}...")
            # We use the name of the task as defined in tasks.py
            celery_app.send_task("services.tasks.process_photo_faces", args=[p_id])
            triggered_faces += 1
            
    # 2. Trigger WhatsApp if pending
    cursor.execute("SELECT id, user_id, action, details FROM delivery_history")
    history = cursor.fetchall()
    triggered_wa = 0
    for h_id, u_id, action, details_str in history:
        import json
        details = json.loads(details_str) if details_str else {}
        if details.get('status') == 'pending_whatsapp':
            print(f"Queuing send_whatsapp_photo_task for log {h_id}...")
            # args: log_id, user_id, photo_id, recipient, message
            celery_app.send_task("services.tasks.send_whatsapp_photo_task", args=[
                h_id, 
                u_id, 
                details.get('photo_id'), 
                details.get('recipient'), 
                details.get('message')
            ])
            triggered_wa += 1

    print(f"Dispatched {triggered_faces} face tasks and {triggered_wa} WhatsApp tasks.")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
