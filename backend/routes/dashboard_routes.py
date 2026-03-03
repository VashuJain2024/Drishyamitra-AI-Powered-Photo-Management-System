from flask import Blueprint, jsonify, send_from_directory, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import db
from models.photo import Photo
from models.person import Person
from models.face import Face
from models.history import DeliveryHistory
from utils.responses import success_response, error_response

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()

    photo_count = Photo.query.filter_by(user_id=user_id).count()
    person_count = Person.query.filter_by(user_id=user_id).count()
    history_count = DeliveryHistory.query.filter_by(user_id=user_id).count()

    return success_response({
        "photo_count": photo_count,
        "person_count": person_count,
        "history_count": history_count
    })

@dashboard_bp.route('/folders', methods=['GET'])
@jwt_required()
def get_folders():
    user_id = get_jwt_identity()

    folders = Person.query.filter_by(user_id=user_id).all()
    return success_response([f.to_dict() for f in folders])

@dashboard_bp.route('/folders/<int:person_id>', methods=['GET'])
@jwt_required()
def get_folder_photos(person_id):
    user_id = get_jwt_identity()

    person = Person.query.filter_by(id=person_id, user_id=user_id).first()
    if not person:
        return success_response([], "Folder not found or empty")

    photos = Photo.query.join(Face).filter(Face.person_id == person_id).all()
    return success_response([p.to_dict() for p in photos])

@dashboard_bp.route('/folders/<int:person_id>', methods=['PUT'])
@jwt_required()
def rename_folder(person_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    new_name = data.get('name')

    if not new_name:
        return error_response("Name is required", 400)

    person = Person.query.filter_by(id=person_id, user_id=user_id).first()
    if not person:
        return error_response("Folder not found", 404)

    person.name = new_name
    db.session.commit()

    history = DeliveryHistory(
        user_id=user_id,
        action='folder_renamed',
        details={'person_id': person_id, 'new_name': new_name}
    )
    db.session.add(history)
    db.session.commit()

    return success_response(person.to_dict(), f"Folder renamed to {new_name}")

@dashboard_bp.route('/media/<path:filename>')
def serve_media(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
