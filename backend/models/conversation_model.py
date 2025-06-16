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

def safe_isoformat(timestamp_obj):
    """Safely convert timestamp to isoformat string"""
    if timestamp_obj is None:
        return None
    
    if isinstance(timestamp_obj, str):
        return timestamp_obj
    
    if hasattr(timestamp_obj, 'isoformat'):
        return timestamp_obj.isoformat()
    
    # Nếu là các kiểu khác, convert về string
    try:
        return str(timestamp_obj)
    except:
        return None

def safe_datetime(timestamp_obj):
    """Safely convert various timestamp formats to datetime object"""
    if timestamp_obj is None:
        return datetime.datetime.now()
    
    if isinstance(timestamp_obj, datetime.datetime):
        return timestamp_obj
    
    if isinstance(timestamp_obj, str):
        try:
            # Thử parse ISO format
            return datetime.datetime.fromisoformat(timestamp_obj.replace('Z', '+00:00'))
        except:
            return datetime.datetime.now()
    
    return datetime.datetime.now()

class Conversation:
    def __init__(self, user_id=None, title="Cuộc trò chuyện mới", age_context=None,
                 created_at=None, updated_at=None, is_archived=False, messages=None,
                 conversation_id=None):
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.title = title
        self.age_context = age_context
        self.created_at = safe_datetime(created_at)
        self.updated_at = safe_datetime(updated_at)
        self.is_archived = is_archived
        self.messages = messages or []

    @classmethod
    def create(cls, user_id, title="Cuộc trò chuyện mới", age_context=None):
        """Tạo và lưu conversation mới vào database"""
        try:
            # Convert user_id to ObjectId if it's string
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            conversation = cls(
                user_id=user_id,
                title=title,
                age_context=age_context
            )
            
            # Lưu vào database và return ID
            conversation_id = conversation.save()
            conversation.conversation_id = conversation_id
            
            logger.info(f"Created new conversation: {conversation_id}")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise

    def to_dict(self):
        """Convert conversation object sang dictionary cho JSON serialization"""
        try:
            result = {
                "id": str(self.conversation_id),
                "user_id": str(self.user_id),
                "title": self.title,
                "age_context": self.age_context,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
                "is_archived": self.is_archived,
                "messages": []
            }

            for message in self.messages:
                # Xử lý timestamp an toàn
                timestamp_str = None
                if "timestamp" in message:
                    if hasattr(message["timestamp"], 'isoformat'):
                        timestamp_str = message["timestamp"].isoformat()
                    else:
                        timestamp_str = str(message["timestamp"])
                
                message_data = {
                    "id": str(message["_id"]),
                    "_id": str(message["_id"]),
                    "role": message["role"],
                    "content": message["content"],
                    "timestamp": timestamp_str,
                    "current_version": message.get("current_version", 1),
                    "is_edited": message.get("is_edited", False)
                }
                
                # Xử lý versions với timestamp checking
                if "versions" in message:
                    message_data["versions"] = []
                    for version in message["versions"]:
                        # Xử lý timestamp an toàn cho versions
                        version_timestamp = None
                        if "timestamp" in version:
                            if hasattr(version["timestamp"], 'isoformat'):
                                version_timestamp = version["timestamp"].isoformat()
                            else:
                                version_timestamp = str(version["timestamp"])
                        
                        version_data = {
                            "content": version["content"],
                            "timestamp": version_timestamp,
                            "version": version["version"]
                        }
                        if "sources" in version:
                            version_data["sources"] = version["sources"]
                        message_data["versions"].append(version_data)
                
                if "sources" in message:
                    message_data["sources"] = message["sources"]
                
                result["messages"].append(message_data)

            return result
        except Exception as e:
            logger.error(f"Lỗi khi convert conversation to dict: {e}")
            return None

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
            
            # Tạo dict để lưu vào database
            save_dict = {
                "user_id": self.user_id,
                "title": self.title,
                "age_context": self.age_context,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
                "is_archived": self.is_archived,
                "messages": []
            }
            
            # Process messages để đảm bảo timestamp là datetime object
            for message in self.messages:
                message_copy = message.copy()
                message_copy["timestamp"] = safe_datetime(message_copy.get("timestamp"))
                
                # Process versions
                if "versions" in message_copy:
                    for version in message_copy["versions"]:
                        version["timestamp"] = safe_datetime(version.get("timestamp"))
                
                save_dict["messages"].append(message_copy)
            
            if not self.conversation_id:
                # Đây là cuộc hội thoại mới
                insert_result = conversations_collection.insert_one(save_dict)
                self.conversation_id = insert_result.inserted_id
                logger.info(f"Saved new conversation with ID: {self.conversation_id}")
                return self.conversation_id
            else:
                # Cập nhật cuộc hội thoại đã tồn tại
                conversations_collection.update_one(
                    {"_id": self.conversation_id}, 
                    {"$set": save_dict}
                )
                logger.info(f"Updated conversation: {self.conversation_id}")
                return self.conversation_id
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
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
                "version": 1,
                "following_messages": []  # Lưu các tin nhắn theo sau version này
            }],
            "current_version": 1,
            "parent_message_id": parent_message_id,
            "is_edited": False
        }
        
        if sources:
            message["sources"] = sources
            message["versions"][0]["sources"] = sources
            
        if metadata:
            message["metadata"] = metadata
            message["versions"][0]["metadata"] = metadata

        self.messages.append(message)
        
        # Cập nhật thời gian của cuộc hội thoại
        self.updated_at = timestamp
        
        # Lưu thay đổi vào database
        self.save()
        
        logger.info(f"Added message to conversation {self.conversation_id}")
        
        return message["_id"]

    def create_following_messages_snapshot(self, from_index):
        """Tạo snapshot của tất cả tin nhắn từ vị trí from_index + 1 trở đi"""
        try:
            following_messages = []
            
            for i in range(from_index + 1, len(self.messages)):
                msg = self.messages[i]
                
                # Tạo snapshot đầy đủ của message
                msg_snapshot = {
                    "role": msg["role"],
                    "content": msg["content"],
                    "timestamp": safe_datetime(msg.get("timestamp")),
                    "current_version": msg.get("current_version", 1),
                    "is_edited": msg.get("is_edited", False)
                }
                
                # Lưu toàn bộ versions của message
                if "versions" in msg and msg["versions"]:
                    msg_snapshot["versions"] = []
                    for version in msg["versions"]:
                        version_data = {
                            "content": version["content"],
                            "timestamp": safe_datetime(version.get("timestamp")),
                            "version": version["version"]
                        }
                        if "sources" in version:
                            version_data["sources"] = version["sources"]
                        if "metadata" in version:
                            version_data["metadata"] = version["metadata"]
                        if "following_messages" in version:
                            version_data["following_messages"] = version["following_messages"]
                        msg_snapshot["versions"].append(version_data)
                else:
                    # Tạo version mặc định
                    msg_snapshot["versions"] = [{
                        "content": msg["content"],
                        "timestamp": safe_datetime(msg.get("timestamp")),
                        "version": 1,
                        "following_messages": []
                    }]
                
                if "sources" in msg:
                    msg_snapshot["sources"] = msg["sources"]
                
                if "metadata" in msg:
                    msg_snapshot["metadata"] = msg["metadata"]
                
                following_messages.append(msg_snapshot)
            
            logger.info(f"Created snapshot of {len(following_messages)} following messages from index {from_index}")
            return following_messages
            
        except Exception as e:
            logger.error(f"Lỗi tạo following messages snapshot: {e}")
            return []

    def edit_message(self, message_id, new_content):
        """Chỉnh sửa tin nhắn và lưu snapshot của tất cả tin nhắn theo sau"""
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
            
            # Tạo snapshot của tất cả tin nhắn theo sau
            following_messages = self.create_following_messages_snapshot(message_index)
            
            # Tạo version mới cho tin nhắn được edit
            new_version = len(message.get("versions", [])) + 1
            new_version_data = {
                "content": new_content,
                "timestamp": timestamp,
                "version": new_version,
                "following_messages": following_messages
            }
            
            # Cập nhật tin nhắn với version mới
            if "versions" not in message:
                # Tạo version 1 với snapshot hiện tại
                original_following = self.create_following_messages_snapshot(message_index)
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime(message.get("timestamp", timestamp)),
                    "version": 1,
                    "following_messages": original_following
                }]
            
            message["versions"].append(new_version_data)
            message["current_version"] = new_version
            message["content"] = new_content
            message["is_edited"] = True
            
            # Xóa tất cả tin nhắn sau tin nhắn được edit
            self.messages = self.messages[:message_index + 1]
            
            # Cập nhật thời gian của cuộc hội thoại
            self.updated_at = timestamp
            
            # Lưu thay đổi vào database
            self.save()
            
            logger.info(f"Đã chỉnh sửa tin nhắn {message_id} và lưu {len(following_messages)} following messages")
            
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
                    "version": 1,
                    "following_messages": []
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
            
            # Cập nhật following_messages của version hiện tại của user message
            user_message = self.messages[user_message_index]
            if "versions" in user_message:
                current_version_index = user_message["current_version"] - 1
                if current_version_index < len(user_message["versions"]):
                    # Thêm bot message vào following_messages của version hiện tại
                    if "following_messages" not in user_message["versions"][current_version_index]:
                        user_message["versions"][current_version_index]["following_messages"] = []
                    
                    bot_snapshot = {
                        "role": "bot",
                        "content": new_response,
                        "timestamp": timestamp,
                        "current_version": 1,
                        "is_edited": False,
                        "versions": [{
                            "content": new_response,
                            "timestamp": timestamp,
                            "version": 1,
                            "following_messages": []
                        }]
                    }
                    
                    if sources:
                        bot_snapshot["sources"] = sources
                        bot_snapshot["versions"][0]["sources"] = sources
                    
                    user_message["versions"][current_version_index]["following_messages"].append(bot_snapshot)
            
            # Cập nhật thời gian
            self.updated_at = timestamp
            
            # Lưu thay đổi
            self.save()
            
            logger.info(f"Đã thêm phản hồi bot mới cho tin nhắn user {user_message_id}")
            
            return True, "Đã tạo phản hồi mới"
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo phản hồi mới: {e}")
            return False, f"Lỗi: {str(e)}"

    def regenerate_response(self, message_id, new_response, sources=None):
        """Tạo version mới cho phản hồi bot và lưu following messages"""
        try:
            # Tìm tin nhắn bot cần regenerate
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            message = self.messages[message_index]
            
            # Chỉ cho phép regenerate tin nhắn bot
            if message["role"] != "bot":
                return False, "Chỉ có thể regenerate phản hồi của bot"
            
            timestamp = datetime.datetime.now()
            
            # Tạo snapshot của tất cả tin nhắn theo sau
            following_messages = self.create_following_messages_snapshot(message_index)
            
            # Tạo version mới
            new_version = len(message.get("versions", [])) + 1
            new_version_data = {
                "content": new_response,
                "timestamp": timestamp,
                "version": new_version,
                "following_messages": following_messages
            }
            
            if sources:
                new_version_data["sources"] = sources
            
            # Khởi tạo versions nếu chưa có
            if "versions" not in message:
                # Tạo version 1 với following messages hiện tại
                original_following = self.create_following_messages_snapshot(message_index)
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime(message.get("timestamp", timestamp)),
                    "version": 1,
                    "sources": message.get("sources", []),
                    "following_messages": original_following
                }]
            
            # Thêm version mới
            message["versions"].append(new_version_data)
            message["current_version"] = new_version
            message["content"] = new_response
            message["is_edited"] = True
            
            if sources:
                message["sources"] = sources
            
            # Xóa tất cả tin nhắn sau regenerate message
            self.messages = self.messages[:message_index + 1]
            
            # Cập nhật thời gian của cuộc hội thoại
            self.updated_at = timestamp
            
            # Lưu thay đổi vào database
            self.save()
            
            logger.info(f"Đã regenerate response cho tin nhắn {message_id}, version {new_version} với {len(following_messages)} following messages")
            
            return True, "Đã tạo phản hồi mới thành công"
            
        except Exception as e:
            logger.error(f"Lỗi khi regenerate response: {e}")
            return False, f"Lỗi: {str(e)}"

    def restore_following_messages(self, following_messages_data):
        """Restore các tin nhắn từ following_messages data"""
        try:
            restored_count = 0
            
            for msg_data in following_messages_data:
                # Tạo message mới với ObjectId mới
                new_message = {
                    "_id": ObjectId(),
                    "role": msg_data["role"],
                    "content": msg_data["content"],
                    "timestamp": safe_datetime(msg_data.get("timestamp")),
                    "current_version": msg_data.get("current_version", 1),
                    "is_edited": msg_data.get("is_edited", False)
                }
                
                # Restore versions structure đầy đủ
                if "versions" in msg_data and msg_data["versions"]:
                    new_message["versions"] = []
                    for version in msg_data["versions"]:
                        version_data = {
                            "content": version["content"],
                            "timestamp": safe_datetime(version.get("timestamp")),
                            "version": version["version"]
                        }
                        if "sources" in version:
                            version_data["sources"] = version["sources"]
                        if "metadata" in version:
                            version_data["metadata"] = version["metadata"]
                        if "following_messages" in version:
                            version_data["following_messages"] = version["following_messages"]
                        new_message["versions"].append(version_data)
                else:
                    # Tạo version mặc định
                    new_message["versions"] = [{
                        "content": msg_data["content"],
                        "timestamp": safe_datetime(msg_data.get("timestamp")),
                        "version": 1,
                        "following_messages": []
                    }]
                
                # Restore sources và metadata cho message hiện tại
                if "sources" in msg_data:
                    new_message["sources"] = msg_data["sources"]
                
                if "metadata" in msg_data:
                    new_message["metadata"] = msg_data["metadata"]
                
                self.messages.append(new_message)
                restored_count += 1
            
            logger.info(f"Restored {restored_count} following messages")
            return restored_count
            
        except Exception as e:
            logger.error(f"Lỗi restore following messages: {e}")
            return 0

    def switch_message_version(self, message_id, version_number):
        """Chuyển đổi version của tin nhắn và restore following messages từ snapshot"""
        try:
            # Tìm tin nhắn
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                logger.error(f"Không tìm thấy tin nhắn với ID: {message_id}")
                return False
            
            message = self.messages[message_index]
            
            # Kiểm tra version có tồn tại không
            if not message.get("versions") or version_number > len(message["versions"]) or version_number < 1:
                logger.error(f"Version {version_number} không tồn tại cho message {message_id}")
                return False
            
            logger.info(f"Switching message {message_id} to version {version_number}")
            
            # Lấy version được chọn
            selected_version = message["versions"][version_number - 1]
            
            # Cập nhật message hiện tại với content của version được chọn
            message["current_version"] = version_number
            message["content"] = selected_version["content"]
            
            # Cập nhật sources và metadata nếu có
            if "sources" in selected_version:
                message["sources"] = selected_version["sources"]
            elif "sources" in message:
                del message["sources"]
                    
            if "metadata" in selected_version:
                message["metadata"] = selected_version["metadata"]
            elif "metadata" in message:
                del message["metadata"]
            
            # Xóa tất cả tin nhắn sau message hiện tại trước
            self.messages = self.messages[:message_index + 1]
            
            # Restore following messages từ version được chọn
            if "following_messages" in selected_version and selected_version["following_messages"]:
                following_messages = selected_version["following_messages"]
                restored_count = self.restore_following_messages(following_messages)
                logger.info(f"Restored {restored_count} following messages from version {version_number}")
            
            # Cập nhật thời gian
            self.updated_at = datetime.datetime.now()
            
            # Lưu thay đổi vào database
            self.save()
            
            logger.info(f"Successfully switched to version {version_number} for message {message_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error switching message version: {e}")
            return False

    def get_message_by_id(self, message_id):
        """Lấy tin nhắn theo ID và convert ObjectId thành string"""
        for message in self.messages:
            if str(message["_id"]) == str(message_id):
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

    @classmethod
    def find_by_id(cls, conversation_id):
        """Tìm cuộc hội thoại theo ID"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            if isinstance(conversation_id, str):
                conversation_id = ObjectId(conversation_id)
                
            conversation_dict = conversations_collection.find_one({"_id": conversation_id})
            
            if conversation_dict:
                return cls.from_dict(conversation_dict)
            return None
        except Exception as e:
            logger.error(f"Lỗi khi tìm cuộc hội thoại: {e}")
            return None

    @classmethod
    def find_by_user(cls, user_id, limit=50, skip=0, include_archived=False):
        """Tìm cuộc hội thoại theo user_id với sorting và logging tốt hơn"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Convert user_id to ObjectId if it's string
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            query_filter = {"user_id": user_id}
            if not include_archived:
                query_filter["is_archived"] = {"$ne": True}
            
            logger.info(f"Querying conversations with filter: {query_filter}, limit: {limit}, skip: {skip}")
            
            # Đảm bảo sorting theo updated_at DESC để lấy conversations mới nhất
            conversations_cursor = conversations_collection.find(query_filter)\
                .sort("updated_at", DESCENDING)\
                .skip(skip)\
                .limit(limit)
            
            # Convert cursor to list và log
            conversations_list = list(conversations_cursor)
            logger.info(f"Found {len(conversations_list)} conversations for user {user_id}")
            
            # Convert to Conversation objects
            result = []
            for conv_dict in conversations_list:
                conv_obj = cls.from_dict(conv_dict)
                if conv_obj:
                    result.append(conv_obj)
                    logger.debug(f"   - {conv_obj.title} (ID: {conv_obj.conversation_id}, Updated: {conv_obj.updated_at})")
            
            logger.info(f"Returning {len(result)} conversation objects")
            return result
            
        except Exception as e:
            logger.error(f"Error finding conversations by user: {e}")
            return []

    @classmethod
    def count_by_user(cls, user_id, include_archived=False):
        """Đếm số cuộc hội thoại của user với logging"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            # Convert user_id to ObjectId if it's string
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            query_filter = {"user_id": user_id}
            if not include_archived:
                query_filter["is_archived"] = {"$ne": True}
                
            count = conversations_collection.count_documents(query_filter)
            logger.info(f"User {user_id} has {count} conversations (include_archived: {include_archived})")
            
            return count
        except Exception as e:
            logger.error(f"Error counting conversations: {e}")
            return 0