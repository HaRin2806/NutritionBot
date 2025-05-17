from flask import Blueprint, request, jsonify, make_response
import re
import logging
from models.user_model import User
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
import datetime

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
    # Ví dụ: mật khẩu ít nhất 6 ký tự
    return len(password) >= 6

def register_user(name, email, password, gender=None):
    """Đăng ký người dùng mới"""
    # Kiểm tra dữ liệu đầu vào
    if not name or not email or not password:
        return False, "Vui lòng nhập đầy đủ thông tin"
    
    if not validate_email(email):
        return False, "Email không hợp lệ"
    
    if not validate_password(password):
        return False, "Mật khẩu phải có ít nhất 6 ký tự"
    
    # Đăng ký người dùng
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
                "gender": user.gender
            }
        )
        
        return True, {
            "user_id": str(user.user_id),
            "user": {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "gender": user.gender
            },
            "access_token": access_token,
            "expires_in": 86400  # 24 giờ tính bằng giây
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
    """API endpoint để đăng nhập và thiết lập JWT cookie"""
    try:
        data = request.json
        
        email = data.get('email')
        password = data.get('password')
        remember_me = data.get('rememberMe', False)
        
        success, result = login_user(email, password)
        
        if success:
            access_token = result.get("access_token")
            
            # Tạo response với cookie
            response = make_response(jsonify({
                "success": True,
                "user_id": result.get("user_id"),
                "user": result.get("user"),
                "access_token": access_token,
                "expires_in": result.get("expires_in")
            }))
            
            # Thiết lập cookie JWT
            cookie_max_age = 86400 if remember_me else None  # 24h hoặc session cookie
            response.set_cookie(
                'access_token_cookie',
                access_token,
                max_age=cookie_max_age,
                httponly=True,
                path='/api',
                samesite='Lax',
                secure=False  # Set True khi triển khai HTTPS
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
    """API endpoint để đăng xuất (xóa cookie JWT)"""
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
    current_user_id = get_jwt_identity()
    
    # Kiểm tra user có tồn tại không
    user = User.find_by_id(current_user_id)
    if not user:
        return jsonify({
            "success": False,
            "error": "User không tồn tại"
        }), 401
    
    return jsonify({
        "success": True,
        "user_id": current_user_id
    })

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
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
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
        
        # Cập nhật thông tin
        if 'name' in data:
            user.name = data['name']
        
        if 'gender' in data:
            user.gender = data['gender']
        
        # Lưu thông tin đã cập nhật
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
        
        # Kiểm tra mật khẩu hiện tại
        if not User.check_password(user.password, current_password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu hiện tại không chính xác"
            }), 400
        
        # Kiểm tra mật khẩu mới
        if not validate_password(new_password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu mới phải có ít nhất 6 ký tự"
            }), 400
        
        # Cập nhật mật khẩu
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