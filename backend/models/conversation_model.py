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
                logger.info(f"Đã tạo cuộc hội thoại mới với ID: {self.conversation_id}")
                return self.conversation_id
            else:
                # Cập nhật cuộc hội thoại đã tồn tại
                conversations_collection.update_one(
                    {"_id": self.conversation_id}, 
                    {"$set": save_dict}
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
        
        return message["_id"]

    def create_conversation_snapshot(self, from_index=0):
        """Tạo snapshot đầy đủ của conversation từ vị trí chỉ định"""
        try:
            snapshot = []
            for i in range(from_index, len(self.messages)):
                msg = self.messages[i]
                
                safe_msg = {
                    "role": msg["role"],
                    "content": msg["content"],
                    "timestamp": safe_datetime(msg.get("timestamp")),
                    "current_version": msg.get("current_version", 1),
                    "is_edited": msg.get("is_edited", False)
                }
                
                # ✅ LƯU ĐẦY ĐỦ VERSIONS STRUCTURE
                if "versions" in msg and msg["versions"]:
                    safe_msg["versions"] = []
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
                        safe_msg["versions"].append(version_data)
                else:
                    # Tạo version mặc định nếu không có
                    safe_msg["versions"] = [{
                        "content": msg["content"],
                        "timestamp": safe_datetime(msg.get("timestamp")),
                        "version": 1
                    }]
                
                if "sources" in msg:
                    safe_msg["sources"] = msg["sources"]
                
                if "metadata" in msg:
                    safe_msg["metadata"] = msg["metadata"]
                
                snapshot.append(safe_msg)
            
            return snapshot
        except Exception as e:
            logger.error(f"Lỗi tạo conversation snapshot: {e}")
            return []

    def edit_message(self, message_id, new_content):
        """Chỉnh sửa tin nhắn và xóa tất cả tin nhắn sau nó, tạo version mới với safe snapshot"""
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
            
            # ✅ Tạo snapshot của conversation từ vị trí edit trở đi
            conversation_snapshot = self.create_conversation_snapshot(message_index)
            
            # Tạo version mới cho tin nhắn được edit
            new_version = len(message.get("versions", [])) + 1
            new_version_data = {
                "content": new_content,
                "timestamp": timestamp,
                "version": new_version,
                "conversation_snapshot": conversation_snapshot
            }
            
            # Cập nhật tin nhắn với version mới
            if "versions" not in message:
                # Tạo version 1 với snapshot của conversation hiện tại
                original_snapshot = self.create_conversation_snapshot(message_index)
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime(message.get("timestamp", timestamp)),
                    "version": 1,
                    "conversation_snapshot": original_snapshot
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
            
            logger.info(f"✅ Đã chỉnh sửa tin nhắn {message_id} và lưu snapshot")
            
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
            
            # Đảm bảo chỉ có tin nhắn user (do edit_message đã xóa tin nhắn sau)
            if user_message_index != len(self.messages) - 1:
                logger.warning(f"Tin nhắn user không phải là tin nhắn cuối: {user_message_index}")
            
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
            
            logger.info(f"✅ Đã thêm phản hồi bot mới cho tin nhắn user {user_message_id}")
            
            return True, "Đã tạo phản hồi mới"
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo phản hồi mới: {e}")
            return False, f"Lỗi: {str(e)}"

    def regenerate_response(self, message_id, new_response, sources=None):
        """✅ SỬA: Tạo version mới cho phản hồi bot với conversation snapshot"""
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
            
            # ✅ TẠO SNAPSHOT TRƯỚC KHI REGENERATE (quan trọng!)
            conversation_snapshot = self.create_conversation_snapshot(message_index)
            
            # Tạo version mới
            new_version = len(message.get("versions", [])) + 1
            new_version_data = {
                "content": new_response,
                "timestamp": timestamp,
                "version": new_version,
                "conversation_snapshot": conversation_snapshot  # ✅ LƯU SNAPSHOT
            }
            
            if sources:
                new_version_data["sources"] = sources
            
            # Khởi tạo versions nếu chưa có
            if "versions" not in message:
                # ✅ TẠO VERSION 1 VỚI SNAPSHOT GỐC
                original_snapshot = self.create_conversation_snapshot(message_index)
                message["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime(message.get("timestamp", timestamp)),
                    "version": 1,
                    "sources": message.get("sources", []),
                    "conversation_snapshot": original_snapshot  # ✅ LƯU SNAPSHOT CHO VERSION 1
                }]
            
            # Thêm version mới
            message["versions"].append(new_version_data)
            message["current_version"] = new_version
            message["content"] = new_response
            message["is_edited"] = True
            
            if sources:
                message["sources"] = sources
            
            # ✅ XÓA TẤT CẢ TIN NHẮN SAU REGENERATE MESSAGE
            self.messages = self.messages[:message_index + 1]
            
            # Cập nhật thời gian của cuộc hội thoại
            self.updated_at = timestamp
            
            # Lưu thay đổi vào database
            self.save()
            
            logger.info(f"✅ Đã regenerate response cho tin nhắn {message_id}, version {new_version} với snapshot")
            
            return True, "Đã tạo phản hồi mới thành công"
            
        except Exception as e:
            logger.error(f"Lỗi khi regenerate response: {e}")
            return False, f"Lỗi: {str(e)}"

    def switch_message_version(self, message_id, version_number):
        """✅ SỬA: Chuyển đổi version của tin nhắn và restore conversation context từ snapshot"""
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
            if version_number > len(message.get("versions", [])) or version_number < 1:
                return False, "Version không tồn tại"
            
            # Switch version của tin nhắn
            selected_version = message["versions"][version_number - 1]
            message["current_version"] = version_number
            message["content"] = selected_version["content"]
            
            # Cập nhật sources và metadata nếu có
            if "sources" in selected_version:
                message["sources"] = selected_version["sources"]
            else:
                # Xóa sources nếu version này không có
                if "sources" in message:
                    del message["sources"]
                    
            if "metadata" in selected_version:
                message["metadata"] = selected_version["metadata"]
            else:
                # Xóa metadata nếu version này không có
                if "metadata" in message:
                    del message["metadata"]
            
            # ✅ RESTORE CONVERSATION SNAPSHOT CHO CẢ USER VÀ BOT MESSAGES
            if "conversation_snapshot" in selected_version:
                snapshot = selected_version["conversation_snapshot"]
                
                # Xóa tất cả tin nhắn sau message hiện tại
                self.messages = self.messages[:message_index + 1]
                
                # Restore toàn bộ snapshot từ vị trí hiện tại
                if len(snapshot) > 1:
                    # Bỏ qua tin nhắn đầu tiên trong snapshot (vì đã có rồi)
                    restored_messages = snapshot[1:]
                    
                    for restored_msg in restored_messages:
                        # ✅ KHÔI PHỤC ĐẦY ĐỦ MESSAGE VỚI VERSIONS
                        new_message = {
                            "_id": ObjectId(),
                            "role": restored_msg["role"],
                            "content": restored_msg["content"],  # Content hiện tại của message
                            "timestamp": safe_datetime(restored_msg.get("timestamp")),
                            "current_version": restored_msg.get("current_version", 1),
                            "is_edited": restored_msg.get("is_edited", False)
                        }
                        
                        # ✅ KHÔI PHỤC TOÀN BỘ VERSIONS STRUCTURE
                        if "versions" in restored_msg and restored_msg["versions"]:
                            new_message["versions"] = []
                            for version in restored_msg["versions"]:
                                version_data = {
                                    "content": version["content"],
                                    "timestamp": safe_datetime(version.get("timestamp")),
                                    "version": version["version"]
                                }
                                if "sources" in version:
                                    version_data["sources"] = version["sources"]
                                if "metadata" in version:
                                    version_data["metadata"] = version["metadata"]
                                # ✅ KHÔI PHỤC CẢ CONVERSATION_SNAPSHOT NẾU CÓ
                                if "conversation_snapshot" in version:
                                    version_data["conversation_snapshot"] = version["conversation_snapshot"]
                                new_message["versions"].append(version_data)
                        else:
                            # Tạo version mặc định
                            new_message["versions"] = [{
                                "content": restored_msg["content"],
                                "timestamp": safe_datetime(restored_msg.get("timestamp")),
                                "version": 1
                            }]
                        
                        # ✅ KHÔI PHỤC SOURCES VÀ METADATA CHO MESSAGE HIỆN TẠI
                        if "sources" in restored_msg:
                            new_message["sources"] = restored_msg["sources"]
                        
                        if "metadata" in restored_msg:
                            new_message["metadata"] = restored_msg["metadata"]
                        
                        self.messages.append(new_message)
                    
                    logger.info(f"✅ Đã restore {len(restored_messages)} tin nhắn với đầy đủ versions từ snapshot version {version_number}")
            
            # Cập nhật thời gian
            self.updated_at = datetime.datetime.now()
            
            # Lưu thay đổi vào database
            self.save()
            
            logger.info(f"✅ Đã chuyển đổi version {version_number} cho message {message_id}")
            
            return True, "Đã chuyển đổi version và restore conversation thành công"
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi chuyển đổi version tin nhắn: {e}")
            return False, f"Lỗi khi chuyển đổi version: {str(e)}"

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
    def find_by_user(cls, user_id, limit=10, skip=0, include_archived=False):
        """Tìm cuộc hội thoại theo user_id"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            query_filter = {"user_id": user_id}
            if not include_archived:
                query_filter["is_archived"] = {"$ne": True}
            
            conversations = conversations_collection.find(query_filter)\
                .sort("updated_at", DESCENDING)\
                .skip(skip)\
                .limit(limit)
            
            return [cls.from_dict(conv) for conv in conversations]
        except Exception as e:
            logger.error(f"Lỗi khi tìm cuộc hội thoại theo user: {e}")
            return []

    @classmethod
    def count_by_user(cls, user_id, include_archived=False):
        """Đếm số cuộc hội thoại của user"""
        try:
            db = get_db()
            conversations_collection = db.conversations
            
            query_filter = {"user_id": user_id}
            if not include_archived:
                query_filter["is_archived"] = {"$ne": True}
                
            return conversations_collection.count_documents(query_filter)
        except Exception as e:
            logger.error(f"Lỗi khi đếm cuộc hội thoại: {e}")
            return 0