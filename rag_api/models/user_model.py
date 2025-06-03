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

# Kết nối MongoDB
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

class User:
    def __init__(self, name, email, password, gender=None, role="user", permissions=None,
                 user_id=None, created_at=None, updated_at=None, last_login=None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.password = password  # Mật khẩu đã mã hóa
        self.gender = gender
        self.role = role  # "user" hoặc "admin"
        self.permissions = permissions or self._get_default_permissions(role)
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
        self.last_login = last_login

    def _get_default_permissions(self, role):
        """Lấy quyền mặc định theo role"""
        if role == "admin":
            return {
                "users": {"read": True, "write": True, "delete": True},
                "documents": {"read": True, "write": True, "delete": True},
                "conversations": {"read": True, "write": True, "delete": True},
                "system": {"read": True, "write": True, "delete": False},
                "analytics": {"read": True, "write": False, "delete": False}
            }
        else:  # role == "user"
            return {
                "conversations": {"read": True, "write": True, "delete": True},
                "profile": {"read": True, "write": True, "delete": False}
            }

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

    def is_admin(self):
        """Kiểm tra xem user có phải admin không"""
        return self.role == "admin"

    def has_permission(self, resource, action):
        """Kiểm tra quyền truy cập"""
        if not self.permissions:
            return False
        
        resource_perms = self.permissions.get(resource, {})
        return resource_perms.get(action, False)

    def to_dict(self):
        """Chuyển đổi thông tin user thành dictionary"""
        user_dict = {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "gender": self.gender,
            "role": self.role,
            "permissions": self.permissions,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login
        }
        if self.user_id:
            user_dict["_id"] = self.user_id
        return user_dict

    @classmethod
    def from_dict(cls, user_dict):
        """Tạo đối tượng User từ dictionary"""
        if not user_dict:
            return None
            
        return cls(
            user_id=user_dict.get("_id"),
            name=user_dict.get("name"),
            email=user_dict.get("email"),
            password=user_dict.get("password"),
            gender=user_dict.get("gender"),
            role=user_dict.get("role", "user"),  # Mặc định là user
            permissions=user_dict.get("permissions"),
            created_at=user_dict.get("created_at"),
            updated_at=user_dict.get("updated_at"),
            last_login=user_dict.get("last_login")
        )

    @classmethod
    def find_by_email(cls, email):
        """Tìm người dùng theo email"""
        try:
            db = get_db()
            users_collection = db.users
            user_data = users_collection.find_one({"email": email})
            return cls.from_dict(user_data)
        except Exception as e:
            logger.error(f"Lỗi tìm người dùng theo email: {e}")
            return None

    @classmethod
    def find_by_id(cls, user_id):
        """Tìm người dùng theo ID"""
        try:
            db = get_db()
            users_collection = db.users
            user_data = users_collection.find_one({"_id": ObjectId(user_id)})
            return cls.from_dict(user_data)
        except Exception as e:
            logger.error(f"Lỗi tìm người dùng theo ID: {e}")
            return None

    @classmethod
    def get_all_admins(cls, page=1, per_page=10):
        """Lấy danh sách tất cả admin với phân trang"""
        try:
            db = get_db()
            users_collection = db.users
            
            skip = (page - 1) * per_page
            admins_data = users_collection.find(
                {"role": "admin"}
            ).sort("created_at", -1).skip(skip).limit(per_page)
            
            total = users_collection.count_documents({"role": "admin"})
            
            return [cls.from_dict(admin) for admin in admins_data], total
        except Exception as e:
            logger.error(f"Lỗi lấy danh sách admin: {e}")
            return [], 0

    def save(self):
        """Lưu thông tin người dùng vào database"""
        try:
            db = get_db()
            users_collection = db.users
            
            if not self.user_id:
                # Đây là người dùng mới
                insert_result = users_collection.insert_one(self.to_dict())
                self.user_id = insert_result.inserted_id
                logger.info(f"Đã tạo người dùng mới với ID: {self.user_id}")
                return self.user_id
            else:
                # Cập nhật người dùng đã tồn tại
                self.updated_at = datetime.datetime.now()
                users_collection.update_one(
                    {"_id": self.user_id}, 
                    {"$set": self.to_dict()}
                )
                logger.info(f"Đã cập nhật thông tin người dùng: {self.user_id}")
                return self.user_id
        except Exception as e:
            logger.error(f"Lỗi khi lưu thông tin người dùng: {e}")
            raise

    def update_last_login(self):
        """Cập nhật thời gian đăng nhập cuối"""
        try:
            self.last_login = datetime.datetime.now()
            self.save()
        except Exception as e:
            logger.error(f"Lỗi cập nhật last_login: {e}")

    def delete(self):
        """Xóa người dùng từ database"""
        try:
            if self.user_id:
                db = get_db()
                users_collection = db.users
                users_collection.delete_one({"_id": self.user_id})
                logger.info(f"Đã xóa người dùng: {self.user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Lỗi khi xóa người dùng: {e}")
            return False

    @staticmethod
    def register(name, email, password, gender=None, role="user"):
        """Đăng ký người dùng mới"""
        try:
            # Kiểm tra email đã tồn tại chưa
            existing_user = User.find_by_email(email)
            if existing_user:
                return False, "Email đã được sử dụng"
            
            # Mã hóa mật khẩu
            hashed_password = User.hash_password(password)
            
            # Tạo người dùng mới
            new_user = User(
                name=name,
                email=email,
                password=hashed_password,
                gender=gender,
                role=role
            )
            
            # Lưu vào database
            user_id = new_user.save()
            
            return True, {"user_id": str(user_id)}
        except Exception as e:
            logger.error(f"Lỗi đăng ký người dùng: {e}")
            return False, f"Lỗi đăng ký: {str(e)}"

    @staticmethod
    def login(email, password):
        """Đăng nhập người dùng"""
        try:
            if not email or not password:
                return False, "Vui lòng nhập đầy đủ thông tin đăng nhập"
            
            user = User.find_by_email(email)
            if not user:
                return False, "Email không tồn tại"
            
            if not User.check_password(user.password, password):
                return False, "Mật khẩu không chính xác"
            
            # Cập nhật thời gian đăng nhập
            user.update_last_login()
            
            return True, user
        except Exception as e:
            logger.error(f"Lỗi đăng nhập: {e}")
            return False, f"Lỗi đăng nhập: {str(e)}"

    @staticmethod
    def create_admin(name, email, password, gender=None):
        """Tạo admin mới"""
        return User.register(name, email, password, gender, role="admin")

    @staticmethod
    def create_default_admin():
        """Tạo admin mặc định nếu chưa có"""
        try:
            db = get_db()
            users_collection = db.users
            
            # Kiểm tra xem đã có admin chưa
            existing_admin = users_collection.find_one({"role": "admin"})
            
            if not existing_admin:
                # Tạo admin mặc định
                default_email = "admin@nutribot.com"
                default_password = "NutribotAdmin2024!"
                
                success, result = User.create_admin(
                    name="Administrator",
                    email=default_email,
                    password=default_password
                )
                
                if success:
                    logger.info(f"Đã tạo admin mặc định: {default_email}")
                    logger.info(f"Mật khẩu mặc định: {default_password}")
                    return True, {
                        "email": default_email,
                        "password": default_password,
                        "user_id": result["user_id"]
                    }
                else:
                    logger.error(f"Lỗi tạo admin mặc định: {result}")
                    return False, result
            else:
                logger.info("Admin đã tồn tại")
                return True, {"message": "Admin đã tồn tại"}
                
        except Exception as e:
            logger.error(f"Lỗi tạo admin mặc định: {e}")
            return False, str(e)

    @staticmethod
    def get_stats():
        """Lấy thống kê về users"""
        try:
            db = get_db()
            users_collection = db.users
            
            # Tổng số users
            total_users = users_collection.count_documents({})
            
            # Số admin
            total_admins = users_collection.count_documents({"role": "admin"})
            
            # Users đăng ký hôm nay
            today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            new_users_today = users_collection.count_documents({
                "created_at": {"$gte": today_start}
            })
            
            # Users có hoạt động (có last_login)
            active_users = users_collection.count_documents({
                "last_login": {"$exists": True}
            })
            
            return {
                "total_users": total_users,
                "total_admins": total_admins,
                "active_users": active_users,
                "new_users_today": new_users_today
            }
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê users: {e}")
            return {
                "total_users": 0,
                "total_admins": 0,
                "active_users": 0,
                "new_users_today": 0
            }