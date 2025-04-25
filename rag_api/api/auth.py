from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, get_jwt_identity, jwt_required
)
from datetime import timedelta
import re
import logging
from models.user_model import User

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

def register_user(name, email, password, age, gender=None):
    """Đăng ký người dùng mới"""
    # Kiểm tra dữ liệu đầu vào
    if not name or not email or not password:
        return False, "Vui lòng nhập đầy đủ thông tin"
    
    if not validate_email(email):
        return False, "Email không hợp lệ"
    
    if not validate_password(password):
        return False, "Mật khẩu phải có ít nhất 6 ký tự"
    
    try:
        age = int(age)
        if age < 1 or age > 19:
            return False, "Tuổi phải nằm trong khoảng từ 1 đến 19"
    except ValueError:
        return False, "Tuổi phải là một số nguyên"
    
    # Đăng ký người dùng
    success, result = User.register(name, email, password, age, gender)
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
        # Tạo token JWT
        access_token = create_access_token(
            identity=str(user.user_id),
            expires_delta=timedelta(days=1)  # Token hết hạn sau 1 ngày
        )
        
        return True, {
            "access_token": access_token,
            "user": {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "age": user.age,
                "gender": user.gender
            }
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
        age = data.get('age')
        gender = data.get('gender')
        
        success, result = register_user(name, email, password, age, gender)
        
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
        
        success, result = login_user(email, password)
        
        if success:
            return jsonify({
                "success": True,
                "access_token": result.get("access_token"),
                "user": result.get("user")
            })
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
                "age": user.age,
                "gender": user.gender,
                "created_at": user.created_at,
                "updated_at": user.updated_at
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
        user_id = get_jwt_identity()
        data = request.json
        
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        # Cập nhật thông tin
        if 'name' in data:
            user.name = data['name']
        
        if 'age' in data:
            try:
                age_val = int(data['age'])
                if age_val < 1 or age_val > 19:
                    return jsonify({
                        "success": False,
                        "error": "Tuổi phải nằm trong khoảng từ 1 đến 19"
                    }), 400
                user.age = age_val
            except ValueError:
                return jsonify({
                    "success": False,
                    "error": "Tuổi phải là một số nguyên"
                }), 400
        
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
        user_id = get_jwt_identity()
        data = request.json
        
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