from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

def create_app():
    app = Flask(__name__)
    CORS(app) 

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'app': 'Drishyamitra',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0-minimal'
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )