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
    def __init__(self, name, email, password, age, gender=None, user_id=None,
                 created_at=None, updated_at=None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.password = password  # Mật khẩu đã mã hóa
        self.age = age
        self.gender = gender
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()

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
        """Chuyển đổi thông tin user thành dictionary"""
        user_dict = {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "age": self.age,
            "gender": self.gender,
            "created_at": self.created_at,
            "updated_at": self.updated_at
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
            age=user_dict.get("age"),
            gender=user_dict.get("gender"),
            created_at=user_dict.get("created_at"),
            updated_at=user_dict.get("updated_at")
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
    def register(name, email, password, age, gender=None):
        """Đăng ký người dùng mới"""
        try:
            # Kiểm tra email đã tồn tại chưa
            existing_user = User.find_by_email(email)
            if existing_user:
                return False, "Email đã được sử dụng"
            
            # Mã hóa mật khẩu
            hashed_password = User.hash_password(password)
            
            # Chuyển đổi age thành số
            try:
                age = int(age)
            except (ValueError, TypeError):
                return False, "Tuổi không hợp lệ"
                
            if age < 1 or age > 19:
                return False, "Tuổi phải nằm trong khoảng từ 1 đến 19"
            
            # Tạo người dùng mới
            new_user = User(
                name=name,
                email=email,
                password=hashed_password,
                age=age,
                gender=gender
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
            
            return True, user
        except Exception as e:
            logger.error(f"Lỗi đăng nhập: {e}")
            return False, f"Lỗi đăng nhập: {str(e)}"
    
    @staticmethod
    def get_all_users(limit=100, skip=0):
        """Lấy danh sách người dùng (hạn chế với phân trang)"""
        try:
            db = get_db()
            users_collection = db.users
            users_data = users_collection.find().skip(skip).limit(limit)
            
            users = []
            for user_data in users_data:
                user = User.from_dict(user_data)
                users.append({
                    "id": str(user.user_id),
                    "name": user.name,
                    "email": user.email,
                    "age": user.age,
                    "gender": user.gender,
                    "created_at": user.created_at
                })
            
            return users
        except Exception as e:
            logger.error(f"Lỗi lấy danh sách người dùng: {e}")
            return []
    
    @staticmethod
    def count_users():
        """Đếm tổng số người dùng"""
        try:
            db = get_db()
            users_collection = db.users
            return users_collection.count_documents({})
        except Exception as e:
            logger.error(f"Lỗi đếm số người dùng: {e}")
            return 0
    
    @staticmethod
    def get_user_stats():
        """Lấy thống kê về người dùng"""
        try:
            db = get_db()
            users_collection = db.users
            
            # Tổng số người dùng
            total_users = users_collection.count_documents({})
            
            # Thống kê theo độ tuổi
            age_pipeline = [
                {"$group": {"_id": "$age", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            age_stats = list(users_collection.aggregate(age_pipeline))
            
            # Thống kê theo giới tính
            gender_pipeline = [
                {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            gender_stats = list(users_collection.aggregate(gender_pipeline))
            
            # Thống kê người dùng mới trong 30 ngày qua
            thirty_days_ago = datetime.datetime.now() - datetime.timedelta(days=30)
            new_users = users_collection.count_documents({"created_at": {"$gte": thirty_days_ago}})
            
            return {
                "total_users": total_users,
                "new_users_last_30_days": new_users,
                "age_distribution": {str(stat["_id"]): stat["count"] for stat in age_stats},
                "gender_distribution": {str(stat["_id"] or "unknown"): stat["count"] for stat in gender_stats}
            }
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê người dùng: {e}")
            return {
                "total_users": 0,
                "new_users_last_30_days": 0,
                "age_distribution": {},
                "gender_distribution": {}
            }
    
    def update_last_login(self):
        """Cập nhật thời gian đăng nhập cuối cùng"""
        try:
            if not self.user_id:
                return False
                
            db = get_db()
            users_collection = db.users
            
            # Cập nhật thời gian đăng nhập cuối
            last_login = datetime.datetime.now()
            users_collection.update_one(
                {"_id": self.user_id},
                {"$set": {"last_login": last_login}}
            )
            
            return True
        except Exception as e:
            logger.error(f"Lỗi cập nhật thời gian đăng nhập: {e}")
            return False