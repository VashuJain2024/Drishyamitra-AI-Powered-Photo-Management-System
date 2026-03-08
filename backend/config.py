import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
class Config:
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL') or 'redis://127.0.0.1:6379/0'
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or 'redis://127.0.0.1:6379/0'
    SOCKETIO_MESSAGE_QUEUE = os.environ.get('SOCKETIO_MESSAGE_QUEUE') or 'redis://127.0.0.1:6379/1'
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///database/drishyamitra.db'
    if DATABASE_URL.startswith('sqlite:///'):
        db_path = DATABASE_URL.split('sqlite:///')[1]
        abs_db_path = os.path.normpath(os.path.join(basedir, db_path))
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{abs_db_path}'
    else:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URI)
        logger.info(f"Database engine created for: {SQLALCHEMY_DATABASE_URI.split('@')[-1] if '@' in SQLALCHEMY_DATABASE_URI else SQLALCHEMY_DATABASE_URI}")
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        engine = None
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-me'
    JWT_ACCESS_TOKEN_EXPIRES = 86400  
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    JWT_COOKIE_SECURE = True
    UPLOAD_FOLDER      = os.path.join(basedir, 'data', 'photos')
    EMBEDDINGS_FOLDER  = os.path.join(basedir, 'data', 'embeddings')
    ORGANIZED_FOLDER   = os.path.join(basedir, 'data', 'organized')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  
    FACE_MODEL    = os.environ.get('FACE_MODEL', 'Facenet512')
    FACE_DETECTOR = os.environ.get('FACE_DETECTOR', 'retinaface')
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    GROQ_MODEL   = os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile')
    GMAIL_CREDENTIALS_PATH = os.path.join(basedir, 'credentials.json')
    GMAIL_TOKEN_PATH       = os.path.join(basedir, 'token.pickle')
    WHATSAPP_API_URL = os.environ.get('WHATSAPP_API_URL', 'http://localhost:3000')
    @staticmethod
    def init_app(app):
        os.makedirs(Config.UPLOAD_FOLDER,     exist_ok=True)
        os.makedirs(Config.EMBEDDINGS_FOLDER, exist_ok=True)
        os.makedirs(Config.ORGANIZED_FOLDER,  exist_ok=True)
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        if db_uri and db_uri.startswith('sqlite:///'):
            db_path = db_uri.split('sqlite:///')[1]
            db_dir = os.path.dirname(os.path.join(os.getcwd(), db_path))
            if db_dir:
                os.makedirs(db_dir, exist_ok=True)