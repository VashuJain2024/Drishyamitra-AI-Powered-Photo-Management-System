from app import create_app
from models.database import db
from models.photo import Photo
from models.face import Face
from models.history import DeliveryHistory
import json

app = create_app()
with app.app_context():
    photo_count = Photo.query.count()
    face_count = Face.query.count()
    # Check for delivery history with "pending" in details (sqlite doesn't support JSON query well)
    all_history = DeliveryHistory.query.all()
    pending_count = 0
    for h in all_history:
        if h.details and h.details.get('status') == 'pending_whatsapp':
            pending_count += 1
            
    print(f"Photos: {photo_count}")
    print(f"Faces: {face_count}")
    print(f"Pending WhatsApp Deliveries: {pending_count}")
