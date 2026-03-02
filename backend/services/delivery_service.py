import logging
import os
from flask import current_app
from models.photo import Photo
from models.history import DeliveryHistory
from models.database import db
from services.gmail_service import GmailService

logger = logging.getLogger(__name__)

class DeliveryService:
    """Service to handle photo delivery and logging"""
    
    @staticmethod
    def share_photo_via_email(user_id, photo_id, recipient, subject, body):
        """Share a photo via email and log to DeliveryHistory"""
        try:
            # 1. Get photo from DB
            photo = Photo.query.filter_by(id=photo_id, user_id=user_id).first()
            if not photo:
                return False, "Photo not found or permission denied."

            # 2. Get relative path to absolute
            # photo.filepath is stored in data/photos/filename
            # The config.UPLOAD_FOLDER is backend/data/photos
            # We need the full absolute path
            abs_path = os.path.abspath(photo.filepath)

            # 3. Initialize Gmail service and send
            gmail_svc = GmailService()
            success, result = gmail_svc.send_email(
                to=recipient,
                subject=subject,
                body=body,
                attachment_path=abs_path
            )

            # 4. Log to DeliveryHistory
            status = 'sent' if success else 'failed'
            details = {
                "delivery_medium": "email",
                "recipient": recipient,
                "photo_id": photo_id,
                "photo_name": photo.filename,
                "message": result if not success else "Success",
                "status": status
            }
            
            new_log = DeliveryHistory(
                user_id=user_id,
                action='email_share',
                details=details
            )
            db.session.add(new_log)
            db.session.commit()

            return success, result

        except Exception as e:
            logger.error(f"Error in share_photo_via_email: {e}")
            return False, str(e)

    @staticmethod
    def share_photo_via_whatsapp(user_id, photo_id, recipient, message):
        """Trigger Celery task to share a photo via WhatsApp and log to DeliveryHistory"""
        try:
            # 1. Get photo from DB
            photo = Photo.query.filter_by(id=photo_id, user_id=user_id).first()
            if not photo:
                return False, "Photo not found or permission denied."

            # 2. Add an initial pending log
            details = {
                "delivery_medium": "whatsapp",
                "recipient": recipient,
                "photo_id": photo_id,
                "photo_name": photo.filename,
                "message": message,
                "status": "pending_whatsapp"
            }
            
            new_log = DeliveryHistory(
                user_id=user_id,
                action='whatsapp_share_queued',
                details=details
            )
            db.session.add(new_log)
            db.session.commit()

            # 3. Trigger the Celery background task
            from services.tasks import send_whatsapp_photo_task
            task = send_whatsapp_photo_task.delay(
                log_id=new_log.id,
                user_id=user_id,
                photo_id=photo_id,
                recipient=recipient,
                message=message
            )
            
            return True, f"WhatsApp delivery queued (Task ID: {task.id})"

        except Exception as e:
            logger.error(f"Error in share_photo_via_whatsapp: {e}")
            return False, str(e)

    @staticmethod
    def share_folder_via_email(user_id, person_id, recipient, subject, body):
        """Share an entire folder (person) via a single email with multiple attachments"""
        try:
            from models.person import Person
            from models.face import Face
            
            person = Person.query.filter_by(id=person_id, user_id=user_id).first()
            if not person:
                return False, "Folder not found"
            
            photos = Photo.query.join(Face).filter(Face.person_id == person_id).all()
            if not photos:
                return False, "No photos in this folder"
            
            attachment_paths = [os.path.abspath(p.filepath) for p in photos]
            
            gmail_svc = GmailService()
            # Note: gmail_service.send_email needs modification to support multiple attachments
            # Or we can send them one by one, but user requested 'folder sharing' which usually means one email
            # I'll use a modified logic here (assuming I'll update gmail_service.py too)
            success, result = gmail_svc.send_email(
                to=recipient,
                subject=subject,
                body=body,
                attachment_path=attachment_paths # Passing a list
            )
            
            status = 'sent' if success else 'failed'
            new_log = DeliveryHistory(
                user_id=user_id,
                action='folder_email_share',
                details={
                    "delivery_medium": "email",
                    "recipient": recipient,
                    "person_id": person_id,
                    "person_name": person.name,
                    "photo_count": len(photos),
                    "status": status,
                    "message": result
                }
            )
            db.session.add(new_log)
            db.session.commit()
            
            return success, result
        except Exception as e:
            logger.error(f"Folder email share error: {e}")
            return False, str(e)

    @staticmethod
    def share_folder_via_whatsapp(user_id, person_id, recipient, message):
        """Share an entire folder (person) via WhatsApp by queuing individual messages"""
        try:
            from models.person import Person
            from models.face import Face
            
            person = Person.query.filter_by(id=person_id, user_id=user_id).first()
            if not person:
                return False, "Folder not found"
            
            photos = Photo.query.join(Face).filter(Face.person_id == person_id).all()
            if not photos:
                return False, "No photos in this folder"
            
            for photo in photos:
                DeliveryService.share_photo_via_whatsapp(user_id, photo.id, recipient, message)
                
            return True, f"Queued {len(photos)} photos for WhatsApp delivery."
        except Exception as e:
            logger.error(f"Folder WhatsApp share error: {e}")
            return False, str(e)
