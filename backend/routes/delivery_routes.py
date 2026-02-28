from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import db
from models.history import DeliveryHistory
from utils.responses import success_response, error_response
from utils.validation import validate_json_fields

delivery_bp = Blueprint('delivery', __name__)

@delivery_bp.route('/log', methods=['POST'])
@jwt_required()
@validate_json_fields('action')
def log_activity():
    """Log a user-related activity or delivery action"""
    user_id = get_jwt_identity()
    data = request.get_json()
    action = data.get('action')
    details = data.get('details', {})
    
    try:
        new_entry = DeliveryHistory(
            user_id=user_id,
            action=action,
            details=details
        )
        db.session.add(new_entry)
        db.session.commit()
        
        return success_response(new_entry.to_dict(), "Activity logged successfully", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to log activity: {str(e)}", 500)

@delivery_bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    """Check status of delivery integration"""
    return success_response({"status": "active", "service": "Delivery Integration Service"})
