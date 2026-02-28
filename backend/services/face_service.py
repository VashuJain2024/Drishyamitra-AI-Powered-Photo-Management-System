"""
FaceService
===========
Thin orchestration layer above FaceRecognitionService.
All heavy inference is delegated to FaceRecognitionService to avoid duplication.
"""

import os
import threading
import logging
from models.database import db
from models.face import Face

logger = logging.getLogger(__name__)


class FaceService:

    @staticmethod
    def detect_and_store_faces(photo_id: int, image_path: str, user_id: int) -> list:
        """
        Run the full Facenet512/RetinaFace/MTCNN pipeline on *image_path*,
        store results in the DB, and return the created Face objects.

        Steps
        -----
        1. detect_and_extract_faces  – RetinaFace detection + Facenet512 embeds
        2. extract_faces_with_landmarks – MTCNN landmarks (best-effort)
        3. match_face               – compare against existing DB profiles
        4. auto_create_person       – create Unknown Person if no match
        5. Persist Face records     – bounding box, embedding, landmarks, confidence
        """
        from services.face_recognition import FaceRecognitionService

        service = FaceRecognitionService()

        # --- 1. Get embeddings via full pipeline ---
        faces_data = service.detect_and_extract_faces(image_path)
        if not faces_data:
            logger.info(f"No faces found in photo {photo_id} at {image_path}")
            return []

        # --- 2. Get landmarks via MTCNN (best-effort, may return fewer) ---
        landmark_data = service.extract_faces_with_landmarks(image_path)
        landmark_map = {}  # index → landmarks dict
        for idx, lm in enumerate(landmark_data):
            landmark_map[idx] = lm.get("landmarks", {})

        faces_created = []

        try:
            for idx, face_info in enumerate(faces_data):
                embedding    = face_info.get("embedding")
                facial_area  = face_info.get("facial_area", {})
                confidence   = face_info.get("face_confidence", face_info.get("confidence", 0.0))
                landmarks    = landmark_map.get(idx, {})

                bbox = [
                    facial_area.get("x", 0),
                    facial_area.get("y", 0),
                    facial_area.get("w", 0),
                    facial_area.get("h", 0),
                ]

                if not embedding:
                    logger.warning(f"Empty embedding for face #{idx} in photo {photo_id} — skipping")
                    continue

                # --- 3. Match against existing profiles ---
                matched_person, scores = service.match_face(embedding, user_id)

                # --- 4. Auto-create unknown person if no match ---
                if matched_person is None:
                    matched_person = service.auto_create_person(user_id)

                # --- 5. Persist face record ---
                face = Face(
                    photo_id      = photo_id,
                    person_id     = matched_person.id,
                    bounding_box  = bbox,
                    embedding     = embedding,
                    landmarks     = landmarks,
                    confidence    = float(confidence),
                    model_version = FaceRecognitionService.MODEL_VERSION,
                )
                db.session.add(face)
                faces_created.append(face)

            db.session.commit()
            # Invalidate cache so the new face is included in future matches
            service.invalidate_cache(user_id)
            logger.info(
                f"Stored {len(faces_created)} face(s) for photo {photo_id} "
                f"(user {user_id})"
            )
        except Exception as exc:
            db.session.rollback()
            logger.error(f"DB error storing faces for photo {photo_id}: {exc}")
            raise

        return faces_created

    @staticmethod
    def process_photo_async(app, photo_id: int, image_path: str, user_id: int) -> None:
        """Spawn a daemon thread to run face processing without blocking the request."""
        def _background():
            with app.app_context():
                try:
                    FaceService.detect_and_store_faces(photo_id, image_path, user_id)
                except Exception as exc:
                    app.logger.error(
                        f"Background face processing failed for photo {photo_id}: {exc}"
                    )

        t = threading.Thread(target=_background, daemon=True)
        t.start()
        logger.info(f"Background thread started for photo {photo_id}")

    @staticmethod
    def get_faces_for_photo(photo_id: int) -> list:
        return Face.query.filter_by(photo_id=photo_id).all()
