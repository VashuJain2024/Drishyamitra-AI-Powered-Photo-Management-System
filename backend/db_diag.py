import os
import sys

# Add parent directory to path to allow imports from app
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from app import create_app
    from models.database import db
    from models.person import Person
    from models.face import Face
    from models.photo import Photo
    from models.user import User
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

app = create_app()
with app.app_context():
    print(f"Total Users: {User.query.count()}")
    users = User.query.all()
    for u in users:
        print(f"User - ID: {u.id}, Username: {u.username}")

    print(f"Total Persons: {Person.query.count()}")
    print(f"Total Faces: {Face.query.count()}")
    print(f"Total Photos: {Photo.query.count()}")
    
    persons = Person.query.all()
    for p in persons:
        print(f"Person - ID: {p.id}, Name: {p.name}, User ID: {p.user_id}, Face Count: {p.face_count}")
        
    # Check if there are any faces with person_id=None
    orphan_faces = Face.query.filter_by(person_id=None).count()
    print(f"Orphan Faces (no person assigned): {orphan_faces}")
