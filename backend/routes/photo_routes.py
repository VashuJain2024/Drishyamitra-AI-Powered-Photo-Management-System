import os
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models.database import db
from models.photo import Photo
from utils.responses import success_response, error_response
from utils.validation import validate_file_upload
from datetime import datetime
from services.tasks import process_photo_faces

photo_bp = Blueprint('photos', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

@photo_bp.route('/', methods=['GET'])
@jwt_required()
def list_photos():
    user_id = get_jwt_identity()
    photos = Photo.query.filter_by(user_id=user_id).all()
    return success_response([p.to_dict() for p in photos])

@photo_bp.route('/upload', methods=['POST'])
@jwt_required()
@validate_file_upload('photo', allowed_extensions=ALLOWED_EXTENSIONS)
def upload():
    file = request.files['photo']
    user_id = get_jwt_identity()

    ext = file.filename.rsplit('.', 1)[1].lower()
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(f"user_{user_id}_{timestamp}.{ext}")
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    try:

        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)

        file.save(filepath)

        stats = os.stat(filepath)
        if stats.st_size > current_app.config['MAX_CONTENT_LENGTH']:
            os.remove(filepath)
            return error_response(f"File too large. Maximum size is {current_app.config['MAX_CONTENT_LENGTH'] // (1024*1024)}MB", 413)

        photo = Photo(
            filename=filename, 
            filepath=filepath, 
            user_id=user_id,
            size=stats.st_size,
            mime_type=file.content_type
        )
        db.session.add(photo)
        db.session.commit()

        try:
            process_photo_faces.delay(photo.id)
        except Exception:

            from services.face_service import FaceService
            FaceService.process_photo_async(
                current_app._get_current_object(), photo.id, filepath, user_id
            )

        return success_response(photo.to_dict(), "Photo uploaded and registered successfully", 201)

    except Exception as e:

        if os.path.exists(filepath):
            os.remove(filepath)
        current_app.logger.error(f"Upload failed: {str(e)}")
        return error_response(f"An error occurred during upload: {str(e)}", 500)

@photo_bp.route('/bulk_upload', methods=['POST'])
@jwt_required()
def bulk_upload():
    """Handle bulk photo uploads and dispatch them seamlessly to background processing."""
    if 'photos' not in request.files:
        return error_response("No photos field in request", 400)

    files = request.files.getlist('photos')
    if not files:
        return error_response("No files selected", 400)

    user_id = get_jwt_identity()
    uploaded_photos = []
    errors = []

    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)

    for file in files:
        if file.filename == '':
            continue

        ext = file.filename.rsplit('.', 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            errors.append(f"{file.filename} has invalid extension")
            continue

        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        filename = secure_filename(f"user_{user_id}_{timestamp}.{ext}")
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        try:
            file.save(filepath)
            stats = os.stat(filepath)

            photo = Photo(
                filename=filename, 
                filepath=filepath, 
                user_id=user_id,
                size=stats.st_size,
                mime_type=file.content_type
            )
            db.session.add(photo)
            db.session.flush() 

            process_photo_faces.delay(photo.id)

            uploaded_photos.append({
                "id": photo.id,
                "filename": filename
            })

        except Exception as e:
            current_app.logger.error(f"Failed to process {file.filename}: {str(e)}")
            errors.append(f"{file.filename} failed to save: {str(e)}")

    db.session.commit()

    return success_response({
        "uploaded": uploaded_photos,
        "failed": errors,
        "total_successful": len(uploaded_photos)
    }, "Bulk upload processed", 201)

@photo_bp.route('/organize', methods=['POST'])
@jwt_required()
def organize_photos():
    """Trigger background job to organize all photos for a user into person-specific directories"""
    user_id = get_jwt_identity()
    from services.tasks import organize_all_photos

    try:
        task = organize_all_photos.delay(user_id)
        return success_response({
            "status": "queued",
            "task_id": task.id
        }, "Folder organization task has been queued in the background.", 200)
    except Exception as e:
        current_app.logger.error(f"Failed to queue organize task: {str(e)}")

        try:
            result = organize_all_photos(user_id)
            return success_response(result, "Folder organization completed synchronously.", 200)
        except Exception as sync_e:
            return error_response(f"An error occurred: {str(sync_e)}", 500)
@photo_bp.route('/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_photo(photo_id):
    """Delete a photo, its physical file, and cascade delete all associated DB records (faces, history)"""
    user_id = get_jwt_identity()

    photo = Photo.query.filter_by(id=photo_id, user_id=user_id).first()
    if not photo:
        return error_response("Photo not found or unauthorized", 404)

    try:

        if os.path.exists(photo.filepath):
            os.remove(photo.filepath)

        from models.history import DeliveryHistory

        DeliveryHistory.query.filter(
            db.func.json_extract(DeliveryHistory.details, '$.photo_id') == photo.id
        ).delete(synchronize_session=False)

        db.session.delete(photo)
        db.session.commit()

        return success_response(None, "Photo deleted successfully")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to delete photo {photo_id}: {str(e)}")
        return error_response(f"Failed to delete photo: {str(e)}", 500)
