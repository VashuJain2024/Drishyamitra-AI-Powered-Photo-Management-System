from app import create_app
from models.database import db
from models.photo import Photo
from models.face import Face
from services.tasks import process_photo_faces
import time

app = create_app()
with app.app_context():
    # Find photos with no faces
    photos = Photo.query.all()
    triggered = 0
    for p in photos:
        face_count = Face.query.filter_by(photo_id=p.id).count()
        if face_count == 0:
            print(f"Triggering face recognition for photo {p.id} ({p.filename})...")
            process_photo_faces.delay(p.id)
            triggered += 1
    
    print(f"Total photos triggered: {triggered}")
