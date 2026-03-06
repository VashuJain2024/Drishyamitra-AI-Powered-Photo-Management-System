import eventlet
eventlet.monkey_patch()
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room
from config import Config
from models.database import init_db, db
from services.socket_service import socketio
import os
from datetime import datetime
from flask_migrate import Migrate
from dotenv import load_dotenv
from routes.face_routes import face_bp
from flask_jwt_extended import JWTManager, decode_token
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
import logging
logging.getLogger('tensorflow').setLevel(logging.ERROR)
load_dotenv()
def create_app():
    """Application factory function"""
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*", message_queue=Config.SOCKETIO_MESSAGE_QUEUE)
    @socketio.on('connect')
    def handle_connect():
        print("Client connected")
    @socketio.on('join')
    def on_join(data):
        token = data.get('token')
        if token:
            try:
                decoded = decode_token(token)
                user_id = decoded['sub']
                room = f"user_{user_id}"
                join_room(room)
                print(f"User {user_id} joined room {room}")
            except Exception as e:
                print(f"Join room failed: {e}")
    JWTManager(app)
    from flask_bcrypt import Bcrypt
    Bcrypt(app)
    Config.init_app(app)
    init_db(app)
    migrate = Migrate(app, db)
    from routes.auth_routes import auth_bp
    from routes.chat_routes import chat_bp
    from routes.photo_routes import photo_bp
    from routes.delivery_routes import delivery_bp
    from routes.history_routes import history_bp
    from routes.edit_routes import edit_bp
    from routes.dashboard_routes import dashboard_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(photo_bp, url_prefix='/api/photos')
    app.register_blueprint(delivery_bp, url_prefix='/api/delivery')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    app.register_blueprint(edit_bp, url_prefix='/api/edit')
    app.register_blueprint(face_bp, url_prefix='/api/face') 
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Global exception handler to return JSON instead of HTML"""
        import traceback
        error_msg = f"Unhandled Exception: {str(e)}\n{traceback.format_exc()}"
        app.logger.error(error_msg)
        with open("backend_error.log", "a") as f:
            f.write(f"\n--- {datetime.utcnow()} ---\n{error_msg}\n")
        return jsonify({
            "status": "error",
            "message": "Internal Server Error",
            "details": str(e) if app.config.get('DEBUG') else "Check server logs"
        }), 500
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'app': 'Drishyamitra',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }), 200
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    @app.before_request
    def log_request():
        app.logger.info(f"{request.method} {request.path} - {request.remote_addr}")
    return app
if __name__ == '__main__':
    app = create_app()
    socketio.run(app,
        host='0.0.0.0',
        port=5000,
        debug=False
    )