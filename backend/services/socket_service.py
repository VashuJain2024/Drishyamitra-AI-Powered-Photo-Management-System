from flask_socketio import SocketIO
import logging
from config import Config

logger = logging.getLogger(__name__)

socketio = SocketIO()

class SocketService:
    """
    Service to handle SocketIO emissions from both main app 
    and background Celery workers using Redis as a message queue.
    """
    _emitter = None

    @classmethod
    def get_emitter(cls):
        if cls._emitter is None:

            cls._emitter = SocketIO(message_queue=Config.SOCKETIO_MESSAGE_QUEUE)
        return cls._emitter

    @classmethod
    def emit_to_user(cls, user_id, event, data):
        """Emit an event to a specific user's room"""
        emitter = cls.get_emitter()
        room = f"user_{user_id}"
        logger.info(f"Emitting {event} to room {room}")
        emitter.emit(event, data, room=room)

    @classmethod
    def notify_face_processed(cls, user_id, photo_id, faces_count):
        cls.emit_to_user(user_id, 'face_processed', {
            'photo_id': photo_id,
            'faces_count': faces_count,
            'message': f"Face recognition completed for photo #{photo_id}. Found {faces_count} faces."
        })

    @classmethod
    def notify_upload_progress(cls, user_id, filename, progress):
        cls.emit_to_user(user_id, 'upload_progress', {
            'filename': filename,
            'progress': progress
        })

    @classmethod
    def notify_delivery_status(cls, user_id, log_id, status, message=None):
        cls.emit_to_user(user_id, 'delivery_update', {
            'log_id': log_id,
            'status': status,
            'message': message
        })
