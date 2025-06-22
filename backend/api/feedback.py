# backend/api/feedback.py
from flask import Blueprint, request, jsonify
import logging
from models.feedback_model import Feedback, ensure_indexes
from models.user_model import User
from flask_jwt_extended import jwt_required, get_jwt_identity

logger = logging.getLogger(__name__)

# Create blueprint
feedback_routes = Blueprint('feedback', __name__)

@feedback_routes.route('/feedback', methods=['POST'])
@jwt_required()
def create_feedback():
    """Create new feedback"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        rating = data.get('rating')
        category = data.get('category')
        content = data.get('content')
        title = data.get('title', '')
        
        if not all([rating, category, content]):
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                "success": False,
                "error": "Rating must be between 1 and 5"
            }), 400
        
        feedback = Feedback(
            user_id=user_id,
            rating=rating,
            category=category,
            title=title,
            content=content
        )
        
        feedback_id = feedback.save()
        
        return jsonify({
            "success": True,
            "message": "Feedback created successfully",
            "feedback_id": str(feedback_id)
        })
        
    except Exception as e:
        logger.error(f"Error creating feedback: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@feedback_routes.route('/feedback', methods=['GET'])
@jwt_required()
def get_user_feedback():
    """Get user's feedback"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        feedbacks = Feedback.find_by_user(user_id, limit=per_page, skip=skip)
        
        result = []
        for feedback in feedbacks:
            result.append({
                "id": str(feedback.feedback_id),
                "rating": feedback.rating,
                "category": feedback.category,
                "title": feedback.title,
                "content": feedback.content,
                "status": feedback.status,
                "admin_response": feedback.admin_response,
                "created_at": feedback.created_at.isoformat(),
                "updated_at": feedback.updated_at.isoformat()
            })
        
        return jsonify({
            "success": True,
            "feedbacks": result
        })
        
    except Exception as e:
        logger.error(f"Error getting user feedback: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@feedback_routes.route('/feedback/categories', methods=['GET'])
def get_feedback_categories():
    """Get feedback categories"""
    categories = [
        {"value": "bug_report", "label": "Báo lỗi"},
        {"value": "feature_request", "label": "Đề xuất tính năng"},
        {"value": "content_feedback", "label": "Phản hồi nội dung"},
        {"value": "user_experience", "label": "Trải nghiệm người dùng"},
        {"value": "other", "label": "Khác"}
    ]
    
    return jsonify({
        "success": True,
        "categories": categories
    })