import os
import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
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

def ensure_indexes():
    """Tạo các index cần thiết cho feedback collection"""
    try:
        db = get_db()
        feedback_collection = db.feedback
        
        # Index cho user_id
        feedback_collection.create_index("user_id")
        
        # Index cho status
        feedback_collection.create_index("status")
        
        # Index cho category
        feedback_collection.create_index("category")
        
        # Index cho created_at (để sắp xếp)
        feedback_collection.create_index([("created_at", -1)])
        
        logger.info("Đã tạo indexes cho feedback collection")
        
    except Exception as e:
        logger.error(f"Lỗi tạo indexes: {e}")

class Feedback:
    def __init__(self, user_id=None, rating=5, category='', title='', content='',
                 status='pending', admin_response='', created_at=None, updated_at=None,
                 feedback_id=None):
        self.feedback_id = feedback_id
        self.user_id = user_id
        self.rating = rating
        self.category = category
        self.title = title
        self.content = content
        self.status = status  # pending, reviewed, resolved
        self.admin_response = admin_response
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()

    def to_dict(self):
        """Chuyển đổi thông tin feedback thành dictionary"""
        feedback_dict = {
            "user_id": self.user_id,
            "rating": self.rating,
            "category": self.category,
            "title": self.title,
            "content": self.content,
            "status": self.status,
            "admin_response": self.admin_response,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        if self.feedback_id:
            feedback_dict["_id"] = self.feedback_id
        return feedback_dict

    @classmethod
    def from_dict(cls, feedback_dict):
        """Tạo đối tượng Feedback từ dictionary"""
        if not feedback_dict:
            return None
            
        return cls(
            feedback_id=feedback_dict.get("_id"),
            user_id=feedback_dict.get("user_id"),
            rating=feedback_dict.get("rating", 5),
            category=feedback_dict.get("category", ""),
            title=feedback_dict.get("title", ""),
            content=feedback_dict.get("content", ""),
            status=feedback_dict.get("status", "pending"),
            admin_response=feedback_dict.get("admin_response", ""),
            created_at=feedback_dict.get("created_at"),
            updated_at=feedback_dict.get("updated_at")
        )

    def save(self):
        """Lưu thông tin feedback vào database"""
        try:
            db = get_db()
            feedback_collection = db.feedback
            
            self.updated_at = datetime.datetime.now()
            
            if not self.feedback_id:
                insert_result = feedback_collection.insert_one(self.to_dict())
                self.feedback_id = insert_result.inserted_id
                logger.info(f"Đã tạo feedback mới với ID: {self.feedback_id}")
                return self.feedback_id
            else:
                feedback_collection.update_one(
                    {"_id": self.feedback_id}, 
                    {"$set": self.to_dict()}
                )
                logger.info(f"Đã cập nhật feedback: {self.feedback_id}")
                return self.feedback_id
        except Exception as e:
            logger.error(f"Lỗi khi lưu feedback: {e}")
            raise

    @classmethod
    def find_by_id(cls, feedback_id):
        """Tìm feedback theo ID"""
        try:
            db = get_db()
            feedback_collection = db.feedback
            
            if isinstance(feedback_id, str):
                feedback_id = ObjectId(feedback_id)
                
            feedback_dict = feedback_collection.find_one({"_id": feedback_id})
            
            if feedback_dict:
                return cls.from_dict(feedback_dict)
            return None
        except Exception as e:
            logger.error(f"Lỗi khi tìm feedback: {e}")
            return None

    @classmethod
    def find_by_user(cls, user_id, limit=10, skip=0):
        """Tìm feedback theo user_id"""
        try:
            db = get_db()
            feedback_collection = db.feedback
            
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            feedbacks_cursor = feedback_collection.find({"user_id": user_id})\
                .sort("created_at", -1)\
                .skip(skip)\
                .limit(limit)
            
            result = []
            for feedback_dict in feedbacks_cursor:
                feedback_obj = cls.from_dict(feedback_dict)
                if feedback_obj:
                    result.append(feedback_obj)
            
            return result
            
        except Exception as e:
            logger.error(f"Lỗi tìm feedback theo user: {e}")
            return []

    @classmethod
    def get_all_for_admin(cls, limit=20, skip=0, status_filter=None):
        """Lấy tất cả feedback cho admin với join user info"""
        try:
            db = get_db()
            feedback_collection = db.feedback
            
            # Tạo query filter
            query_filter = {}
            if status_filter:
                query_filter["status"] = status_filter
            
            # Aggregate để join với user collection
            pipeline = [
                {"$match": query_filter},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "user_info"
                    }
                },
                {"$sort": {"created_at": -1}},
                {"$skip": skip},
                {"$limit": limit}
            ]
            
            result = []
            for feedback_doc in feedback_collection.aggregate(pipeline):
                feedback = cls.from_dict(feedback_doc)
                
                # Thêm thông tin user nếu có
                if feedback and feedback_doc.get("user_info"):
                    user_info = feedback_doc["user_info"][0]
                    feedback.user_name = user_info.get("name", "Ẩn danh")
                    feedback.user_email = user_info.get("email", "")
                else:
                    feedback.user_name = "Ẩn danh"
                    feedback.user_email = ""
                
                result.append(feedback)
            
            return result
            
        except Exception as e:
            logger.error(f"Lỗi lấy feedback cho admin: {e}")
            return []

    def update_admin_response(self, response, status):
        """Cập nhật phản hồi từ admin"""
        try:
            self.admin_response = response
            self.status = status
            self.save()
            return True
        except Exception as e:
            logger.error(f"Lỗi cập nhật admin response: {e}")
            return False

    @staticmethod
    def get_stats():
        """Lấy thống kê về feedback"""
        try:
            db = get_db()
            feedback_collection = db.feedback
            
            # Tổng số feedback
            total_feedback = feedback_collection.count_documents({})
            
            # Feedback pending
            pending_feedback = feedback_collection.count_documents({"status": "pending"})
            
            # Feedback trong tháng này
            now = datetime.datetime.now()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            this_month_feedback = feedback_collection.count_documents({
                "created_at": {"$gte": month_start}
            })
            
            # Đánh giá trung bình
            pipeline = [
                {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
            ]
            rating_result = list(feedback_collection.aggregate(pipeline))
            average_rating = rating_result[0]["avg_rating"] if rating_result else 0
            
            return {
                "total_feedback": total_feedback,
                "pending_feedback": pending_feedback,
                "this_month_feedback": this_month_feedback,
                "average_rating": average_rating
            }
            
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê feedback: {e}")
            return {
                "total_feedback": 0,
                "pending_feedback": 0,
                "this_month_feedback": 0,
                "average_rating": 0
            }

    @staticmethod
    def create_feedback(user_id, rating, category, title, content):
        """Tạo feedback mới"""
        try:
            feedback = Feedback(
                user_id=ObjectId(user_id) if isinstance(user_id, str) else user_id,
                rating=rating,
                category=category,
                title=title,
                content=content
            )
            
            feedback_id = feedback.save()
            return True, {"feedback_id": str(feedback_id)}
            
        except Exception as e:
            logger.error(f"Lỗi tạo feedback: {e}")
            return False, str(e)