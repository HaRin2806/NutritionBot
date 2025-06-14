import os
import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
import logging
from dotenv import load_dotenv

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tải biến môi trường
load_dotenv()

# Kết nối MongoDB (sử dụng chung với user_model)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "nutribot_db")

# Singleton pattern cho kết nối MongoDB
_mongo_client = None
_db = None

def get_db():
    """Trả về instance của MongoDB database (singleton pattern)"""
    global _mongo_client, _db
    if _mongo_client is None:
        try:
            _mongo_client = MongoClient(MONGO_URI)
            _db = _mongo_client[DATABASE_NAME]
            logger.info(f"Đã kết nối đến database: {DATABASE_NAME}")
        except Exception as e:
            logger.error(f"Lỗi kết nối MongoDB: {e}")
            raise
    return _db

class AdminUser:
    def __init__(self, name, email, password, role="admin", permissions=None, 
                 user_id=None, created_at=None, updated_at=None, last_login=None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.password = password  # Mật khẩu đã mã hóa
        self.role = role  # admin, super_admin
        self.permissions = permissions or self._get_default_permissions(role)
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
        self.last_login = last_login
        self.is_active = True

    def _get_default_permissions(self, role):
        """Lấy quyền mặc định theo role"""
        if role == "super_admin":
            return {
                "users": {"read": True, "write": True, "delete": True},
                "documents": {"read": True, "write": True, "delete": True},
                "conversations": {"read": True, "write": True, "delete": True},
                "system": {"read": True, "write": True, "delete": True},
                "analytics": {"read": True, "write": True, "delete": True}
            }
        elif role == "admin":
            return {
                "users": {"read": True, "write": True, "delete": False},
                "documents": {"read": True, "write": True, "delete": True},
                "conversations": {"read": True, "write": False, "delete": True},
                "system": {"read": True, "write": False, "delete": False},
                "analytics": {"read": True, "write": False, "delete": False}
            }
        else:
            return {}

    @staticmethod
    def hash_password(password):
        """Mã hóa mật khẩu sử dụng bcrypt"""
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed_pw

    @staticmethod
    def check_password(hashed_password, password):
        """Kiểm tra mật khẩu"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

    def to_dict(self):
        """Chuyển đổi thông tin admin thành dictionary"""
        admin_dict = {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "role": self.role,
            "permissions": self.permissions,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login,
            "is_active": self.is_active
        }
        if self.user_id:
            admin_dict["_id"] = self.user_id
        return admin_dict

    @classmethod
    def from_dict(cls, admin_dict):
        """Tạo đối tượng AdminUser từ dictionary"""
        if not admin_dict:
            return None
            
        return cls(
            user_id=admin_dict.get("_id"),
            name=admin_dict.get("name"),
            email=admin_dict.get("email"),
            password=admin_dict.get("password"),
            role=admin_dict.get("role", "admin"),
            permissions=admin_dict.get("permissions"),
            created_at=admin_dict.get("created_at"),
            updated_at=admin_dict.get("updated_at"),
            last_login=admin_dict.get("last_login")
        )

    @classmethod
    def find_by_email(cls, email):
        """Tìm admin theo email"""
        try:
            db = get_db()
            admins_collection = db.admins
            admin_data = admins_collection.find_one({"email": email, "is_active": True})
            return cls.from_dict(admin_data)
        except Exception as e:
            logger.error(f"Lỗi tìm admin theo email: {e}")
            return None

    @classmethod
    def find_by_id(cls, user_id):
        """Tìm admin theo ID"""
        try:
            db = get_db()
            admins_collection = db.admins
            admin_data = admins_collection.find_one({"_id": ObjectId(user_id), "is_active": True})
            return cls.from_dict(admin_data)
        except Exception as e:
            logger.error(f"Lỗi tìm admin theo ID: {e}")
            return None

    @classmethod
    def get_all(cls, page=1, per_page=10):
        """Lấy danh sách tất cả admin với phân trang"""
        try:
            db = get_db()
            admins_collection = db.admins
            
            skip = (page - 1) * per_page
            admins_data = admins_collection.find(
                {"is_active": True}
            ).sort("created_at", -1).skip(skip).limit(per_page)
            
            total = admins_collection.count_documents({"is_active": True})
            
            return [cls.from_dict(admin) for admin in admins_data], total
        except Exception as e:
            logger.error(f"Lỗi lấy danh sách admin: {e}")
            return [], 0

    def save(self):
        """Lưu thông tin admin vào database"""
        try:
            db = get_db()
            admins_collection = db.admins
            
            if not self.user_id:
                # Đây là admin mới
                insert_result = admins_collection.insert_one(self.to_dict())
                self.user_id = insert_result.inserted_id
                logger.info(f"Đã tạo admin mới với ID: {self.user_id}")
                return self.user_id
            else:
                # Cập nhật admin đã tồn tại
                self.updated_at = datetime.datetime.now()
                admins_collection.update_one(
                    {"_id": self.user_id}, 
                    {"$set": self.to_dict()}
                )
                logger.info(f"Đã cập nhật thông tin admin: {self.user_id}")
                return self.user_id
        except Exception as e:
            logger.error(f"Lỗi khi lưu thông tin admin: {e}")
            raise

    def update_last_login(self):
        """Cập nhật thời gian đăng nhập cuối"""
        try:
            self.last_login = datetime.datetime.now()
            self.save()
        except Exception as e:
            logger.error(f"Lỗi cập nhật last_login: {e}")

    def has_permission(self, resource, action):
        """Kiểm tra quyền truy cập"""
        if not self.permissions:
            return False
        
        resource_perms = self.permissions.get(resource, {})
        return resource_perms.get(action, False)

    def delete(self):
        """Xóa mềm admin (đánh dấu is_active = False)"""
        try:
            self.is_active = False
            self.save()
            logger.info(f"Đã xóa admin: {self.user_id}")
            return True
        except Exception as e:
            logger.error(f"Lỗi khi xóa admin: {e}")
            return False

    @staticmethod
    def login(email, password):
        """Đăng nhập admin"""
        try:
            if not email or not password:
                return False, "Vui lòng nhập đầy đủ thông tin đăng nhập"
            
            admin = AdminUser.find_by_email(email)
            if not admin:
                return False, "Email không tồn tại hoặc không có quyền admin"
            
            if not AdminUser.check_password(admin.password, password):
                return False, "Mật khẩu không chính xác"
            
            # Cập nhật thời gian đăng nhập
            admin.update_last_login()
            
            return True, admin
        except Exception as e:
            logger.error(f"Lỗi đăng nhập admin: {e}")
            return False, f"Lỗi đăng nhập: {str(e)}"

    @staticmethod
    def create_admin(name, email, password, role="admin", permissions=None):
        """Tạo admin mới"""
        try:
            # Kiểm tra email đã tồn tại chưa
            existing_admin = AdminUser.find_by_email(email)
            if existing_admin:
                return False, "Email đã được sử dụng"
            
            # Mã hóa mật khẩu
            hashed_password = AdminUser.hash_password(password)
            
            # Tạo admin mới
            new_admin = AdminUser(
                name=name,
                email=email,
                password=hashed_password,
                role=role,
                permissions=permissions
            )
            
            # Lưu vào database
            admin_id = new_admin.save()
            
            return True, {"admin_id": str(admin_id)}
        except Exception as e:
            logger.error(f"Lỗi tạo admin: {e}")
            return False, f"Lỗi tạo admin: {str(e)}"

    @staticmethod
    def create_default_super_admin():
        """Tạo super admin mặc định nếu chưa có"""
        try:
            db = get_db()
            admins_collection = db.admins
            
            # Kiểm tra xem đã có super admin chưa
            existing_super_admin = admins_collection.find_one({
                "role": "super_admin", 
                "is_active": True
            })
            
            if not existing_super_admin:
                # Tạo super admin mặc định
                default_email = "admin@nutribot.com"
                default_password = "NutribotAdmin2024!"
                
                success, result = AdminUser.create_admin(
                    name="Super Admin",
                    email=default_email,
                    password=default_password,
                    role="super_admin"
                )
                
                if success:
                    logger.info(f"Đã tạo super admin mặc định: {default_email}")
                    logger.info(f"Mật khẩu mặc định: {default_password}")
                    return True, {
                        "email": default_email,
                        "password": default_password,
                        "admin_id": result["admin_id"]
                    }
                else:
                    logger.error(f"Lỗi tạo super admin mặc định: {result}")
                    return False, result
            else:
                logger.info("Super admin đã tồn tại")
                return True, {"message": "Super admin đã tồn tại"}
                
        except Exception as e:
            logger.error(f"Lỗi tạo super admin mặc định: {e}")
            return False, str(e)