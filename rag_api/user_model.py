import os
import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

# Kết nối MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "nutribot_db")

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
users_collection = db.users

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
        user_data = users_collection.find_one({"email": email})
        return cls.from_dict(user_data) if user_data else None

    @classmethod
    def find_by_id(cls, user_id):
        """Tìm người dùng theo ID"""
        user_data = users_collection.find_one({"_id": ObjectId(user_id)})
        return cls.from_dict(user_data) if user_data else None

    def save(self):
        """Lưu thông tin người dùng vào database"""
        if not self.user_id:
            # Đây là người dùng mới
            insert_result = users_collection.insert_one(self.to_dict())
            self.user_id = insert_result.inserted_id
            return self.user_id
        else:
            # Cập nhật người dùng đã tồn tại
            self.updated_at = datetime.datetime.now()
            users_collection.update_one(
                {"_id": self.user_id}, 
                {"$set": self.to_dict()}
            )
            return self.user_id

    def delete(self):
        """Xóa người dùng từ database"""
        if self.user_id:
            users_collection.delete_one({"_id": self.user_id})
            return True
        return False

    @staticmethod
    def register(name, email, password, age, gender=None):
        """Đăng ký người dùng mới"""
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
            age=age,
            gender=gender
        )
        
        # Lưu vào database
        user_id = new_user.save()
        return True, str(user_id)

    @staticmethod
    def login(email, password):
        """Đăng nhập"""
        user = User.find_by_email(email)
        if not user:
            return False, "Email không tồn tại"
        
        if not User.check_password(user.password, password):
            return False, "Mật khẩu không chính xác"
        
        return True, user