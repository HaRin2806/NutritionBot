from flask import Blueprint, request, jsonify
import logging
from models.feedback_model import Feedback
from models.user_model import User
from flask_jwt_extended import jwt_required, get_jwt_identity

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
feedback_routes = Blueprint('feedback', __name__)

@feedback_routes.route('/feedback/categories', methods=['GET'])
def get_feedback_categories():
    """API endpoint để lấy danh sách categories"""
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

@feedback_routes.route('/feedback', methods=['POST'])
@jwt_required()
def create_feedback():
    """API endpoint để tạo feedback mới"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        rating = data.get('rating', 5)
        category = data.get('category', '')
        title = data.get('title', '')
        content = data.get('content', '')
        
        if not category or not content.strip():
            return jsonify({
                "success": False,
                "error": "Vui lòng điền đầy đủ thông tin"
            }), 400
        
        if len(content.strip()) < 10:
            return jsonify({
                "success": False,
                "error": "Nội dung phải có ít nhất 10 ký tự"
            }), 400
        
        success, result = Feedback.create_feedback(
            user_id=user_id,
            rating=rating,
            category=category,
            title=title,
            content=content
        )
        
        if success:
            return jsonify({
                "success": True,
                "message": "Đã gửi feedback thành công",
                "feedback_id": result["feedback_id"]
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 500
            
    except Exception as e:
        logger.error(f"Lỗi tạo feedback: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@feedback_routes.route('/feedback', methods=['GET'])
@jwt_required()
def get_user_feedback():
    """API endpoint để lấy feedback của user hiện tại"""
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
        logger.error(f"Lỗi lấy feedback: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500