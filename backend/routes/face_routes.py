from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from services.face_service import FaceService
from utils.responses import success_response, error_response
from utils.decorators import log_request
from models.photo import Photo

face_bp = Blueprint('face', __name__)

@face_bp.route('/detect/<int:photo_id>', methods=['POST'])
@jwt_required()
@log_request
def detect_faces(photo_id):
    """Trigger asynchronous face detection on a specific photo"""
    photo = Photo.query.get_or_404(photo_id)
    
    try:
        # Trigger asynchronous processing
        FaceService.process_photo_async(current_app._get_current_object(), photo_id, photo.filepath)
        
        return success_response({
            "photo_id": photo_id,
            "status": "processing",
            "message": "Face detection and embedding extraction started in background"
        }, message="Background processing initiated", status_code=202)
        
    except Exception as e:
        return error_response(f"Failed to start face detection: {str(e)}", 500)

@face_bp.route('/photo/<int:photo_id>', methods=['GET'])
@jwt_required()
def get_photo_faces(photo_id):
    """Get all detected faces for a photo"""
    faces = FaceService.get_faces_for_photo(photo_id)
    return success_response([f.to_dict() for f in faces])
