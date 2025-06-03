#!/usr/bin/env python3
"""
Script khởi tạo admin mặc định cho hệ thống Nutribot
Chạy script này để tạo tài khoản admin đầu tiên
"""

import os
import sys
import logging

# Thêm thư mục cha vào sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user_model import User

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_default_admin():
    """Tạo admin mặc định"""
    try:
        print("=" * 50)
        print("KHỞI TẠO ADMIN NUTRIBOT")
        print("=" * 50)
        
        # Kiểm tra xem đã có admin chưa
        from models.user_model import get_db
        db = get_db()
        existing_admin = db.users.find_one({"role": "admin"})
        
        if existing_admin:
            print("❌ Đã có admin trong hệ thống!")
            print(f"Admin hiện tại: {existing_admin.get('name')} ({existing_admin.get('email')})")
            
            choice = input("\nBạn có muốn tạo admin mới không? (y/N): ").lower().strip()
            if choice != 'y':
                print("Hủy bỏ tạo admin.")
                return
        
        # Nhập thông tin admin
        print("\nNhập thông tin cho admin mới:")
        
        name = input("Họ tên: ").strip()
        if not name:
            name = "Administrator"
            print(f"Sử dụng tên mặc định: {name}")
        
        email = input("Email: ").strip()
        if not email:
            email = "admin@nutribot.com"
            print(f"Sử dụng email mặc định: {email}")
        
        # Kiểm tra email đã tồn tại
        if User.find_by_email(email):
            print(f"❌ Email {email} đã được sử dụng!")
            return
        
        password = input("Mật khẩu (tối thiểu 6 ký tự): ").strip()
        if not password or len(password) < 6:
            password = "Admin123!"
            print(f"Sử dụng mật khẩu mặc định: {password}")
        
        gender = input("Giới tính (male/female/other, có thể bỏ trống): ").strip()
        if gender and gender not in ['male', 'female', 'other']:
            gender = None
        
        # Tạo admin
        print("\nĐang tạo admin...")
        success, result = User.create_admin(name, email, password, gender)
        
        if success:
            print("✅ Tạo admin thành công!")
            print("\n" + "=" * 50)
            print("THÔNG TIN ĐĂNG NHẬP ADMIN")
            print("=" * 50)
            print(f"Email: {email}")
            print(f"Mật khẩu: {password}")
            print(f"Tên: {name}")
            print(f"ID: {result['user_id']}")
            print("=" * 50)
            print("\n⚠️  LƯU Ý:")
            print("- Hãy ghi nhớ thông tin đăng nhập này")
            print("- Nên đổi mật khẩu sau lần đăng nhập đầu tiên")
            print("- Truy cập admin panel tại: http://localhost:5173/admin")
            print()
        else:
            print(f"❌ Lỗi tạo admin: {result}")
            
    except Exception as e:
        logger.error(f"Lỗi tạo admin: {e}")
        print(f"❌ Có lỗi xảy ra: {e}")

def main():
    """Hàm main"""
    try:
        create_default_admin()
    except KeyboardInterrupt:
        print("\n\nĐã hủy bỏ tạo admin.")
    except Exception as e:
        print(f"\nLỗi: {e}")

if __name__ == "__main__":
    main()