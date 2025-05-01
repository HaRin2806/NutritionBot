import os
import datetime
from bson.objectid import ObjectId
import logging
from pymongo import MongoClient, DESCENDING
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

class Conversation:
    def __init__(self, user_id=None, title="Cuộc trò chuyện mới", age_context=None,
                 created_at=None, updated_at=None, is_archived=False, messages=None,
                 conversation_id=None):
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.title = title
        self.age_context = age_context
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
        self.is_archived = is_archived
        self.messages = messages or []

    def to_dict(self):
        """Chuyển đổi thông tin cuộc hội thoại thành dictionary"""
        conversation_dict = {
            "user_id": self.user_id,
            "title": self.title,
            "age_context": self.age_context,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_archived": self.is_archived,
            "messages": self.messages
        }
        if self.conversation_id:
            conversation_dict["_id"] = self.conversation_id
        return conversation_dict

    @classmethod
    def from_dict(cls, conversation_dict):
        """Tạo đối tượng Conversation từ dictionary"""
        if not conversation_dict:
            return None
            
        return cls(
            conversation_id=conversation_dict.get("_id"),
            user_id=conversation_dict.get("user_id"),
            title=conversation_dict.get("title"),
            age_context=conversation_dict.get("age_context"),
            created_at=conversation_dict.get("created_at"),
            updated_at=conversation_dict.get("updated_at"),
            is_archived=conversation_dict.get("is_archived", False),
            messages=conversation_dict.get("messages", [])
        )

    def save(self):
        """Lưu thông tin cuộc hội thoại vào database"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Cập nhật thời gian
            self.updated_at = datetime.datetime.now()
            
            if not self.conversation_id:
                # Đây là cuộc hội thoại mới
                insert_result = conversations_collection.insert_one(self.to_dict())
                self.conversation_id = insert_result.inserted_id
                logger.info(f"Đã tạo cuộc hội thoại mới với ID: {self.conversation_id}")
                return self.conversation_id
            else:
                # Cập nhật cuộc hội thoại đã tồn tại
                conversations_collection.update_one(
                    {"_id": self.conversation_id}, 
                    {"$set": self.to_dict()}
                )
                logger.info(f"Đã cập nhật thông tin cuộc hội thoại: {self.conversation_id}")
                return self.conversation_id
        except Exception as e:
            logger.error(f"Lỗi khi lưu thông tin cuộc hội thoại: {e}")
            raise

    def add_message(self, role, content, sources=None, metadata=None):
        """Thêm tin nhắn mới vào cuộc hội thoại"""
        timestamp = datetime.datetime.now()
        
        message = {
            "_id": ObjectId(),
            "role": role,
            "content": content,
            "timestamp": timestamp
        }
        
        if sources:
            message["sources"] = sources
            
        if metadata:
            message["metadata"] = metadata
            
        # Thêm tin nhắn vào danh sách
        self.messages.append(message)
        
        # Cập nhật thời gian của cuộc hội thoại
        self.updated_at = timestamp
        
        # Lưu thay đổi vào database
        self.save()
        
        return message["_id"]
        
    def delete(self):
        """Xóa cuộc hội thoại từ database"""
        try:
            if self.conversation_id:
                db = get_db()
                conversations_collection = db.conversations
                conversations_collection.delete_one({"_id": self.conversation_id})
                logger.info(f"Đã xóa cuộc hội thoại: {self.conversation_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Lỗi khi xóa cuộc hội thoại: {e}")
            return False

    def archive(self):
        """Đánh dấu cuộc hội thoại như đã lưu trữ"""
        self.is_archived = True
        self.save()
        return True
        
    def unarchive(self):
        """Hủy đánh dấu cuộc hội thoại đã lưu trữ"""
        self.is_archived = False
        self.save()
        return True

    @classmethod
    def find_by_id(cls, conversation_id):
        """Tìm cuộc hội thoại theo ID"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            conversation_data = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
            return cls.from_dict(conversation_data)
        except Exception as e:
            logger.error(f"Lỗi tìm cuộc hội thoại theo ID: {e}")
            return None

    @classmethod
    def find_by_user(cls, user_id, limit=10, skip=0, include_archived=False):
        """Tìm cuộc hội thoại theo user ID"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Tạo filter
            query_filter = {"user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id}
            
            # Thêm điều kiện lọc các cuộc hội thoại đã lưu trữ
            if not include_archived:
                query_filter["is_archived"] = False
            
            # Thực hiện truy vấn
            conversations_data = conversations_collection.find(
                query_filter
            ).sort("updated_at", DESCENDING).skip(skip).limit(limit)
            
            # Chuyển đổi dữ liệu thành objects
            return [cls.from_dict(conversation) for conversation in conversations_data]
        except Exception as e:
            logger.error(f"Lỗi tìm cuộc hội thoại theo user ID: {e}")
            return []

    @classmethod
    def count_by_user(cls, user_id, include_archived=False):
        """Đếm số lượng cuộc hội thoại của một user"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Tạo filter
            query_filter = {"user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id}
            
            # Thêm điều kiện lọc các cuộc hội thoại đã lưu trữ
            if not include_archived:
                query_filter["is_archived"] = False
                
            return conversations_collection.count_documents(query_filter)
        except Exception as e:
            logger.error(f"Lỗi đếm cuộc hội thoại theo user ID: {e}")
            return 0

    @classmethod
    def search_by_content(cls, user_id, query, limit=10, skip=0):
        """Tìm kiếm cuộc hội thoại theo nội dung tin nhắn"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Tạo filter để tìm kiếm cuộc hội thoại với nội dung tin nhắn chứa từ khóa
            query_filter = {
                "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
                "messages.content": {"$regex": query, "$options": "i"}  # Tìm kiếm không phân biệt hoa thường
            }
            
            # Thực hiện truy vấn
            conversations_data = conversations_collection.find(
                query_filter
            ).sort("updated_at", DESCENDING).skip(skip).limit(limit)
            
            # Chuyển đổi dữ liệu thành objects
            return [cls.from_dict(conversation) for conversation in conversations_data]
        except Exception as e:
            logger.error(f"Lỗi tìm kiếm cuộc hội thoại theo nội dung: {e}")
            return []

    @classmethod
    def get_stats(cls):
        """Lấy thống kê về cuộc hội thoại"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Tổng số cuộc hội thoại
            total_conversations = conversations_collection.count_documents({})
            
            # Số lượng tin nhắn trung bình
            pipeline = [
                {"$project": {"message_count": {"$size": "$messages"}}},
                {"$group": {"_id": None, "avg_messages": {"$avg": "$message_count"}}}
            ]
            avg_result = list(conversations_collection.aggregate(pipeline))
            avg_messages = avg_result[0]["avg_messages"] if avg_result else 0
            
            # Số cuộc hội thoại trong 7 ngày qua
            seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)
            recent_conversations = conversations_collection.count_documents({
                "created_at": {"$gte": seven_days_ago}
            })
            
            return {
                "total_conversations": total_conversations,
                "avg_messages_per_conversation": avg_messages,
                "recent_conversations": recent_conversations
            }
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê cuộc hội thoại: {e}")
            return {
                "total_conversations": 0,
                "avg_messages_per_conversation": 0,
                "recent_conversations": 0
            }