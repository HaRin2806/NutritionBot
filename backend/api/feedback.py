from flask import Blueprint, request, jsonify
import logging
from models.feedback_model import Feedback
from models.user_model import User
from flask_jwt_extended import jwt_required, get_jwt_identity

logger = logging.getLogger(__name__)

feedback_routes = Blueprint('feedback', __name__)

@feedback_routes.route('/feedback', methods=['POST'])
@jwt_required()
def create_feedback():
    """API endpoint để tạo feedback mới"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        rating = data.get('rating')
        category = data.get('category')
        title = data.get('title', '')
        content = data.get('content')
        
        # Validation
        if not rating or not category or not content:
            return jsonify({
                "success": False,
                "error": "Vui lòng điền đầy đủ thông tin"
            }), 400
        
        if not (1 <= rating <= 5):
            return jsonify({
                "success": False,
                "error": "Đánh giá phải từ 1-5 sao"
            }), 400
        
        if len(content.strip()) < 10:
            return jsonify({
                "success": False,
                "error": "Nội dung phải có ít nhất 10 ký tự"
            }), 400
        
        feedback_id = Feedback.create(user_id, rating, category, title, content.strip())
        
        return jsonify({
            "success": True,
            "message": "Cảm ơn bạn đã đóng góp ý kiến!",
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
    """API endpoint để lấy feedback của người dùng"""
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
    """API endpoint để lấy danh sách categories"""
    categories = [
        {"value": "tư vấn", "label": "Chất lượng tư vấn"},
        {"value": "giao diện", "label": "Giao diện ứng dụng"},
        {"value": "tính năng", "label": "Tính năng mới"},
        {"value": "lỗi", "label": "Báo lỗi"},
        {"value": "khác", "label": "Khác"}
    ]
    
    return jsonify({
        "success": True,
        "categories": categories
    })