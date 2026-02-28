from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.history import DeliveryHistory
from utils.responses import success_response, error_response

history_bp = Blueprint('history', __name__)

@history_bp.route('/', methods=['GET'])
@jwt_required()
def get_history():
    """Retrieve delivery and activity history for the user"""
    user_id = get_jwt_identity()
    history_items = DeliveryHistory.query.filter_by(user_id=user_id).order_by(DeliveryHistory.timestamp.desc()).all()
    
    return success_response({
        "history": [item.to_dict() for item in history_items],
        "count": len(history_items)
    }, message="History retrieved successfully")
