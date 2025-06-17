import os
import datetime
from bson.objectid import ObjectId
import logging
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv
import copy

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
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            conversation = cls(
                user_id=user_id,
                title=title,
                age_context=age_context
            )
            
            conversation_id = conversation.save()
            conversation.conversation_id = conversation_id
            
            logger.info(f"Created new conversation: {conversation_id}")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise

    def serialize_message_for_following(self, message):
        """Serialize message để lưu vào following_messages"""
        serialized = {
            "role": message["role"],
            "content": message["content"],
            "timestamp": safe_datetime(message.get("timestamp")),
            "current_version": message.get("current_version", 1),
            "is_edited": message.get("is_edited", False)
        }
        
        if "sources" in message:
            serialized["sources"] = message["sources"]
        if "metadata" in message:
            serialized["metadata"] = message["metadata"]
        
        # Serialize versions
        if "versions" in message and message["versions"]:
            serialized["versions"] = []
            for version in message["versions"]:
                version_data = {
                    "version": version["version"],
                    "content": version["content"],
                    "timestamp": safe_datetime(version.get("timestamp")),
                    "following_messages": version.get("following_messages", [])
                }
                if "sources" in version:
                    version_data["sources"] = version["sources"]
                if "metadata" in version:
                    version_data["metadata"] = version["metadata"]
                serialized["versions"].append(version_data)
        
        return serialized

    def deserialize_message_from_following(self, serialized_message):
        """Deserialize message từ following_messages"""
        message = {
            "_id": ObjectId(),
            "role": serialized_message["role"],
            "content": serialized_message["content"],
            "timestamp": safe_datetime(serialized_message.get("timestamp")),
            "current_version": serialized_message.get("current_version", 1),
            "is_edited": serialized_message.get("is_edited", False)
        }
        
        if "sources" in serialized_message:
            message["sources"] = serialized_message["sources"]
        if "metadata" in serialized_message:
            message["metadata"] = serialized_message["metadata"]
        
        # Deserialize versions
        if "versions" in serialized_message and serialized_message["versions"]:
            message["versions"] = []
            for version_data in serialized_message["versions"]:
                version = {
                    "version": version_data["version"],
                    "content": version_data["content"],
                    "timestamp": safe_datetime(version_data.get("timestamp")),
                    "following_messages": version_data.get("following_messages", [])
                }
                if "sources" in version_data:
                    version["sources"] = version_data["sources"]
                if "metadata" in version_data:
                    version["metadata"] = version_data["metadata"]
                message["versions"].append(version)
        else:
            # Tạo version mặc định
            message["versions"] = [{
                "version": 1,
                "content": message["content"],
                "timestamp": message["timestamp"],
                "following_messages": []
            }]
            if "sources" in message:
                message["versions"][0]["sources"] = message["sources"]
            if "metadata" in message:
                message["versions"][0]["metadata"] = message["metadata"]
        
        return message

    def capture_following_messages(self, from_message_index):
        """Capture tất cả messages sau from_message_index"""
        following_messages = []
        
        for i in range(from_message_index + 1, len(self.messages)):
            message = self.messages[i]
            serialized = self.serialize_message_for_following(message)
            following_messages.append(serialized)
        
        logger.info(f"Captured {len(following_messages)} following messages from index {from_message_index}")
        return following_messages

    def restore_following_messages(self, target_message_index, following_messages):
        """Restore following messages sau target_message_index"""
        # Cắt conversation tại target message
        self.messages = self.messages[:target_message_index + 1]
        
        # Restore messages
        restored_count = 0
        for serialized_message in following_messages:
            message = self.deserialize_message_from_following(serialized_message)
            self.messages.append(message)
            restored_count += 1
        
        logger.info(f"Restored {restored_count} following messages after index {target_message_index}")
        return restored_count

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
                
                if "versions" in message and message["versions"]:
                    message_data["versions"] = []
                    for version in message["versions"]:
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
            
            self.updated_at = datetime.datetime.now()
            
            save_dict = {
                "user_id": self.user_id,
                "title": self.title,
                "age_context": self.age_context,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
                "is_archived": self.is_archived,
                "messages": []
            }
            
            for message in self.messages:
                message_copy = message.copy()
                message_copy["timestamp"] = safe_datetime(message_copy.get("timestamp"))
                
                if "versions" in message_copy:
                    for version in message_copy["versions"]:
                        version["timestamp"] = safe_datetime(version.get("timestamp"))
                
                save_dict["messages"].append(message_copy)
            
            if not self.conversation_id:
                insert_result = conversations_collection.insert_one(save_dict)
                self.conversation_id = insert_result.inserted_id
                logger.info(f"Saved new conversation with ID: {self.conversation_id}")
                return self.conversation_id
            else:
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
        """Thêm tin nhắn mới vào cuộc hội thoại"""
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
                "following_messages": []
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
        self.updated_at = timestamp
        self.save()
        
        logger.info(f"Added message to conversation {self.conversation_id}")
        return message["_id"]

    def edit_message(self, message_id, new_content):
        """Chỉnh sửa tin nhắn và lưu following messages vào version hiện tại"""
        try:
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            message = self.messages[message_index]
            
            if message["role"] != "user":
                return False, "Chỉ có thể chỉnh sửa tin nhắn của người dùng"
            
            timestamp = datetime.datetime.now()
            
            # Capture following messages cho version hiện tại
            following_messages = self.capture_following_messages(message_index)
            
            # Khởi tạo versions nếu chưa có
            if "versions" not in message:
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime(message.get("timestamp", timestamp)),
                    "version": 1,
                    "following_messages": following_messages
                }]
                if "sources" in message:
                    message["versions"][0]["sources"] = message["sources"]
                if "metadata" in message:
                    message["versions"][0]["metadata"] = message["metadata"]
            else:
                # Cập nhật following_messages cho version hiện tại
                current_version_index = message.get("current_version", 1) - 1
                if current_version_index < len(message["versions"]):
                    message["versions"][current_version_index]["following_messages"] = following_messages
            
            # Tạo version mới
            new_version = len(message["versions"]) + 1
            new_version_data = {
                "content": new_content,
                "timestamp": timestamp,
                "version": new_version,
                "following_messages": []
            }
            
            message["versions"].append(new_version_data)
            message["current_version"] = new_version
            message["content"] = new_content
            message["is_edited"] = True
            
            # Xóa tất cả messages sau message được edit
            self.messages = self.messages[:message_index + 1]
            
            self.updated_at = timestamp
            self.save()
            
            logger.info(f"Edited message {message_id}, created version {new_version} with {len(following_messages)} following messages")
            return True, "Đã chỉnh sửa tin nhắn thành công"
            
        except Exception as e:
            logger.error(f"Error editing message: {e}")
            return False, f"Lỗi: {str(e)}"

    def regenerate_bot_response_after_edit(self, user_message_id, new_response, sources=None):
        """Thêm phản hồi bot mới sau khi edit tin nhắn user"""
        try:
            user_message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(user_message_id):
                    user_message_index = i
                    break
            
            if user_message_index is None:
                return False, "Không tìm thấy tin nhắn user"
            
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
            
            self.messages.append(bot_message)
            
            # Cập nhật following_messages cho version hiện tại của user message
            user_message = self.messages[user_message_index]
            if "versions" in user_message:
                current_version_index = user_message.get("current_version", 1) - 1
                if current_version_index < len(user_message["versions"]):
                    # Capture lại following messages bao gồm bot response mới
                    following_messages = self.capture_following_messages(user_message_index)
                    user_message["versions"][current_version_index]["following_messages"] = following_messages
            
            self.updated_at = timestamp
            self.save()
            
            logger.info(f"Added bot response after edit for user message {user_message_id}")
            return True, "Đã tạo phản hồi mới"
            
        except Exception as e:
            logger.error(f"Error adding bot response: {e}")
            return False, f"Lỗi: {str(e)}"

    def regenerate_response(self, message_id, new_response, sources=None):
        """Tạo version mới cho phản hồi bot"""
        try:
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            message = self.messages[message_index]
            
            if message["role"] != "bot":
                return False, "Chỉ có thể regenerate phản hồi của bot"
            
            timestamp = datetime.datetime.now()
            
            # Capture following messages cho version hiện tại
            following_messages = self.capture_following_messages(message_index)
            
            # Khởi tạo versions nếu chưa có
            if "versions" not in message:
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime(message.get("timestamp", timestamp)),
                    "version": 1,
                    "sources": message.get("sources", []),
                    "following_messages": following_messages
                }]
                if "metadata" in message:
                    message["versions"][0]["metadata"] = message["metadata"]
            else:
                # Cập nhật following_messages cho version hiện tại
                current_version_index = message.get("current_version", 1) - 1
                if current_version_index < len(message["versions"]):
                    message["versions"][current_version_index]["following_messages"] = following_messages
            
            # Tạo version mới
            new_version = len(message["versions"]) + 1
            new_version_data = {
                "content": new_response,
                "timestamp": timestamp,
                "version": new_version,
                "following_messages": []
            }
            
            if sources:
                new_version_data["sources"] = sources
            
            message["versions"].append(new_version_data)
            message["current_version"] = new_version
            message["content"] = new_response
            message["is_edited"] = True
            
            if sources:
                message["sources"] = sources
            
            # Xóa tất cả messages sau regenerate message
            self.messages = self.messages[:message_index + 1]
            
            self.updated_at = datetime.datetime.now()
            self.save()
            
            logger.info(f"Regenerated response for message {message_id}, version {new_version} with {len(following_messages)} following messages")
            return True, "Đã tạo phản hồi mới thành công"
            
        except Exception as e:
            logger.error(f"Error regenerating response: {e}")
            return False, f"Lỗi: {str(e)}"

    def switch_message_version(self, message_id, version_number):
        """Chuyển đổi version của tin nhắn và restore following messages"""
        try:
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                logger.error(f"Message not found: {message_id}")
                return False
            
            message = self.messages[message_index]
            
            if not message.get("versions") or version_number > len(message["versions"]) or version_number < 1:
                logger.error(f"Version {version_number} not found for message {message_id}")
                return False
            
            current_version = message.get("current_version", 1)
            logger.info(f"Switching message {message_id} from version {current_version} to version {version_number}")
            
            selected_version = message["versions"][version_number - 1]
            
            # Update message content to selected version
            message["current_version"] = version_number
            message["content"] = selected_version["content"]
            
            # Update sources and metadata
            if "sources" in selected_version:
                message["sources"] = selected_version["sources"]
            elif "sources" in message:
                del message["sources"]
                    
            if "metadata" in selected_version:
                message["metadata"] = selected_version["metadata"]
            elif "metadata" in message:
                del message["metadata"]
            
            # Restore following messages từ version được chọn
            following_messages = selected_version.get("following_messages", [])
            if following_messages:
                restored_count = self.restore_following_messages(message_index, following_messages)
                logger.info(f"Restored {restored_count} following messages from version {version_number}")
            else:
                # Nếu không có following messages, chỉ cắt conversation tại message này
                self.messages = self.messages[:message_index + 1]
                logger.info(f"No following messages in version {version_number}, truncated conversation at message index {message_index}")
            
            self.updated_at = datetime.datetime.now()
            self.save()
            
            logger.info(f"Successfully switched to version {version_number} for message {message_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error switching message version: {e}")
            return False

    def delete_message_and_following(self, message_id):
        """Xóa tin nhắn và tất cả tin nhắn sau nó"""
        try:
            message_index = None
            for i, message in enumerate(self.messages):
                if str(message["_id"]) == str(message_id):
                    message_index = i
                    break
            
            if message_index is None:
                return False, "Không tìm thấy tin nhắn"
            
            self.messages = self.messages[:message_index]
            self.updated_at = datetime.datetime.now()
            self.save()
            
            return True, "Đã xóa tin nhắn và các tin nhắn sau nó"
            
        except Exception as e:
            logger.error(f"Error deleting message: {e}")
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
        """Tìm cuộc hội thoại theo user_id"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            query_filter = {"user_id": user_id}
            if not include_archived:
                query_filter["is_archived"] = {"$ne": True}
            
            logger.info(f"Querying conversations with filter: {query_filter}, limit: {limit}, skip: {skip}")
            
            conversations_cursor = conversations_collection.find(query_filter)\
                .sort("updated_at", DESCENDING)\
                .skip(skip)\
                .limit(limit)
            
            conversations_list = list(conversations_cursor)
            logger.info(f"Found {len(conversations_list)} conversations for user {user_id}")
            
            result = []
            for conv_dict in conversations_list:
                conv_obj = cls.from_dict(conv_dict)
                if conv_obj:
                    result.append(conv_obj)
            
            logger.info(f"Returning {len(result)} conversation objects")
            return result
            
        except Exception as e:
            logger.error(f"Error finding conversations by user: {e}")
            return []

    @classmethod
    def count_by_user(cls, user_id, include_archived=False):
        """Đếm số cuộc hội thoại của user"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
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