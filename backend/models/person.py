from models.database import db
from datetime import datetime

class Person(db.Model):
    __tablename__ = 'persons'

    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(128), nullable=False)
    user_id        = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    is_auto_created = db.Column(db.Boolean, default=False, nullable=False)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    faces = db.relationship('Face', backref='person', lazy=True, cascade="all, delete-orphan")

    @property
    def face_count(self) -> int:
        return len(self.faces)

    @property
    def photo_count(self) -> int:
        return len(set(face.photo_id for face in self.faces))

    def to_dict(self):
        return {
            "id":              self.id,
            "name":            self.name,
            "user_id":         self.user_id,
            "is_auto_created": self.is_auto_created,
            "face_count":      self.face_count,
            "photo_count":     self.photo_count,
            "created_at":      self.created_at.isoformat() if self.created_at else None,
        }
