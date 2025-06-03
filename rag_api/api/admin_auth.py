from flask import Blueprint, request, jsonify, make_response
import re
import logging
from models.admin_model import AdminUser
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
import datetime
from functools import wraps

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
admin_auth_routes = Blueprint('admin_auth', __name__)

def validate_email(email):
    """Kiểm tra định dạng email"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def validate_password(password):
    """Kiểm tra mật khẩu có đủ mạnh không"""
    return len(password) >= 8

def admin_required(resource=None, action="read"):
    """Decorator kiểm tra quyền admin"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                admin_id = get_jwt_identity()
                claims = get_jwt()
                
                # Kiểm tra xem có phải admin token không
                if not claims.get("is_admin"):
                    return jsonify({
                        "success": False,
                        "error": "Không có quyền truy cập admin"
                    }), 403
                
                # Lấy thông tin admin
                admin = AdminUser.find_by_id(admin_id)
                if not admin:
                    return jsonify({
                        "success": False,
                        "error": "Admin không tồn tại"
                    }), 403
                
                # Kiểm tra quyền cụ thể nếu có yêu cầu
                if resource and not admin.has_permission(resource, action):
                    return jsonify({
                        "success": False,
                        "error": f"Không có quyền {action} trên {resource}"
                    }), 403
                
                # Thêm admin vào request context
                request.current_admin = admin
                
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Lỗi xác thực admin: {e}")
                return jsonify({
                    "success": False,
                    "error": "Lỗi xác thực"
                }), 500
        return decorated_function
    return decorator

@admin_auth_routes.route('/login', methods=['POST'])
def admin_login():
    """API endpoint để đăng nhập admin"""
    try:
        data = request.json
        
        email = data.get('email')
        password = data.get('password')
        remember_me = data.get('rememberMe', False)
        
        if not email or not password:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập đầy đủ thông tin đăng nhập"
            }), 400
        
        success, result = AdminUser.login(email, password)
        
        if success:
            admin = result
            
            # Tạo JWT token với thời gian hết hạn 8 giờ cho admin
            expires = datetime.timedelta(hours=8)
            access_token = create_access_token(
                identity=str(admin.user_id), 
                expires_delta=expires,
                additional_claims={
                    "name": admin.name,
                    "email": admin.email,
                    "role": admin.role,
                    "permissions": admin.permissions,
                    "is_admin": True  # Đánh dấu đây là admin token
                }
            )
            
            # Tạo response với cookie
            response = make_response(jsonify({
                "success": True,
                "admin_id": str(admin.user_id),
                "admin": {
                    "id": str(admin.user_id),
                    "name": admin.name,
                    "email": admin.email,
                    "role": admin.role,
                    "permissions": admin.permissions,
                    "last_login": admin.last_login.isoformat() if admin.last_login else None
                },
                "access_token": access_token,
                "expires_in": 28800  # 8 giờ tính bằng giây
            }))
            
            # Thiết lập cookie JWT cho admin
            cookie_max_age = 28800 if remember_me else None  # 8h hoặc session cookie
            response.set_cookie(
                'admin_access_token',
                access_token,
                max_age=cookie_max_age,
                httponly=True,
                path='/api/admin',
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
        logger.error(f"Lỗi đăng nhập admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_auth_routes.route('/logout', methods=['POST'])
@admin_required()
def admin_logout():
    """API endpoint để đăng xuất admin"""
    response = make_response(jsonify({
        "success": True,
        "message": "Đăng xuất admin thành công"
    }))
    response.delete_cookie('admin_access_token', path='/api/admin')
    return response

@admin_auth_routes.route('/verify-token', methods=['POST'])
@admin_required()
def verify_admin_token():
    """API endpoint để kiểm tra token admin có hợp lệ không"""
    try:
        admin = request.current_admin
        
        return jsonify({
            "success": True,
            "admin_id": str(admin.user_id),
            "admin": {
                "id": str(admin.user_id),
                "name": admin.name,
                "email": admin.email,
                "role": admin.role,
                "permissions": admin.permissions,
                "last_login": admin.last_login.isoformat() if admin.last_login else None
            }
        })
    except Exception as e:
        logger.error(f"Lỗi xác thực token admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 401

@admin_auth_routes.route('/profile', methods=['GET'])
@admin_required()
def get_admin_profile():
    """API endpoint để lấy thông tin profile admin"""
    try:
        admin = request.current_admin
        
        profile = {
            "id": str(admin.user_id),
            "name": admin.name,
            "email": admin.email,
            "role": admin.role,
            "permissions": admin.permissions,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
            "updated_at": admin.updated_at.isoformat() if admin.updated_at else None,
            "last_login": admin.last_login.isoformat() if admin.last_login else None
        }
        
        return jsonify({
            "success": True,
            "admin": profile
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_auth_routes.route('/profile', methods=['PUT'])
@admin_required()
def update_admin_profile():
    """API endpoint để cập nhật thông tin profile admin"""
    try:
        data = request.json
        admin = request.current_admin
        
        # Cập nhật thông tin
        if 'name' in data:
            admin.name = data['name']
        
        # Lưu thông tin đã cập nhật
        admin.save()
        
        return jsonify({
            "success": True,
            "message": "Cập nhật thông tin thành công"
        })
            
    except Exception as e:
        logger.error(f"Lỗi cập nhật thông tin admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_auth_routes.route('/change-password', methods=['POST'])
@admin_required()
def change_admin_password():
    """API endpoint để đổi mật khẩu admin"""
    try:
        data = request.json
        admin = request.current_admin
            
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        # Kiểm tra mật khẩu hiện tại
        if not AdminUser.check_password(admin.password, current_password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu hiện tại không chính xác"
            }), 400
        
        # Kiểm tra mật khẩu mới
        if not validate_password(new_password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu mới phải có ít nhất 8 ký tự"
            }), 400
        
        # Cập nhật mật khẩu
        admin.password = AdminUser.hash_password(new_password)
        admin.save()
        
        return jsonify({
            "success": True,
            "message": "Đổi mật khẩu thành công"
        })
            
    except Exception as e:
        logger.error(f"Lỗi đổi mật khẩu admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_auth_routes.route('/create-admin', methods=['POST'])
@admin_required(resource="users", action="write")
def create_new_admin():
    """API endpoint để tạo admin mới (chỉ super_admin)"""
    try:
        data = request.json
        current_admin = request.current_admin
        
        # Chỉ super_admin mới được tạo admin khác
        if current_admin.role != "super_admin":
            return jsonify({
                "success": False,
                "error": "Chỉ Super Admin mới có quyền tạo admin mới"
            }), 403
        
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'admin')
        
        # Validate dữ liệu
        if not name or not email or not password:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập đầy đủ thông tin"
            }), 400
        
        if not validate_email(email):
            return jsonify({
                "success": False,
                "error": "Email không hợp lệ"
            }), 400
        
        if not validate_password(password):
            return jsonify({
                "success": False,
                "error": "Mật khẩu phải có ít nhất 8 ký tự"
            }), 400
        
        # Tạo admin mới
        success, result = AdminUser.create_admin(name, email, password, role)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Tạo admin mới thành công",
                "admin_id": result["admin_id"]
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi tạo admin mới: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_auth_routes.route('/init-super-admin', methods=['POST'])
def init_super_admin():
    """API endpoint để khởi tạo super admin mặc định"""
    try:
        success, result = AdminUser.create_default_super_admin()
        
        if success:
            return jsonify({
                "success": True,
                "message": "Khởi tạo super admin thành công",
                "data": result
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi khởi tạo super admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500