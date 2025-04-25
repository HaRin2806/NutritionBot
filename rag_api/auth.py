from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity, jwt_required
)
from datetime import timedelta
import re
from user_model import User

# Khởi tạo JWTManager trong app.py
# jwt = JWTManager(app)

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

def get_user_profile(user_id):
    """Lấy thông tin người dùng từ ID"""
    user = User.find_by_id(user_id)
    if user:
        return {
            "id": str(user.user_id),
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "gender": user.gender,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
    return None

def update_user_profile(user_id, name=None, age=None, gender=None):
    """Cập nhật thông tin người dùng"""
    user = User.find_by_id(user_id)
    if not user:
        return False, "Không tìm thấy người dùng"
    
    if name:
        user.name = name
    
    if age is not None:
        try:
            age_val = int(age)
            if age_val < 1 or age_val > 19:
                return False, "Tuổi phải nằm trong khoảng từ 1 đến 19"
            user.age = age_val
        except ValueError:
            return False, "Tuổi phải là một số nguyên"
    
    if gender is not None:
        user.gender = gender
    
    user.save()
    return True, "Cập nhật thông tin thành công"

def change_password(user_id, current_password, new_password):
    """Đổi mật khẩu người dùng"""
    user = User.find_by_id(user_id)
    if not user:
        return False, "Không tìm thấy người dùng"
    
    # Kiểm tra mật khẩu hiện tại
    if not User.check_password(user.password, current_password):
        return False, "Mật khẩu hiện tại không chính xác"
    
    # Kiểm tra mật khẩu mới
    if not validate_password(new_password):
        return False, "Mật khẩu mới phải có ít nhất 6 ký tự"
    
    # Cập nhật mật khẩu
    user.password = User.hash_password(new_password)
    user.save()
    
    return True, "Đổi mật khẩu thành công"