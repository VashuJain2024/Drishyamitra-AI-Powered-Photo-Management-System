import os
import numpy as np
from flask import current_app
from models.database import db
from models.face import Face
from models.person import Person
import threading

class FaceService:
    @staticmethod
    def detect_and_store_faces(photo_id, image_path):
        """
        Detects faces in an image using RetinaFace and extracts embeddings using DeepFace.
        This should ideally be called in a background thread for large batches.
        """
        try:
            import cv2
            try:
                from retinaface import RetinaFace
                from deepface import DeepFace
            except (ImportError, Exception) as e:
                current_app.logger.error(f"AI libraries (RetinaFace/DeepFace) failed to load: {e}")
                return []

            # 1. RetinaFace detection
            # RetinaFace returns a dict where keys are face indices
            obj = RetinaFace.detect_faces(image_path)
            
            if not isinstance(obj, dict):
                current_app.logger.info(f"No faces detected in photo {photo_id}")
                return []

            faces_found = []
            
            # Load image once for DeepFace
            img = cv2.imread(image_path)
            
            for key in obj.keys():
                face_data = obj[key]
                bbox = face_data['facial_area'] # [x1, y1, x2, y2]
                
                # 2. Extract embedding using DeepFace
                # We crop the face for better embedding extraction
                face_img = img[bbox[1]:bbox[3], bbox[0]:bbox[2]]
                
                try:
                    # Note: You can choose different models like 'VGG-Face', 'Facenet', 'OpenFace', 'DeepFace', 'DeepID', 'ArcFace', 'Dlib', 'SFace'
                    # 'Facenet' or 'ArcFace' are generally good for general purpose
                    embedding_objs = DeepFace.represent(
                        img_path = face_img, 
                        model_name = "Facenet",
                        enforce_detection = False
                    )
                    embedding = embedding_objs[0]["embedding"] if embedding_objs else None
                except Exception as e:
                    current_app.logger.warning(f"Embedding extraction failed for a face in photo {photo_id}: {str(e)}")
                    embedding = None
                
                face = Face(
                    photo_id=photo_id,
                    bounding_box=bbox,
                    confidence=face_data.get('score', 0.0),
                    embedding=embedding
                )
                db.session.add(face)
                faces_found.append(face)
            
            db.session.commit()
            current_app.logger.info(f"Detected and processed {len(faces_found)} faces in photo {photo_id}")
            return faces_found

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Face detection/embedding failed for photo {photo_id}: {str(e)}")
            raise e

    @staticmethod
    def process_photo_async(app, photo_id, image_path):
        """Helper to run detection in background without blocking request"""
        def background_task():
            with app.app_context():
                try:
                    FaceService.detect_and_store_faces(photo_id, image_path)
                except Exception as e:
                    app.logger.error(f"Background face processing failed for {photo_id}: {str(e)}")

        thread = threading.Thread(target=background_task)
        thread.start()

    @staticmethod
    def get_faces_for_photo(photo_id):
        return Face.query.filter_by(photo_id=photo_id).all()
