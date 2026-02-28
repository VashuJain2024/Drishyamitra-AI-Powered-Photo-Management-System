"""
Celery background task: process faces in an uploaded photo.
Uses FaceRecognitionService (Facenet512 + RetinaFace + MTCNN pipeline).
"""

import logging
import os
import shutil

from celery_app import celery

logger = logging.getLogger(__name__)

_flask_app = None


def get_app():
    global _flask_app
    if _flask_app is None:
        from app import create_app
        _flask_app = create_app()
    return _flask_app


@celery.task(bind=True, name="services.tasks.process_photo_faces", max_retries=3)
def process_photo_faces(self, photo_id: int):
    """
    Celery task: detect, embed, and match faces in a photo.

    Pipeline
    --------
    1. Fetch Photo record and resolve absolute path.
    2. Run FaceRecognitionService.detect_and_extract_faces (Facenet512 / RetinaFace).
    3. Run .extract_faces_with_landmarks (MTCNN landmarks).
    4. For each face — match against user's existing profiles (cosine similarity).
    5. Auto-create an unknown-person record if no match found.
    6. Persist Face records (bbox, embedding, landmarks, confidence, model_version).
    7. Optionally copy photo into a per-person organised folder.
    """
    app = get_app()
    with app.app_context():
        from models.database import db
        from models.photo import Photo
        from models.face import Face
        from models.person import Person
        from services.face_recognition import FaceRecognitionService

        try:
            photo = Photo.query.get(photo_id)
            if not photo:
                logger.error(f"process_photo_faces: Photo {photo_id} not found")
                return {"status": "error", "message": "Photo not found"}

            abs_path = os.path.join(app.config["UPLOAD_FOLDER"], photo.filename)
            if not os.path.exists(abs_path):
                logger.error(f"process_photo_faces: Image missing at {abs_path}")
                return {"status": "error", "message": "Image file missing"}

            service = FaceRecognitionService()

            # ---- Stage 1: Detection + Facenet512 embeddings ----
            faces_data = service.detect_and_extract_faces(abs_path)
            if not faces_data:
                logger.info(f"No faces found in photo {photo_id}")
                return {"status": "success", "message": "No faces detected", "count": 0}

            # ---- Stage 2: MTCNN landmarks (best-effort) ----
            landmark_items = service.extract_faces_with_landmarks(abs_path)
            landmark_map = {i: item.get("landmarks", {}) for i, item in enumerate(landmark_items)}

            matched_names  = []
            faces_stored   = 0

            for idx, face_info in enumerate(faces_data):
                embedding   = face_info.get("embedding")
                facial_area = face_info.get("facial_area", {})
                confidence  = face_info.get("face_confidence", face_info.get("confidence", 0.0))
                landmarks   = landmark_map.get(idx, {})

                bbox = [
                    facial_area.get("x", 0),
                    facial_area.get("y", 0),
                    facial_area.get("w", 0),
                    facial_area.get("h", 0),
                ]

                if not embedding:
                    logger.warning(f"Skipping face #{idx} in photo {photo_id} — empty embedding")
                    continue

                # ---- Stage 3: Match ----
                matched_person, scores = service.match_face(embedding, photo.user_id)

                # ---- Stage 4: Auto-create if unknown ----
                if matched_person is None:
                    matched_person = service.auto_create_person(photo.user_id)
                    logger.info(
                        f"Created new unknown person '{matched_person.name}' "
                        f"for user {photo.user_id}"
                    )
                else:
                    matched_names.append(matched_person.name)
                    logger.info(
                        f"Matched face to '{matched_person.name}' "
                        f"(cos_dist={scores['cosine_distance']:.4f}, "
                        f"sim={scores['similarity']:.4f})"
                    )

                # ---- Stage 5: Persist ----
                new_face = Face(
                    photo_id      = photo.id,
                    person_id     = matched_person.id,
                    bounding_box  = bbox,
                    embedding     = embedding,
                    landmarks     = landmarks,
                    confidence    = float(confidence),
                    model_version = FaceRecognitionService.MODEL_VERSION,
                )
                db.session.add(new_face)
                faces_stored += 1

            db.session.commit()
            service.invalidate_cache(photo.user_id)

            # ---- Stage 6: Organise photos into per-person folders ----
            if matched_names:
                organized_root = app.config.get(
                    "ORGANIZED_FOLDER",
                    os.path.join(app.config.get("UPLOAD_FOLDER", ""), "organized"),
                )
                user_dir = os.path.join(organized_root, f"user_{photo.user_id}")

                for name in set(matched_names):
                    safe_name   = "".join(c for c in name if c.isalnum() or c in " -_").strip()
                    person_dir  = os.path.join(user_dir, safe_name)
                    os.makedirs(person_dir, exist_ok=True)
                    target      = os.path.join(person_dir, photo.filename)
                    if not os.path.exists(target):
                        shutil.copy2(abs_path, target)
                        logger.info(f"Organised photo → {target}")

            logger.info(
                f"Photo {photo_id} processed: "
                f"{len(faces_data)} detected, {faces_stored} stored, "
                f"matches={matched_names}"
            )
            return {
                "status":         "success",
                "faces_detected": len(faces_data),
                "faces_stored":   faces_stored,
                "matches":        matched_names,
            }

        except Exception as exc:
            db.session.rollback()
            logger.error(f"process_photo_faces exception (photo {photo_id}): {exc}")
            # Retry with exponential back-off
            raise self.retry(exc=exc, countdown=2 ** self.request.retries)
