from models.database import db
from datetime import datetime
class Face(db.Model):
    __tablename__ = 'faces'
    id            = db.Column(db.Integer, primary_key=True)
    photo_id      = db.Column(db.Integer, db.ForeignKey('photos.id'), nullable=False)
    person_id     = db.Column(db.Integer, db.ForeignKey('persons.id'), nullable=True)
    bounding_box  = db.Column(db.JSON)
    embedding     = db.Column(db.JSON)
    landmarks     = db.Column(db.JSON)
    confidence    = db.Column(db.Float)
    model_version = db.Column(db.String(64), default="Facenet512-RetinaFace-MTCNN-v1")
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {
            "id":            self.id,
            "photo_id":      self.photo_id,
            "person_id":     self.person_id,
            "bounding_box":  self.bounding_box,
            "landmarks":     self.landmarks,
            "confidence":    self.confidence,
            "model_version": self.model_version,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
            "embedding_dim": len(self.embedding) if self.embedding else None,
        }