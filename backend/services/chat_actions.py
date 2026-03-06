import logging
from datetime import datetime, timedelta
from models.photo import Photo
from models.person import Person
from models.history import DeliveryHistory
from models.database import db
from services.delivery_service import DeliveryService

logger = logging.getLogger(__name__)

def get_recent_deliveries(params=None):
    """Retrieve recent delivery history"""
    try:
        days = params.get('days', 7) if params else 7
        user_id = params.get('user_id')

        since_date = datetime.utcnow() - timedelta(days=days)
        history = DeliveryHistory.query.filter(
            DeliveryHistory.user_id == user_id,
            DeliveryHistory.timestamp >= since_date
        ).order_by(DeliveryHistory.timestamp.desc()).all()

        if not history:
            return {"text": "No recent deliveries found.", "data": None}

        result = [f"- {h.action} on {h.timestamp.strftime('%Y-%m-%d %H:%M')}" for h in history]
        return {
            "text": "\n".join(result),
            "data": {"type": "deliveries", "deliveries": [{"action": h.action, "timestamp": h.timestamp.isoformat()} for h in history]}
        }
    except Exception as e:
        logger.error(f"Error in get_recent_deliveries: {e}")
        return {"text": "Sorry, I couldn't retrieve the delivery history right now.", "data": None}

def find_photos_by_person(params=None):
    """Find photos associated with a specific person"""
    try:
        name = params.get('name')
        user_id = params.get('user_id')

        if not name:
            return {"text": "Please provide a person's name.", "data": None}

        person = Person.query.filter(
            Person.user_id == user_id,
            Person.name.ilike(f"%{name}%")
        ).first()

        if not person:
            return {"text": f"I couldn't find anyone named '{name}' in your collection.", "data": None}

        photos = Photo.query.join(Photo.faces).filter(
            Photo.user_id == user_id,
            Person.id == person.id
        ).all()

        if not photos:
            return {"text": f"I found {person.name}, but there are no photos associated with them.", "data": None}

        return {
            "text": f"I found {len(photos)} photos of {person.name}.",
            "data": {"type": "photos", "photos": [{"id": p.id, "filename": p.filename} for p in photos]}
        }
    except Exception as e:
        logger.error(f"Error in find_photos_by_person: {e}")
        return {"text": "Sorry, I encountered an error while searching for photos.", "data": None}

def list_known_persons(params=None):
    """List all identified persons for the user"""
    try:
        user_id = params.get('user_id')
        persons = Person.query.filter_by(user_id=user_id).all()

        if not persons:
            return {"text": "You haven't added or identified any persons yet.", "data": None}

        names = [p.name for p in persons]
        return {
            "text": f"I've identified these people in your photos: {', '.join(names)}.",
            "data": {"type": "persons", "persons": [{"id": p.id, "name": p.name} for p in persons]}
        }
    except Exception as e:
        logger.error(f"Error in list_known_persons: {e}")
        return {"text": "Sorry, I couldn't retrieve the list of persons.", "data": None}

def get_system_stats(params=None):
    """Get general stats about the user's photos and persons"""
    try:
        user_id = params.get('user_id')
        photo_count = Photo.query.filter_by(user_id=user_id).count()
        person_count = Person.query.filter_by(user_id=user_id).count()

        return {
            "text": f"You have {photo_count} photos and {person_count} identified persons in your library.",
            "data": {"type": "stats", "photo_count": photo_count, "person_count": person_count}
        }
    except Exception as e:
        logger.error(f"Error in get_system_stats: {e}")
        return {"text": "I'm having trouble retrieving your system stats.", "data": None}

def share_photo_action(params=None):
    """Action to share a photo via email"""
    try:
        user_id = params.get('user_id')
        photo_id = params.get('photo_id')
        recipient = params.get('recipient')
        subject = params.get('subject', 'Shared Photo from Drishyamitra')
        body = params.get('body', 'Hi! Here is a photo from Drishyamitra.')

        if not photo_id or not recipient:
            return {"text": "Please provide both a photo ID and a recipient email.", "data": None}

        success, result = DeliveryService.share_photo_via_email(
            user_id=user_id,
            photo_id=photo_id,
            recipient=recipient,
            subject=subject,
            body=body
        )

        if success:
            return {
                "text": f"Photo shared successfully with {recipient}. Message ID: {result}",
                "data": {"type": "share", "success": True, "recipient": recipient, "photo_id": photo_id}
            }
        else:
            return {"text": f"Failed to share photo: {result}", "data": None}
    except Exception as e:
        logger.error(f"Error in share_photo_action: {e}")
        return {"text": "Sorry, I couldn't share the photo.", "data": None}

ACTION_MAP = {
    "get_deliveries": get_recent_deliveries,
    "find_photos": find_photos_by_person,
    "list_persons": list_known_persons,
    "get_stats": get_system_stats,
    "share_photo": share_photo_action
}
