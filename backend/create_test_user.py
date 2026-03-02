from app import create_app
from models.database import db
from models.user import User

app = create_app()
with app.app_context():
    # Check if any user exists
    user = User.query.filter_by(username='admin').first()
    if not user:
        print("Creating admin user...")
        admin = User(username='admin', email='admin@example.com')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Admin user created: username='admin', password='admin123'")
    else:
        print(f"Admin user already exists: {user.username}")
