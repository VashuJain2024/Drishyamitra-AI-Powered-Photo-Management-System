from functools import wraps
from flask import request, jsonify, current_app
import os

def validate_json_fields(*fields):
    """Decorator to validate that specific fields exist in the JSON request body."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"status": "error", "message": "Missing JSON in request"}), 400
            
            data = request.get_json()
            missing = [field for field in fields if field not in data]
            
            if missing:
                return jsonify({
                    "status": "error", 
                    "message": f"Missing required fields: {', '.join(missing)}"
                }), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_file_upload(field_name, allowed_extensions=None):
    """Decorator to validate file uploads."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if field_name not in request.files:
                return jsonify({"status": "error", "message": f"No {field_name} part in the request"}), 400
            
            file = request.files[field_name]
            
            if file.filename == '':
                return jsonify({"status": "error", "message": "No file selected"}), 400
            
            if allowed_extensions:
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                if ext not in allowed_extensions:
                    return jsonify({
                        "status": "error", 
                        "message": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
                    }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
