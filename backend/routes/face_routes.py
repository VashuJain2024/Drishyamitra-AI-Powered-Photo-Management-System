"""
Face API Routes
===============
Endpoints for face detection, person management, and face-based photo search.
All routes require a valid JWT token.
"""

import os
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models.database import db
from models.face import Face
from models.person import Person
from models.photo import Photo
from services.face_service import FaceService
from services.face_recognition import FaceRecognitionService
from utils.responses import success_response, error_response
from utils.decorators import log_request

logger = logging.getLogger(__name__)

face_bp = Blueprint("face", __name__)

ALLOWED_SEARCH_EXTENSIONS = {"png", "jpg", "jpeg"}


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

@face_bp.route("/detect/<int:photo_id>", methods=["POST"])
@jwt_required()
@log_request
def detect_faces(photo_id):
    """Trigger async face detection + embedding for a specific photo."""
    user_id = get_jwt_identity()
    photo = Photo.query.get_or_404(photo_id)

    if photo.user_id != user_id:
        return error_response("Forbidden", 403)

    try:
        FaceService.process_photo_async(
            current_app._get_current_object(),
            photo_id,
            photo.filepath,
            user_id,
        )
        return success_response(
            {"photo_id": photo_id, "status": "processing"},
            message="Face detection started in background",
            status_code=202,
        )
    except Exception as exc:
        logger.error(f"detect_faces error: {exc}")
        return error_response(f"Failed to start face detection: {str(exc)}", 500)


@face_bp.route("/photo/<int:photo_id>", methods=["GET"])
@jwt_required()
def get_photo_faces(photo_id):
    """Return all detected faces (without embeddings) for a photo."""
    user_id = get_jwt_identity()
    photo   = Photo.query.get_or_404(photo_id)
    if photo.user_id != user_id:
        return error_response("Forbidden", 403)

    faces = FaceService.get_faces_for_photo(photo_id)
    return success_response([f.to_dict() for f in faces])


# ---------------------------------------------------------------------------
# Person management
# ---------------------------------------------------------------------------

@face_bp.route("/persons", methods=["GET"])
@jwt_required()
def list_persons():
    """List all known persons for the authenticated user."""
    user_id = get_jwt_identity()
    persons = Person.query.filter_by(user_id=user_id).order_by(Person.created_at.desc()).all()
    return success_response([p.to_dict() for p in persons])


@face_bp.route("/persons", methods=["POST"])
@jwt_required()
def create_person():
    """Create a named person profile for the authenticated user."""
    user_id = get_jwt_identity()
    data    = request.get_json(silent=True) or {}
    name    = (data.get("name") or "").strip()

    if not name:
        return error_response("name is required", 400)

    person = Person(name=name, user_id=user_id, is_auto_created=False)
    db.session.add(person)
    db.session.commit()
    return success_response(person.to_dict(), "Person created", 201)


@face_bp.route("/persons/<int:person_id>", methods=["PUT"])
@jwt_required()
def update_person(person_id):
    """Rename a person and/or mark them as manually verified."""
    user_id = get_jwt_identity()
    person  = Person.query.get_or_404(person_id)

    if person.user_id != user_id:
        return error_response("Forbidden", 403)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if name:
        person.name = name
    if "is_auto_created" in data:
        person.is_auto_created = bool(data["is_auto_created"])

    db.session.commit()

    # Invalidate cache so renamed person appears in future matches
    FaceRecognitionService().invalidate_cache(user_id)
    return success_response(person.to_dict(), "Person updated")


@face_bp.route("/persons/<int:person_id>", methods=["DELETE"])
@jwt_required()
def delete_person(person_id):
    """Delete a person and all their associated face records."""
    user_id = get_jwt_identity()
    person  = Person.query.get_or_404(person_id)

    if person.user_id != user_id:
        return error_response("Forbidden", 403)

    name = person.name
    db.session.delete(person)
    db.session.commit()
    FaceRecognitionService().invalidate_cache(user_id)
    return success_response({"deleted": True, "name": name}, f"Person '{name}' deleted")


# ---------------------------------------------------------------------------
# Face-based photo search
# ---------------------------------------------------------------------------

@face_bp.route("/search", methods=["POST"])
@jwt_required()
def search_by_face():
    """
    Upload a query image and find photos containing matching faces.

    Form-data field: `photo` (image file)
    Returns: list of photo records whose stored faces match the query.
    """
    user_id = get_jwt_identity()

    if "photo" not in request.files:
        return error_response("No file provided in field 'photo'", 400)

    file = request.files["photo"]
    ext  = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "").lower()
    if ext not in ALLOWED_SEARCH_EXTENSIONS:
        return error_response(f"Unsupported file type '.{ext}'", 415)

    # Save temp query image
    temp_dir  = os.path.join(current_app.config["UPLOAD_FOLDER"], "_search_tmp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, secure_filename(file.filename))
    file.save(temp_path)

    try:
        service     = FaceRecognitionService()
        faces_data  = service.detect_and_extract_faces(temp_path)

        if not faces_data:
            return success_response([], "No face detected in query image")

        # Use the first detected face as the query
        query_emb   = faces_data[0].get("embedding")
        if not query_emb:
            return error_response("Could not extract embedding from query image", 422)

        # Find matching persons across the user's profile
        matched_person, scores = service.match_face(query_emb, user_id)

        if not matched_person:
            return success_response(
                [],
                f"No matching person found (best cosine distance: {scores['cosine_distance']:.4f})",
            )

        # Collect all photos containing a face linked to this person
        matched_faces = Face.query.filter_by(person_id=matched_person.id).all()
        photo_ids     = list({f.photo_id for f in matched_faces})
        photos        = Photo.query.filter(Photo.id.in_(photo_ids), Photo.user_id == user_id).all()

        return success_response(
            {
                "person":  matched_person.to_dict(),
                "scores":  scores,
                "photos":  [p.to_dict() for p in photos],
                "count":   len(photos),
            },
            f"Found {len(photos)} photo(s) matching '{matched_person.name}'",
        )

    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ---------------------------------------------------------------------------
# Recognition stats
# ---------------------------------------------------------------------------

@face_bp.route("/stats", methods=["GET"])
@jwt_required()
def recognition_stats():
    """Return face recognition statistics for the authenticated user."""
    user_id     = get_jwt_identity()
    persons     = Person.query.filter_by(user_id=user_id).all()
    total_faces = Face.query.join(Photo).filter(Photo.user_id == user_id).count()
    auto_count  = sum(1 for p in persons if p.is_auto_created)

    return success_response({
        "total_persons":         len(persons),
        "auto_created_persons":  auto_count,
        "named_persons":         len(persons) - auto_count,
        "total_faces_stored":    total_faces,
        "model_pipeline":        FaceRecognitionService.MODEL_VERSION,
        "embedding_dimensions":  512,
        "matching_metric":       "cosine",
        "cosine_threshold":      FaceRecognitionService.COSINE_THRESHOLD,
    })
