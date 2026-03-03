from flask_sqlalchemy import SQLAlchemy
from config import Config, logger

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():

        from models.user import User
        from models.photo import Photo
        from models.face import Face
        from models.person import Person
        from models.history import DeliveryHistory
        from models.chat_log import ChatLog

        try:

            db.create_all()
            logger.info("Database schema synchronized successfully.")
        except Exception as e:
            logger.error(f"Error during database synchronization: {e}")
            raise e
