from models.database import db
from datetime import datetime
class ChatLog(db.Model):
    __tablename__ = 'chat_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_query = db.Column(db.Text, nullable=False) # Renamed from query to avoid shadowing 
    response = db.Column(db.Text)
    is_fallback = db.Column(db.Boolean, default=False)
    metadata_json = db.Column(db.JSON) 
    timestamp = db.Column(db.DateTime, default=datetime.now, index=True)
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "query": self.user_query,
            "response": self.response,
            "is_fallback": self.is_fallback,
            "timestamp": self.timestamp.isoformat()
        }