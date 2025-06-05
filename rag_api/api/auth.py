from flask import Blueprint, request, jsonify, make_response
import re
import logging
from models.user_model import User
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
import datetime
from functools import wraps

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
auth_routes = Blueprint('auth', __name__)

def validate_email(email):
    """Kiểm tra định dạng email"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def validate_password(password):
    """Kiểm tra mật khẩu có đủ mạnh không"""
    return len(password) >= 6

# SỬA: Decorator đơn giản hơn để check admin
def require_admin(f):
    """Decorator đơn giản để kiểm tra admin"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            user_id = get_jwt_identity()
            user = User.find_by_id(user_id)
            
            if not user:
                return jsonify({
                    "success": False,
                    "error": "User không tồn tại"
                }), 403
            
            # Kiểm tra có phải admin không
            if not user.is_admin():
                return jsonify({
                    "success": False,
                    "error": "Không có quyền truy cập admin"
                }), 403
            
            # Thêm user vào request context
            request.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Lỗi xác thực admin: {e}")
            return jsonify({
                "success": False,
                "error": "Lỗi xác thực"
            }), 500
    return decorated_function

def register_user(name, email, password, gender=None):
    """Đăng ký người dùng mới"""
    if not name or not email or not password:
        return False, "Vui lòng nhập đầy đủ thông tin"
    
    if not validate_email(email):
        return False, "Email không hợp lệ"
    
    if not validate_password(password):
        return False, "Mật khẩu phải có ít nhất 6 ký tự"
    
    success, result = User.register(name, email, password, gender)
    if success:
        return True, {"user_id": result}
    else:
        return False, result

def login_user(email, password):
    """Đăng nhập người dùng"""
    if not email or not password:
        return False, "Vui lòng nhập đầy đủ thông tin đăng nhập"
    
    success, result = User.login(email, password)
    if success:
        user = result
        
        # Tạo JWT token với thời gian hết hạn 24 giờ
        expires = datetime.timedelta(hours=24)
        access_token = create_access_token(
            identity=str(user.user_id), 
            expires_delta=expires,
            additional_claims={
                "name": user.name,
                "email": user.email,
                "gender": user.gender,
                "role": user.role,
                "permissions": user.permissions,
                "is_admin": user.is_admin()
            }
        )
        
        return True, {
            "user_id": str(user.user_id),
            "user": {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "gender": user.gender,
                "role": user.role,
                "permissions": user.permissions,
                "is_admin": user.is_admin()
            },
            "access_token": access_token,
            "expires_in": 86400
        }
    else:
        return False, result

@auth_routes.route('/register', methods=['POST'])
def register():
    """API endpoint để đăng ký người dùng mới"""
    try:
        data = request.json
        
        name = data.get('fullName')
        email = data.get('email')
        password = data.get('password')
        gender = data.get('gender')
        
        success, result = register_user(name, email, password, gender)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Đăng ký thành công",
                "user_id": result.get("user_id")
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi đăng ký người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/login', methods=['POST'])
def login():
    """API endpoint để đăng nhập"""
    try:
        data = request.json
        
        email = data.get('email')
        password = data.get('password')
        remember_me = data.get('rememberMe', False)
        
        success, result = login_user(email, password)
        
        if success:
            access_token = result.get("access_token")
            
            response = make_response(jsonify({
                "success": True,
                "user_id": result.get("user_id"),
                "user": result.get("user"),
                "access_token": access_token,
                "expires_in": result.get("expires_in")
            }))
            
            cookie_max_age = 86400 if remember_me else None
            response.set_cookie(
                'access_token_cookie',
                access_token,
                max_age=cookie_max_age,
                httponly=True,
                path='/api',
                samesite='Lax',
                secure=False
            )
            
            return response
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 401
            
    except Exception as e:
        logger.error(f"Lỗi đăng nhập: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/logout', methods=['POST'])
def logout():
    """API endpoint để đăng xuất"""
    response = make_response(jsonify({
        "success": True,
        "message": "Đăng xuất thành công"
    }))
    response.delete_cookie('access_token_cookie', path='/api')
    return response

@auth_routes.route('/verify-token', methods=['POST'])
@jwt_required()
def verify_token():
    """API endpoint để kiểm tra token có hợp lệ không"""
    try:
        current_user_id = get_jwt_identity()
        
        user = User.find_by_id(current_user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "User không tồn tại"
            }), 401
        
        return jsonify({
            "success": True,
            "user_id": current_user_id,
            "user": {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "gender": user.gender,
                "role": user.role,
                "permissions": user.permissions,
                "is_admin": user.is_admin()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 401

@auth_routes.route('/profile', methods=['GET'])
@jwt_required()
def user_profile():
    """API endpoint để lấy thông tin người dùng"""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if user:
            profile = {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "gender": user.gender,
                "role": user.role,
                "permissions": user.permissions,
                "is_admin": user.is_admin(),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            
            return jsonify({
                "success": True,
                "user": profile
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy thông tin người dùng"
            }), 404
            
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """API endpoint để cập nhật thông tin người dùng"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        if 'name' in data:
            user.name = data['name']
        
        if 'gender' in data:
            user.gender = data['gender']
        
        user.save()
        
        return jsonify({
            "success": True,
            "message": "Cập nhật thông tin thành công"
        })
            
    except Exception as e:
        logger.error(f"Lỗi cập nhật thông tin người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/change-password', methods=['POST'])
@jwt_required()
def update_password():
    """API endpoint để đổi mật khẩu"""
    try:
        data = request.json
        user_id = get_jwt_identity()
            
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        if not User.check_password(user.password, current_password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu hiện tại không chính xác"
            }), 400
        
        if not validate_password(new_password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu mới phải có ít nhất 6 ký tự"
            }), 400
        
        user.password = User.hash_password(new_password)
        user.save()
        
        return jsonify({
            "success": True,
            "message": "Đổi mật khẩu thành công"
        })
            
    except Exception as e:
        logger.error(f"Lỗi đổi mật khẩu: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# === ADMIN ENDPOINTS - SỬA LẠI ĐỂ SỬ DỤNG CHUNG TOKEN ===

@auth_routes.route('/admin/stats/overview', methods=['GET'])
@require_admin
def get_admin_overview_stats():
    """API endpoint để lấy thống kê tổng quan cho admin"""
    try:
        from models.conversation_model import get_db
        
        db = get_db()
        
        # Đếm tổng conversations
        total_conversations = db.conversations.count_documents({})
        
        # Conversations trong 24h qua
        day_ago = datetime.datetime.now() - datetime.timedelta(days=1)
        recent_conversations = db.conversations.count_documents({
            "created_at": {"$gte": day_ago}
        })
        
        # Đếm tổng tin nhắn
        pipeline = [
            {"$project": {"message_count": {"$size": "$messages"}}},
            {"$group": {"_id": None, "total_messages": {"$sum": "$message_count"}}}
        ]
        message_result = list(db.conversations.aggregate(pipeline))
        total_messages = message_result[0]["total_messages"] if message_result else 0
        
        # Mock users data (có thể thay bằng query thực tế)
        total_users = db.users.count_documents({}) if hasattr(db, 'users') else 1
        
        return jsonify({
            "success": True,
            "stats": {
                "users": {
                    "total": total_users,
                    "new_today": 0
                },
                "conversations": {
                    "total": total_conversations,
                    "recent": recent_conversations
                },
                "data": {
                    "total_chunks": total_messages,
                    "total_tables": 0,
                    "total_figures": 0,
                    "total_items": total_messages,
                    "embeddings": 0
                },
                "admins": {
                    "total": 1
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/admin/recent-activities', methods=['GET'])
@require_admin
def get_admin_recent_activities():
    """API endpoint để lấy hoạt động gần đây cho admin"""
    try:
        limit = int(request.args.get('limit', 10))
        
        from models.conversation_model import get_db
        db = get_db()
        
        # Lấy conversations gần đây
        recent_conversations = list(db.conversations.find(
            {},
            {"title": 1, "created_at": 1, "updated_at": 1}
        ).sort("updated_at", -1).limit(limit))
        
        activities = []
        for conv in recent_conversations:
            activities.append({
                "type": "conversation_created",
                "title": "Cuộc hội thoại mới",
                "description": conv.get("title", "Cuộc hội thoại"),
                "timestamp": conv.get("updated_at", datetime.datetime.now()).isoformat()
            })
        
        return jsonify({
            "success": True,
            "activities": activities
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy hoạt động gần đây: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/admin/alerts', methods=['GET'])
@require_admin
def get_admin_system_alerts():
    """API endpoint để lấy cảnh báo hệ thống cho admin"""
    try:
        # Mock alerts - có thể thay bằng logic thực tế
        alerts = [
            {
                "type": "info",
                "title": "Hệ thống hoạt động bình thường",
                "message": "Tất cả các dịch vụ đang chạy ổn định",
                "severity": "low"
            }
        ]
        
        return jsonify({
            "success": True,
            "alerts": alerts
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy cảnh báo hệ thống: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_routes.route('/init-admin', methods=['POST'])
def init_admin():
    """API endpoint để khởi tạo admin mặc định"""
    try:
        success, result = User.create_default_admin()
        
        if success:
            return jsonify({
                "success": True,
                "message": "Khởi tạo admin thành công",
                "data": result
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi khởi tạo admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500