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

    def add_message(self, role, content, sources=None, metadata=None, parent_message_id=None):
        """Thêm tin nhắn mới vào cuộc hội thoại với hỗ trợ versioning"""
        timestamp = datetime.datetime.now()
        
        message = {
            "_id": ObjectId(),
            "role": role,
            "content": content,
            "timestamp": timestamp,
            "versions": [{
                "content": content,
                "timestamp": timestamp,
                "version": 1
            }],
            "current_version": 1,
            "parent_message_id": parent_message_id,  # Để track message thread
            "is_edited": False
        }
        
        if sources:
            message["sources"] = sources
            message["versions"][0]["sources"] = sources
            
        if metadata:
            message["metadata"] = metadata
            message["versions"][0]["metadata"] = metadata
            
        # Thêm tin nhắn vào danh sách
        self.messages.append(message)
        
        # Cập nhật thời gian của cuộc hội thoại
        self.updated_at = timestamp
        
        # Lưu thay đổi vào database
        self.save()
        
        return message["_id"]

    def edit_message(self, message_id, new_content):
        """Chỉnh sửa tin nhắn và xóa tất cả tin nhắn sau nó, tạo version mới"""
        try:
            # Tìm tin nhắn cần chỉnh sửa
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            message = self.messages[message_index]
            
            # Chỉ cho phép chỉnh sửa tin nhắn của user
            if message["role"] != "user":
                return False, "Chỉ có thể chỉnh sửa tin nhắn của người dùng"
            
            timestamp = datetime.datetime.now()
            
            # Tạo version mới cho tin nhắn được edit
            new_version = len(message.get("versions", [])) + 1
            new_version_data = {
                "content": new_content,
                "timestamp": timestamp,
                "version": new_version
            }
            
            # Cập nhật tin nhắn với version mới
            if "versions" not in message:
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": message.get("timestamp", timestamp),
                    "version": 1
                }]
            
            message["versions"].append(new_version_data)
            message["current_version"] = new_version
            message["content"] = new_content  # Cập nhật content hiện tại
            message["is_edited"] = True
            
            # QUAN TRỌNG: Xóa tất cả tin nhắn sau tin nhắn được edit
            self.messages = self.messages[:message_index + 1]
            
            # Cập nhật thời gian của cuộc hội thoại
            self.updated_at = timestamp
            
            # Lưu thay đổi vào database
            self.save()
            
            logger.info(f"Đã chỉnh sửa tin nhắn {message_id} và xóa {len(self.messages) - message_index - 1} tin nhắn sau nó")
            
            return True, "Đã chỉnh sửa tin nhắn thành công"
            
        except Exception as e:
            logger.error(f"Lỗi khi chỉnh sửa tin nhắn: {e}")
            return False, f"Lỗi khi chỉnh sửa tin nhắn: {str(e)}"

    def regenerate_bot_response_after_edit(self, user_message_id, new_response, sources=None):
        """Thêm phản hồi bot mới sau khi edit tin nhắn user"""
        try:
            # Tìm tin nhắn user vừa được edit
            user_message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(user_message_id):
                    user_message_index = i
                    break
            
            if user_message_index is None:
                return False, "Không tìm thấy tin nhắn user"
            
            # Thêm phản hồi bot mới ngay sau tin nhắn user
            timestamp = datetime.datetime.now()
            bot_message = {
                "_id": ObjectId(),
                "role": "bot",
                "content": new_response,
                "timestamp": timestamp,
                "versions": [{
                    "content": new_response,
                    "timestamp": timestamp,
                    "version": 1
                }],
                "current_version": 1,
                "parent_message_id": self.messages[user_message_index]["_id"],
                "is_edited": False
            }
            
            if sources:
                bot_message["sources"] = sources
                bot_message["versions"][0]["sources"] = sources
            
            # Thêm bot message vào cuộc hội thoại
            self.messages.append(bot_message)
            
            # Cập nhật thời gian
            self.updated_at = timestamp
            
            # Lưu thay đổi
            self.save()
            
            return True, "Đã tạo phản hồi mới"
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo phản hồi mới: {e}")
            return False, f"Lỗi: {str(e)}"

    def switch_message_version(self, message_id, version_number):
        """Chuyển đổi version của tin nhắn"""
        try:
            # Tìm tin nhắn
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            message = self.messages[message_index]
            
            # Kiểm tra version có tồn tại không
            if version_number > len(message["versions"]) or version_number < 1:
                return False, "Version không tồn tại"
            
            # Chuyển đổi version
            selected_version = message["versions"][version_number - 1]
            message["current_version"] = version_number
            message["content"] = selected_version["content"]
            
            # Cập nhật sources và metadata nếu có
            if "sources" in selected_version:
                message["sources"] = selected_version["sources"]
            if "metadata" in selected_version:
                message["metadata"] = selected_version["metadata"]
            
            # Lưu thay đổi vào database
            self.save()
            
            return True, "Đã chuyển đổi version thành công"
            
        except Exception as e:
            logger.error(f"Lỗi khi chuyển đổi version tin nhắn: {e}")
            return False, f"Lỗi khi chuyển đổi version: {str(e)}"

    def regenerate_bot_response(self, user_message_id):
        """Tạo lại phản hồi của bot cho tin nhắn user cụ thể"""
        try:
            # Tìm tin nhắn user
            user_message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(user_message_id):
                    user_message_index = i
                    break
            
            if user_message_index is None:
                return False, "Không tìm thấy tin nhắn của người dùng"
            
            user_message = self.messages[user_message_index]
            
            if user_message["role"] != "user":
                return False, "Chỉ có thể tạo lại phản hồi cho tin nhắn của người dùng"
            
            # Tìm tin nhắn bot tương ứng (tin nhắn ngay sau tin nhắn user)
            bot_message_index = user_message_index + 1
            
            if bot_message_index < len(self.messages) and self.messages[bot_message_index]["role"] == "bot":
                # Đánh dấu cần tạo lại phản hồi
                self.messages[bot_message_index]["regenerate_required"] = True
                self.save()
                return True, "Đã đánh dấu cần tạo lại phản hồi"
            else:
                # Không có tin nhắn bot tương ứng
                return False, "Không tìm thấy tin nhắn bot tương ứng"
                
        except Exception as e:
            logger.error(f"Lỗi khi đánh dấu tạo lại phản hồi: {e}")
            return False, f"Lỗi: {str(e)}"

    def get_message_by_id(self, message_id):
        """Lấy tin nhắn theo ID và convert ObjectId thành string"""
        for message in self.messages:
            if str(message["_id"]) == str(message_id):
                # Convert ObjectId thành string để có thể serialize JSON
                message_copy = message.copy()
                message_copy["_id"] = str(message_copy["_id"])
                if "parent_message_id" in message_copy and message_copy["parent_message_id"]:
                    message_copy["parent_message_id"] = str(message_copy["parent_message_id"])
                return message_copy
        return None

    def delete_message_and_following(self, message_id):
        """Xóa tin nhắn và tất cả tin nhắn sau nó"""
        try:
            # Tìm index của tin nhắn cần xóa
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            # Xóa tin nhắn và tất cả tin nhắn sau nó
            self.messages = self.messages[:message_index]
            
            # Cập nhật thời gian
            self.updated_at = datetime.datetime.now()
            
            # Lưu thay đổi
            self.save()
            
            return True, "Đã xóa tin nhắn và các tin nhắn sau nó"
            
        except Exception as e:
            logger.error(f"Lỗi khi xóa tin nhắn: {e}")
            return False, f"Lỗi: {str(e)}"
        
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