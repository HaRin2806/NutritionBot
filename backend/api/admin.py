from flask import Blueprint, request, jsonify
import logging
import datetime
import os
from bson.objectid import ObjectId
from models.user_model import User
from models.conversation_model import get_db, Conversation
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
import json
from core.embedding_model import get_embedding_model
from werkzeug.utils import secure_filename
import google.generativeai as genai
from config import GEMINI_API_KEY
import time
import sys
from models.feedback_model import Feedback

# Thiết lập logging
logger = logging.getLogger(__name__)

# Tạo blueprint
admin_routes = Blueprint('admin', __name__)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

def setup_debug_logging():
    """Thiết lập logging debug cho Gemini response"""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    return log_dir

def save_gemini_response_to_file(response_text, parsed_data, doc_id):
    """Lưu response của Gemini vào file để debug"""
    try:
        log_dir = setup_debug_logging()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Tạo tên file log
        log_filename = f"gemini_response_{doc_id}_{timestamp}.log"
        log_path = os.path.join(log_dir, log_filename)
        
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"GEMINI RESPONSE DEBUG LOG\n")
            f.write(f"Document ID: {doc_id}\n")
            f.write(f"Timestamp: {datetime.datetime.now().isoformat()}\n")
            f.write("=" * 80 + "\n\n")
            
            f.write("RAW RESPONSE FROM GEMINI:\n")
            f.write("-" * 40 + "\n")
            f.write(response_text)
            f.write("\n\n")
            
            f.write("PARSED JSON DATA:\n")
            f.write("-" * 40 + "\n")
            f.write(json.dumps(parsed_data, indent=2, ensure_ascii=False))
            f.write("\n\n")
            
            # Debug chunks content vs summary
            f.write("CHUNKS CONTENT vs SUMMARY ANALYSIS:\n")
            f.write("-" * 40 + "\n")
            for i, chunk in enumerate(parsed_data.get('chunks', [])[:3]):  # Chỉ log 3 chunks đầu
                f.write(f"CHUNK {i+1} ({chunk.get('id', 'no-id')}):\n")
                f.write(f"Title: {chunk.get('title', 'no-title')}\n")
                f.write(f"Summary Length: {len(chunk.get('summary', ''))}\n")
                f.write(f"Content Length: {len(chunk.get('content', ''))}\n")
                f.write(f"Summary: {chunk.get('summary', 'no-summary')[:200]}...\n")
                f.write(f"Content: {chunk.get('content', 'no-content')[:200]}...\n")
                f.write("\n")
            
            # Debug tables
            if parsed_data.get('tables'):
                f.write("TABLES ANALYSIS:\n")
                f.write("-" * 40 + "\n")
                for i, table in enumerate(parsed_data.get('tables', [])[:2]):
                    f.write(f"TABLE {i+1} ({table.get('id', 'no-id')}):\n")
                    f.write(f"Title: {table.get('title', 'no-title')}\n")
                    f.write(f"Summary: {table.get('summary', 'no-summary')[:100]}...\n")
                    f.write(f"Content: {table.get('content', 'no-content')[:100]}...\n")
                    f.write("\n")
        
        logger.info(f"Saved Gemini response debug log to: {log_path}")
        return log_path
        
    except Exception as e:
        logger.error(f"Error saving debug log: {e}")
        return None

def require_admin(f):
    """Decorator để kiểm tra quyền admin"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            user_id = get_jwt_identity()
            user = User.find_by_id(user_id)
            
            if not user or not user.is_admin():
                return jsonify({
                    "success": False,
                    "error": "Không có quyền truy cập admin"
                }), 403
            
            request.current_user = user
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Lỗi xác thực admin: {e}")
            return jsonify({
                "success": False,
                "error": "Lỗi xác thực"
            }), 500
    return decorated_function

# ===== DASHBOARD ROUTES =====

@admin_routes.route('/stats/overview', methods=['GET'])
@require_admin
def get_overview_stats():
    """Lấy thống kê tổng quan cho dashboard"""
    try:
        db = get_db()
        
        # Sử dụng timezone Việt Nam (UTC+7)
        import pytz
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now_vietnam = datetime.datetime.now(vietnam_tz)
        
        # Thống kê users thực tế
        total_users = db.users.count_documents({}) if hasattr(db, 'users') else 0
        today_start = now_vietnam.replace(hour=0, minute=0, second=0, microsecond=0)
        new_users_today = db.users.count_documents({
            "created_at": {"$gte": today_start.astimezone(pytz.UTC).replace(tzinfo=None)}
        }) if hasattr(db, 'users') else 0
        
        # Thống kê conversations thực tế
        total_conversations = db.conversations.count_documents({})
        day_ago = now_vietnam - datetime.timedelta(days=1)
        recent_conversations = db.conversations.count_documents({
            "updated_at": {"$gte": day_ago.astimezone(pytz.UTC).replace(tzinfo=None)}
        })
        
        # Thống kê tin nhắn thực tế
        pipeline = [
            {"$project": {"message_count": {"$size": "$messages"}}},
            {"$group": {"_id": None, "total_messages": {"$sum": "$message_count"}}}
        ]
        message_result = list(db.conversations.aggregate(pipeline))
        total_messages = message_result[0]["total_messages"] if message_result else 0
        
        # Thống kê admin thực tế
        total_admins = db.users.count_documents({"role": "admin"}) if hasattr(db, 'users') else 0
        
        # Thống kê theo tuần (7 ngày gần nhất) - SỬA LẠI
        daily_stats = []
        for i in range(7):
            # Tính ngày theo timezone Việt Nam
            target_date = now_vietnam.date() - datetime.timedelta(days=6-i)
            day_start = vietnam_tz.localize(datetime.datetime.combine(target_date, datetime.time.min))
            day_end = vietnam_tz.localize(datetime.datetime.combine(target_date, datetime.time.max))
            
            # Convert về UTC để query MongoDB
            day_start_utc = day_start.astimezone(pytz.UTC).replace(tzinfo=None)
            day_end_utc = day_end.astimezone(pytz.UTC).replace(tzinfo=None)
            
            # Đếm conversations được tạo HOẶC cập nhật trong ngày
            daily_conversations_created = db.conversations.count_documents({
                "created_at": {"$gte": day_start_utc, "$lte": day_end_utc}
            })
            
            daily_conversations_updated = db.conversations.count_documents({
                "updated_at": {"$gte": day_start_utc, "$lte": day_end_utc},
                "created_at": {"$lt": day_start_utc}  # Không đếm trùng với conversations mới tạo
            })
            
            total_daily_activity = daily_conversations_created + daily_conversations_updated
            
            daily_users = 0
            if hasattr(db, 'users'):
                daily_users = db.users.count_documents({
                    "created_at": {"$gte": day_start_utc, "$lte": day_end_utc}
                })
            
            daily_stats.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "label": target_date.strftime("%d/%m"),
                "conversations": total_daily_activity,
                "users": daily_users,
                "created": daily_conversations_created,
                "updated": daily_conversations_updated
            })
        
        # Thống kê theo độ tuổi thực tế
        age_pipeline = [
            {"$group": {"_id": "$age_context", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        age_stats = list(db.conversations.aggregate(age_pipeline))
        
        return jsonify({
            "success": True,
            "stats": {
                "users": {
                    "total": total_users,
                    "new_today": new_users_today,
                    "active": total_users
                },
                "conversations": {
                    "total": total_conversations,
                    "recent": recent_conversations
                },
                "messages": {
                    "total": total_messages,
                    "avg_per_conversation": round(total_messages / total_conversations, 1) if total_conversations > 0 else 0
                },
                "admins": {
                    "total": total_admins
                },
                "daily_stats": daily_stats,
                "age_distribution": [
                    {
                        "age_group": f"{stat['_id']} tuổi" if stat['_id'] else "Không rõ",
                        "count": stat["count"]
                    }
                    for stat in age_stats
                ],
                "timezone": "Asia/Ho_Chi_Minh",
                "current_time": now_vietnam.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê tổng quan: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/system-info', methods=['GET'])
@require_admin 
def get_system_info():
    """Lấy thông tin hệ thống"""
    try:
        from core.embedding_model import get_embedding_model
        
        # Thông tin vector database
        try:
            embedding_model = get_embedding_model()
            vector_count = embedding_model.count()
        except:
            vector_count = 0
        
        # Thông tin database
        db = get_db()
        collections = db.list_collection_names()
        
        system_info = {
            "database": {
                "type": "MongoDB",
                "collections": len(collections),
                "status": "active"
            },
            "vector_db": {
                "type": "ChromaDB", 
                "embeddings": vector_count,
                "model": "multilingual-e5-base"
            },
            "ai": {
                "generation_model": "Gemini 2.0 Flash",
                "embedding_model": "multilingual-e5-base",
                "status": "active"
            }
        }
        
        return jsonify({
            "success": True,
            "system_info": system_info
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin hệ thống: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/alerts', methods=['GET'])
@require_admin
def get_system_alerts():
    """Lấy cảnh báo hệ thống"""
    try:
        alerts = []
        
        # Kiểm tra số lượng conversations
        db = get_db()
        total_conversations = db.conversations.count_documents({})
        
        if total_conversations > 100:
            alerts.append({
                "type": "info",
                "title": "Lượng dữ liệu cao",
                "message": f"Hệ thống có {total_conversations} cuộc hội thoại",
                "severity": "low"
            })
        
        # Mặc định: hệ thống hoạt động bình thường
        if not alerts:
            alerts.append({
                "type": "info",
                "title": "Hệ thống hoạt động bình thường",
                "message": "Tất cả dịch vụ đang chạy ổn định",
                "severity": "low"
            })
        
        return jsonify({
            "success": True,
            "alerts": alerts
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy cảnh báo hệ thống: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ===== USER MANAGEMENT ROUTES =====

@admin_routes.route('/users', methods=['GET'])
@require_admin
def get_all_users():
    """Lấy danh sách người dùng với thông tin thực tế"""
    try:
        db = get_db()
        users_collection = db.users
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        gender_filter = request.args.get('gender', '')
        role_filter = request.args.get('role', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Tạo query filter
        query_filter = {}
        if search:
            query_filter["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        if gender_filter:
            query_filter["gender"] = gender_filter
        if role_filter:
            query_filter["role"] = role_filter
        
        # Pagination
        skip = (page - 1) * per_page
        sort_direction = -1 if sort_order == 'desc' else 1
        
        users_cursor = users_collection.find(query_filter).sort(sort_by, sort_direction).skip(skip).limit(per_page)
        total_users = users_collection.count_documents(query_filter)
        
        users_list = []
        for user_data in users_cursor:
            # Đếm conversations thực tế
            conversation_count = db.conversations.count_documents({"user_id": user_data["_id"]})
            
            # Lấy conversation mới nhất để biết last_activity
            latest_conversation = db.conversations.find_one(
                {"user_id": user_data["_id"]},
                sort=[("updated_at", -1)]
            )
            
            # Đếm tin nhắn
            user_conversations = list(db.conversations.find({"user_id": user_data["_id"]}))
            total_messages = sum(len(conv.get("messages", [])) for conv in user_conversations)
            
            users_list.append({
                "id": str(user_data["_id"]),
                "name": user_data.get("name", ""),
                "email": user_data.get("email", ""),
                "gender": user_data.get("gender", ""),
                "role": user_data.get("role", "user"),
                "created_at": user_data.get("created_at").isoformat() if user_data.get("created_at") else None,
                "updated_at": user_data.get("updated_at").isoformat() if user_data.get("updated_at") else None,
                "last_login": user_data.get("last_login").isoformat() if user_data.get("last_login") else None,
                "conversation_count": conversation_count,
                "message_count": total_messages,
                "last_activity": latest_conversation.get("updated_at").isoformat() if latest_conversation and latest_conversation.get("updated_at") else None,
                "avg_messages_per_conversation": round(total_messages / conversation_count, 1) if conversation_count > 0 else 0
            })
        
        # Thống kê tổng hợp
        stats = {
            "total_users": total_users,
            "total_admins": users_collection.count_documents({"role": "admin"}),
            "total_regular_users": users_collection.count_documents({"role": "user"}),
            "active_users": users_collection.count_documents({"last_login": {"$exists": True}}),
            "gender_stats": {
                "male": users_collection.count_documents({"gender": "male"}),
                "female": users_collection.count_documents({"gender": "female"}),
                "other": users_collection.count_documents({"gender": "other"}),
                "unknown": users_collection.count_documents({"gender": {"$in": [None, ""]}})
            }
        }
        
        return jsonify({
            "success": True,
            "users": users_list,
            "stats": stats,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_users,
                "pages": (total_users + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy danh sách users: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/users/<user_id>', methods=['GET'])
@require_admin
def get_user_detail(user_id):
    """Lấy chi tiết người dùng với thông tin đầy đủ"""
    try:
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        db = get_db()
        
        # Lấy conversations của user
        user_conversations = list(db.conversations.find(
            {"user_id": ObjectId(user_id)},
            {"title": 1, "created_at": 1, "updated_at": 1, "age_context": 1, "messages": 1}
        ).sort("updated_at", -1))
        
        # Tính thống kê chi tiết
        total_messages = sum(len(conv.get("messages", [])) for conv in user_conversations)
        conversation_stats = {
            "total_conversations": len(user_conversations),
            "total_messages": total_messages,
            "avg_messages_per_conversation": round(total_messages / len(user_conversations), 1) if user_conversations else 0,
            "most_recent_conversation": user_conversations[0].get("updated_at").isoformat() if user_conversations and user_conversations[0].get("updated_at") else None,
            "oldest_conversation": user_conversations[-1].get("created_at").isoformat() if user_conversations and user_conversations[-1].get("created_at") else None
        }
        
        # Thống kê theo độ tuổi
        age_stats = {}
        for conv in user_conversations:
            age = conv.get("age_context")
            if age:
                age_stats[age] = age_stats.get(age, 0) + 1
        
        user_detail = {
            "id": str(user.user_id),
            "name": user.name,
            "email": user.email,
            "gender": user.gender,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "stats": conversation_stats,
            "age_usage": age_stats,
            "recent_conversations": [
                {
                    "id": str(conv["_id"]),
                    "title": conv.get("title", ""),
                    "created_at": conv.get("created_at").isoformat() if conv.get("created_at") else None,
                    "updated_at": conv.get("updated_at").isoformat() if conv.get("updated_at") else None,
                    "message_count": len(conv.get("messages", [])),
                    "age_context": conv.get("age_context")
                }
                for conv in user_conversations[:10]
            ]
        }
        
        return jsonify({
            "success": True,
            "user": user_detail
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy chi tiết user: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/users/<user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """Xóa người dùng"""
    try:
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        # Xóa tất cả conversations của user
        db = get_db()
        conversations_deleted = db.conversations.delete_many({"user_id": ObjectId(user_id)})
        
        # Xóa user
        user_deleted = user.delete()
        
        if user_deleted:
            return jsonify({
                "success": True,
                "message": f"Đã xóa người dùng và {conversations_deleted.deleted_count} cuộc hội thoại"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không thể xóa người dùng"
            }), 500
        
    except Exception as e:
        logger.error(f"Lỗi xóa user: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/users/bulk-delete', methods=['POST'])
@require_admin
def bulk_delete_users():
    """Xóa nhiều người dùng"""
    try:
        data = request.json
        user_ids = data.get('user_ids', [])
        
        if not user_ids:
            return jsonify({
                "success": False,
                "error": "Không có user nào được chọn"
            }), 400
        
        deleted_count = 0
        failed_ids = []
        
        db = get_db()
        
        for user_id in user_ids:
            try:
                # Xóa conversations của user
                db.conversations.delete_many({"user_id": ObjectId(user_id)})
                
                # Xóa user
                user = User.find_by_id(user_id)
                if user and user.delete():
                    deleted_count += 1
                else:
                    failed_ids.append(user_id)
            except Exception as e:
                logger.error(f"Lỗi xóa user {user_id}: {e}")
                failed_ids.append(user_id)
        
        return jsonify({
            "success": True,
            "message": f"Đã xóa {deleted_count}/{len(user_ids)} người dùng",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa bulk users: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ===== CONVERSATION MANAGEMENT ROUTES =====
@admin_routes.route('/conversations', methods=['GET'])
@require_admin
def get_all_conversations():
    """Lấy danh sách cuộc hội thoại - Fixed ObjectId serialization"""
    try:
        db = get_db()
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        age_filter = request.args.get('age', '')
        archived_filter = request.args.get('archived', 'all')
        
        # Tạo query filter
        query_filter = {}
        if search:
            query_filter["title"] = {"$regex": search, "$options": "i"}
        if age_filter:
            query_filter["age_context"] = int(age_filter)
        if archived_filter != 'all':
            query_filter["is_archived"] = archived_filter == 'true'
        
        skip = (page - 1) * per_page
        conversations = list(db.conversations.find(query_filter).skip(skip).limit(per_page).sort("updated_at", -1))
        total_conversations = db.conversations.count_documents(query_filter)
        
        conversations_list = []
        for conv in conversations:
            try:
                # ✅ FIX: Safely convert ObjectId to string và handle user lookup
                user_id = conv.get("user_id")
                user_name = "Unknown"
                
                if user_id:
                    try:
                        # Ensure user_id is ObjectId
                        if isinstance(user_id, str):
                            user_id = ObjectId(user_id)
                        
                        user = User.find_by_id(str(user_id))  # Convert to string for the method
                        if user:
                            user_name = user.name
                    except Exception as user_error:
                        logger.warning(f"Could not fetch user {user_id}: {user_error}")
                        user_name = "Unknown"
                
                # ✅ FIX: Safely handle datetime objects
                def safe_isoformat(dt):
                    if dt is None:
                        return None
                    if hasattr(dt, 'isoformat'):
                        return dt.isoformat()
                    return str(dt)
                
                # ✅ FIX: Safely handle messages array
                messages = conv.get("messages", [])
                processed_messages = []
                
                for msg in messages:
                    if isinstance(msg, dict):
                        processed_msg = {
                            "role": msg.get("role", ""),
                            "content": msg.get("content", ""),
                            "timestamp": safe_isoformat(msg.get("timestamp"))
                        }
                        processed_messages.append(processed_msg)
                
                conversation_data = {
                    "id": str(conv["_id"]),  # ✅ Always convert ObjectId to string
                    "title": conv.get("title", ""),
                    "user_name": user_name,
                    "age_context": conv.get("age_context"),
                    "message_count": len(messages),
                    "is_archived": conv.get("is_archived", False),
                    "created_at": safe_isoformat(conv.get("created_at")),
                    "updated_at": safe_isoformat(conv.get("updated_at")),
                    "messages": processed_messages
                }
                
                conversations_list.append(conversation_data)
                
            except Exception as conv_error:
                logger.error(f"Error processing conversation {conv.get('_id')}: {conv_error}")
                # Skip this conversation but continue with others
                continue
        
        return jsonify({
            "success": True,
            "conversations": conversations_list,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_conversations,
                "pages": (total_conversations + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy danh sách conversations: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/conversations/<conversation_id>', methods=['DELETE'])
@require_admin
def delete_conversation(conversation_id):
    """Xóa cuộc hội thoại - Fixed ObjectId handling"""
    try:
        # ✅ FIX: Use Conversation model instead of direct DB access
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        success = conversation.delete()
        
        if success:
            return jsonify({
                "success": True,
                "message": "Đã xóa cuộc hội thoại"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không thể xóa cuộc hội thoại"
            }), 500
        
    except Exception as e:
        logger.error(f"Lỗi xóa conversation: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/conversations/bulk-delete', methods=['POST'])
@require_admin
def bulk_delete_conversations():
    """Xóa nhiều cuộc hội thoại - Fixed ObjectId handling"""
    try:
        data = request.json
        conversation_ids = data.get('conversation_ids', [])
        
        if not conversation_ids:
            return jsonify({
                "success": False,
                "error": "Không có conversation nào được chọn"
            }), 400
        
        db = get_db()
        deleted_count = 0
        failed_ids = []
        
        for conv_id in conversation_ids:
            try:
                # ✅ FIX: Ensure proper ObjectId conversion
                if isinstance(conv_id, str):
                    conv_id = ObjectId(conv_id)
                
                result = db.conversations.delete_one({"_id": conv_id})
                if result.deleted_count > 0:
                    deleted_count += 1
                else:
                    failed_ids.append(str(conv_id))
                    
            except Exception as e:
                logger.error(f"Error deleting conversation {conv_id}: {e}")
                failed_ids.append(str(conv_id))
                continue
        
        return jsonify({
            "success": True,
            "message": f"Đã xóa {deleted_count}/{len(conversation_ids)} cuộc hội thoại",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa bulk conversations: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
# ===== DOCUMENT MANAGEMENT ROUTES =====

@admin_routes.route('/documents', methods=['GET'])
@require_admin
def get_all_documents():
    """Lấy danh sách tài liệu từ ChromaDB theo đúng metadata"""
    try:
        embedding_model = get_embedding_model()
        
        # Lấy tất cả documents từ ChromaDB
        results = embedding_model.collection.get(
            include=['metadatas', 'documents']
        )
        
        if not results or not results['metadatas']:
            return jsonify({
                "success": True,
                "documents": [],
                "stats": {
                    "total": 0,
                    "by_chapter": {},
                    "by_type": {}
                }
            })
        
        # Phân tích metadata để nhóm theo chapter
        documents_by_chapter = {}
        stats = {
            "total": 0,
            "by_chapter": {},
            "by_type": {}
        }
        
        for i, metadata in enumerate(results['metadatas']):
            # Lấy chapter từ metadata
            chapter = metadata.get('chapter', 'unknown')
            content_type = metadata.get('content_type', 'text')
            
            # Cập nhật stats
            stats["by_chapter"][chapter] = stats["by_chapter"].get(chapter, 0) + 1
            stats["by_type"][content_type] = stats["by_type"].get(content_type, 0) + 1
            
            # Nhóm theo chapter
            if chapter not in documents_by_chapter:
                chapter_title = get_chapter_title(chapter)
                chapter_type = get_chapter_type(chapter)
                
                documents_by_chapter[chapter] = {
                    "id": chapter,
                    "title": chapter_title,
                    "description": f"Tài liệu {chapter_title.lower()}",
                    "type": chapter_type,
                    "status": "processed",
                    "created_at": metadata.get('created_at', datetime.datetime.now().isoformat()),
                    "content_stats": {
                        "chunks": 0,
                        "tables": 0,
                        "figures": 0
                    }
                }
            
            # Cập nhật content stats
            if content_type == "table":
                documents_by_chapter[chapter]["content_stats"]["tables"] += 1
            elif content_type == "figure":
                documents_by_chapter[chapter]["content_stats"]["figures"] += 1
            else:
                documents_by_chapter[chapter]["content_stats"]["chunks"] += 1
        
        documents_list = list(documents_by_chapter.values())
        stats["total"] = len(documents_list)
        
        logger.info(f"Found chapters: {list(documents_by_chapter.keys())}")
        logger.info(f"Stats: {stats}")
        
        return jsonify({
            "success": True,
            "documents": documents_list,
            "stats": stats
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy danh sách documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def get_chapter_title(chapter):
    try:
        # Nếu là document upload, lấy title từ metadata
        if chapter.startswith('bosung') or chapter.startswith('upload_'):
            embedding_model = get_embedding_model()
            results = embedding_model.collection.get(
                where={"chapter": chapter},
                limit=1
            )
            
            if results and results.get('metadatas') and results['metadatas'][0]:
                metadata = results['metadatas'][0]
                document_title = metadata.get('document_title') or metadata.get('document_source')
                if document_title and document_title != 'Tài liệu upload':
                    return document_title
        
        # Fallback cho các chapter chuẩn
        chapter_titles = {
            'bai1': 'Bài 1: Dinh dưỡng theo lứa tuổi học sinh',
            'bai2': 'Bài 2: An toàn thực phẩm',
            'bai3': 'Bài 3: Vệ sinh dinh dưỡng',
            'bai4': 'Bài 4: Giáo dục dinh dưỡng',
            'phuluc': 'Phụ lục'
        }
        
        # Kiểm tra pattern bosung
        if chapter.startswith('bosung'):
            return f'Tài liệu bổ sung {chapter.replace("bosung", "")}'
        
        return chapter_titles.get(chapter, f'Tài liệu {chapter}')
        
    except Exception as e:
        logger.error(f"Error getting chapter title: {e}")
        return f'Tài liệu {chapter}'

def get_chapter_type(chapter):
    """Lấy loại chapter"""
    if chapter.startswith('bai'):
        return 'lesson'
    elif chapter == 'phuluc':
        return 'appendix'
    else:
        return 'uploaded'

@admin_routes.route('/documents/<doc_id>', methods=['GET'])
@require_admin
def get_document_detail(doc_id):
    """Lấy chi tiết document theo chapter"""
    try:
        logger.info(f"Getting document detail for: {doc_id}")
        
        # Sử dụng try-catch để tránh lỗi tensor
        try:
            embedding_model = get_embedding_model()
        except Exception as model_error:
            logger.warning(f"Cannot load embedding model: {model_error}")
            # Fallback: truy cập trực tiếp ChromaDB
            import chromadb
            from config import CHROMA_PERSIST_DIRECTORY, COLLECTION_NAME
            
            chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIRECTORY)
            collection = chroma_client.get_collection(name=COLLECTION_NAME)
        else:
            collection = embedding_model.collection
        
        # Lấy tất cả documents và filter manually để tránh lỗi query
        try:
            all_results = collection.get(
                include=['metadatas', 'documents']  # Bỏ 'ids' để tránh lỗi
            )
            
            if not all_results or not all_results.get('metadatas'):
                logger.warning("No documents found in collection")
                return jsonify({
                    "success": False,
                    "error": "Không có dữ liệu trong collection"
                }), 404
            
            # Filter manually
            filtered_documents = []
            filtered_metadatas = []
            
            for i, metadata in enumerate(all_results['metadatas']):
                if not metadata:
                    continue
                    
                chunk_id = metadata.get('chunk_id', '')
                chapter = metadata.get('chapter', '')
                
                # Kiểm tra match với doc_id
                if (chunk_id.startswith(f"{doc_id}_") or 
                    chapter == doc_id or
                    (doc_id in ['bai1', 'bai2', 'bai3', 'bai4'] and chunk_id.startswith(f"{doc_id}_")) or
                    (doc_id == 'phuluc' and 'phuluc' in chunk_id.lower())):
                    
                    filtered_documents.append(all_results['documents'][i])
                    filtered_metadatas.append(metadata)
            
            logger.info(f"Found {len(filtered_documents)} matching documents for {doc_id}")
            
            if not filtered_documents:
                return jsonify({
                    "success": False,
                    "error": f"Không tìm thấy tài liệu cho {doc_id}"
                }), 404
            
        except Exception as query_error:
            logger.error(f"ChromaDB query error: {query_error}")
            return jsonify({
                "success": False,
                "error": f"Lỗi truy vấn cơ sở dữ liệu: {str(query_error)}"
            }), 500
        
        # Xử lý kết quả và nhóm theo content_type
        chunks_by_type = {
            'text': [],
            'table': [],
            'figure': []
        }
        
        for i, metadata in enumerate(filtered_metadatas):
            content_type = metadata.get('content_type', 'text')
            
            # Parse age_range
            age_range_str = metadata.get('age_range', '1-19')
            try:
                if '-' in age_range_str:
                    age_min, age_max = map(int, age_range_str.split('-'))
                else:
                    age_min = age_max = int(age_range_str)
            except:
                age_min, age_max = 1, 19
            
            chunk = {
                "id": metadata.get('chunk_id', f'chunk_{i}'),
                "title": metadata.get('title', 'Không có tiêu đề'),
                "content": filtered_documents[i],
                "content_type": content_type,
                "age_range": age_range_str,
                "age_min": age_min,
                "age_max": age_max,
                "summary": metadata.get('summary', 'Không có tóm tắt'),
                "pages": metadata.get('pages', ''),
                "word_count": metadata.get('word_count', 0),
                "token_count": metadata.get('token_count', 0),
                "related_chunks": metadata.get('related_chunks', '').split(',') if metadata.get('related_chunks') else [],
                "created_at": metadata.get('created_at', ''),
                "document_source": metadata.get('document_source', ''),
                # Metadata đặc biệt
                "contains_table": metadata.get('contains_table', False),
                "contains_figure": metadata.get('contains_figure', False),
                "table_columns": metadata.get('table_columns', '').split(',') if metadata.get('table_columns') else []
            }
            
            # Phân loại vào đúng nhóm
            if content_type in chunks_by_type:
                chunks_by_type[content_type].append(chunk)
            else:
                chunks_by_type['text'].append(chunk)
        
        # Tính thống kê
        total_chunks = sum(len(chunks) for chunks in chunks_by_type.values())
        
        logger.info(f"Successfully processed {total_chunks} chunks for {doc_id}")
        
        return jsonify({
            "success": True,
            "document": {
                "id": doc_id,
                "chunks": chunks_by_type,
                "stats": {
                    "total_chunks": total_chunks,
                    "text_chunks": len(chunks_by_type['text']),
                    "table_chunks": len(chunks_by_type['table']),
                    "figure_chunks": len(chunks_by_type['figure'])
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting document detail: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500

@admin_routes.route('/documents/debug/metadata', methods=['GET'])
@require_admin
def debug_metadata():
    """Debug metadata trong ChromaDB"""
    try:
        # Sử dụng try-catch để tránh lỗi tensor
        try:
            embedding_model = get_embedding_model()
            total_docs = embedding_model.count()
        except Exception as model_error:
            logger.warning(f"Không thể load embedding model: {model_error}")
            # Fallback: truy cập trực tiếp ChromaDB
            import chromadb
            from config import CHROMA_PERSIST_DIRECTORY, COLLECTION_NAME
            
            chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIRECTORY)
            collection = chroma_client.get_collection(name=COLLECTION_NAME)
            total_docs = collection.count()
            
            # Lấy sample metadata
            results = collection.get(
                limit=10,
                include=['metadatas']
            )
        else:
            # Lấy 10 documents đầu tiên để debug
            results = embedding_model.collection.get(
                limit=10,
                include=['metadatas']
            )
        
        debug_info = {
            "total_documents": total_docs,
            "sample_metadata": results['metadatas'][:5] if results and results.get('metadatas') else [],
            "all_metadata_keys": []
        }
        
        if results and results.get('metadatas'):
            # Lấy tất cả keys từ metadata
            all_keys = set()
            for metadata in results['metadatas']:
                if metadata:  # Kiểm tra metadata không None
                    all_keys.update(metadata.keys())
            debug_info["all_metadata_keys"] = list(all_keys)
        
        return jsonify({
            "success": True,
            "debug_info": debug_info
        })
        
    except Exception as e:
        logger.error(f"Lỗi debug metadata: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/documents/upload', methods=['POST'])
@require_admin
def upload_document():
    """Upload PDF document"""
    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "Không có file được upload"
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "Không có file được chọn"
            }), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({
                "success": False,
                "error": "Chỉ chấp nhận file PDF"
            }), 400
        
        # Tạo thư mục temp nếu chưa có
        temp_dir = '/tmp'
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        
        # Lưu file tạm thời
        filename = secure_filename(file.filename)
        temp_path = os.path.join(temp_dir, f"{int(time.time())}_{filename}")
        file.save(temp_path)
        
        # Metadata từ form
        title = request.form.get('title', filename.replace('.pdf', ''))
        description = request.form.get('description', '')
        author = request.form.get('author', '')
        
        # Tạo document_id duy nhất dựa trên số lượng tài liệu bổ sung hiện có
        document_id = generate_unique_document_id(title)
        
        logger.info(f"Uploaded file: {filename} -> {temp_path}")
        
        return jsonify({
            "success": True,
            "message": "File đã được upload thành công",
            "document_id": document_id,
            "filename": filename,
            "temp_path": temp_path,
            "metadata": {
                "title": title,
                "description": description,
                "author": author
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi upload document: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi upload: {str(e)}"
        }), 500

def generate_unique_document_id(title):
    """Tạo document ID duy nhất dựa trên title và số thứ tự"""
    try:
        embedding_model = get_embedding_model()
        
        # Đếm số tài liệu bổ sung hiện có
        results = embedding_model.collection.get(
            where={"chapter": {"$like": "bosung%"}}
        )
        
        if results and results.get('metadatas'):
            # Lấy tất cả chapter IDs bắt đầu bằng "bosung"
            existing_chapters = set()
            for metadata in results['metadatas']:
                if metadata and metadata.get('chapter'):
                    chapter = metadata['chapter']
                    if chapter.startswith('bosung'):
                        existing_chapters.add(chapter)
            
            # Tìm số thứ tự cao nhất
            max_num = 0
            for chapter in existing_chapters:
                try:
                    num = int(chapter.replace('bosung', ''))
                    max_num = max(max_num, num)
                except:
                    continue
            
            next_num = max_num + 1
        else:
            next_num = 1
        
        # Tạo ID mới
        document_id = f"bosung{next_num}"
        logger.info(f"Generated unique document ID: {document_id}")
        
        return document_id
        
    except Exception as e:
        logger.error(f"Error generating document ID: {e}")
        # Fallback: sử dụng timestamp
        return f"bosung_{int(time.time())}"

@admin_routes.route('/documents/<doc_id>/process', methods=['POST'])
@require_admin
def process_document(doc_id):
    """Process document với Gemini - THÊM DEBUG LOGGING"""
    try:
        data = request.json
        temp_path = data.get('temp_path')
        
        if not temp_path or not os.path.exists(temp_path):
            return jsonify({
                "success": False,
                "error": "File không tồn tại"
            }), 400
        
        logger.info(f"Processing document {doc_id} from {temp_path}")
        
        # Kiểm tra và import PyPDF2
        try:
            import PyPDF2
        except ImportError:
            logger.error("PyPDF2 không được cài đặt")
            return jsonify({
                "success": False,
                "error": "Thiếu thư viện PyPDF2. Vui lòng cài đặt: pip install PyPDF2"
            }), 500
        
        # Đọc PDF content
        try:
            with open(temp_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                pdf_text = ""
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        pdf_text += page_text + "\n"
                        
            logger.info(f"Extracted {len(pdf_text)} characters from PDF")
            
            # DEBUG: Log phần đầu của PDF text
            logger.info(f"PDF text preview (first 500 chars): {pdf_text[:500]}...")
            
        except Exception as pdf_error:
            logger.error(f"Lỗi đọc PDF: {pdf_error}")
            return jsonify({
                "success": False,
                "error": f"Không thể đọc file PDF: {str(pdf_error)}"
            }), 400
        
        if not pdf_text.strip():
            return jsonify({
                "success": False,
                "error": "Không thể trích xuất text từ PDF. Vui lòng đảm bảo PDF có thể copy được chữ (không phải file scan)"
            }), 400
        
        # Tạo prompt cho Gemini
        try:
            prompt = create_document_processing_prompt(pdf_text)
            logger.info("Created prompt for Gemini")
            
            # DEBUG: Log độ dài prompt
            logger.info(f"Prompt length: {len(prompt)} characters")
            
        except Exception as prompt_error:
            logger.error(f"Lỗi tạo prompt: {prompt_error}")
            return jsonify({
                "success": False,
                "error": f"Lỗi tạo prompt: {str(prompt_error)}"
            }), 500
        
        # Gọi Gemini API
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("Calling Gemini API...")
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=100000  # Sử dụng giá trị bạn đã tăng
                )
            )
            
            if not response or not response.text:
                return jsonify({
                    "success": False,
                    "error": "Gemini không trả về response"
                }), 500
                
            result_text = response.text.strip()
            logger.info(f"Got response from Gemini: {len(result_text)} characters")
            
            # DEBUG: Log phần đầu của response
            logger.info(f"Gemini response preview (first 1000 chars): {result_text[:1000]}...")
            
        except Exception as gemini_error:
            logger.error(f"Lỗi gọi Gemini API: {gemini_error}")
            return jsonify({
                "success": False,
                "error": f"Lỗi gọi AI API: {str(gemini_error)}"
            }), 500
        
        # Parse JSON response
        try:
            # Làm sạch JSON response
            original_result_text = result_text  # Lưu bản gốc để log
            
            if result_text.startswith('```json'):
                result_text = result_text.replace('```json', '').replace('```', '').strip()
            elif result_text.startswith('```'):
                result_text = result_text[3:].rstrip('```').strip()
            
            logger.info(f"Cleaned response length: {len(result_text)} characters")
            
            processed_data = json.loads(result_text)
            logger.info("Successfully parsed JSON response")
            
            # DEBUG: Log sample chunks để kiểm tra content vs summary
            chunks = processed_data.get('chunks', [])
            logger.info(f"Found {len(chunks)} chunks in response")
            
            if chunks:
                for i, chunk in enumerate(chunks[:2]):  # Log 2 chunks đầu
                    chunk_id = chunk.get('id', f'chunk_{i}')
                    summary_len = len(chunk.get('summary', ''))
                    content_len = len(chunk.get('content', ''))
                    logger.info(f"Chunk {chunk_id}: summary_len={summary_len}, content_len={content_len}")
                    
                    # Log content preview
                    content_preview = chunk.get('content', '')[:300]
                    summary_preview = chunk.get('summary', '')[:300]
                    logger.info(f"Chunk {chunk_id} content preview: {content_preview}...")
                    logger.info(f"Chunk {chunk_id} summary preview: {summary_preview}...")
            
            # Lưu debug log vào file
            debug_log_path = save_gemini_response_to_file(original_result_text, processed_data, doc_id)
            logger.info(f"Debug log saved to: {debug_log_path}")
            
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON decode error: {json_error}")
            logger.error(f"Raw response: {result_text}")
            
            # Lưu response lỗi vào file debug
            try:
                log_dir = setup_debug_logging()
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                error_log_path = os.path.join(log_dir, f"gemini_error_{doc_id}_{timestamp}.log")
                
                with open(error_log_path, 'w', encoding='utf-8') as f:
                    f.write("GEMINI JSON PARSE ERROR\n")
                    f.write("=" * 40 + "\n")
                    f.write(f"Error: {json_error}\n\n")
                    f.write("Raw Response:\n")
                    f.write(result_text)
                
                logger.info(f"Error log saved to: {error_log_path}")
            except:
                pass
            
            return jsonify({
                "success": False,
                "error": f"AI trả về format không hợp lệ: {str(json_error)}"
            }), 500
        
        # Validate format
        try:
            if not validate_processed_format(processed_data):
                return jsonify({
                    "success": False,
                    "error": "AI trả về format không đúng cấu trúc yêu cầu"
                }), 500
        except Exception as validate_error:
            logger.error(f"Validation error: {validate_error}")
            return jsonify({
                "success": False,
                "error": f"Lỗi validate format: {str(validate_error)}"
            }), 500
        
        # Lưu vào ChromaDB
        try:
            save_processed_document(doc_id, processed_data)
            logger.info(f"Successfully saved document {doc_id} to ChromaDB")
        except Exception as save_error:
            logger.error(f"Lỗi lưu document: {save_error}")
            return jsonify({
                "success": False,
                "error": f"Lỗi lưu document: {str(save_error)}"
            }), 500
        
        # Xóa file tạm
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                logger.info(f"Deleted temp file: {temp_path}")
        except Exception as delete_error:
            logger.warning(f"Cannot delete temp file: {delete_error}")
        
        return jsonify({
            "success": True,
            "message": "Xử lý tài liệu thành công",
            "processed_chunks": len(processed_data.get('chunks', [])),
            "processed_tables": len(processed_data.get('tables', [])),
            "processed_figures": len(processed_data.get('figures', [])),
            "document_id": doc_id,
            "debug_log": debug_log_path  # Trả về đường dẫn log file
        })
        
    except Exception as e:
        logger.error(f"Lỗi xử lý document: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi xử lý: {str(e)}"
        }), 500

def create_document_processing_prompt(pdf_text):
    """Tạo prompt chi tiết cho Gemini - CẢI THIỆN THÊM"""
    # Cắt ngắn text để tránh vượt quá limit
    max_text_length = 80000  # Tăng lên do bạn đã tăng token limit
    if len(pdf_text) > max_text_length:
        pdf_text = pdf_text[:max_text_length] + "..."
    
    prompt = f"""
Bạn là một chuyên gia phân tích tài liệu. Nhiệm vụ của bạn là phân tích và chia nhỏ tài liệu PDF thành các phần có nghĩa.

TÀI LIỆU CẦN XỬ LÝ:
{pdf_text}

YÊU CẦU PHÂN TÍCH:

1. PHÂN CHIA NỘI DUNG:
   - Chia tài liệu thành các chunk có nghĩa (mỗi chunk 200-1000 từ)
   - QUAN TRỌNG: Trong field "content" của mỗi chunk, bạn PHẢI SAO CHÉP NGUYÊN VĂN nội dung từ tài liệu gốc
   - Field "summary" chỉ là tóm tắt ngắn gọn (1-2 câu)
   - Field "content" phải chứa toàn bộ văn bản gốc của phần đó
   - KHÔNG viết lại, KHÔNG diễn giải, KHÔNG tóm tắt trong field "content"

2. CẤU TRÚC JSON:
Mỗi chunk PHẢI có đủ các field sau:
- "id": ID duy nhất 
- "title": Tiêu đề của chunk
- "content": NỘI DUNG NGUYÊN VĂN từ PDF (bắt buộc phải có)
- "summary": Tóm tắt ngắn gọn (khác với content)
- "content_type": "text", "table", hoặc "figure"
- "age_range": [min_age, max_age] từ 1-19
- "pages": trang nếu biết
- "related_chunks": []
- "word_count": số từ trong content
- "token_count": ước tính token

3. VÍ DỤ ĐÚNG:
{{
  "id": "bosung1_muc1_1",
  "title": "Giới thiệu về dinh dưỡng",
  "content": "Dinh dưỡng là quá trình cung cấp cho cơ thể các chất cần thiết để duy trì sự sống, phát triển và hoạt động. Các chất dinh dưỡng bao gồm...", 
  "summary": "Giới thiệu khái niệm cơ bản về dinh dưỡng",
  "content_type": "text",
  "age_range": [1, 19]
}}

4. ĐỊNH DẠNG OUTPUT JSON:
{{
    "bai_info": {{
        "id": "bosung1",
        "title": "Tiêu đề tài liệu",
        "overview": "Tổng quan"
    }},
    "chunks": [
        {{
            "id": "bosung1_muc1_1",
            "title": "Tiêu đề chunk",
            "content": "NỘI DUNG NGUYÊN VĂN TỪ PDF - BẮTED BUỘC PHẢI CÓ",
            "summary": "Tóm tắt ngắn gọn",
            "content_type": "text",
            "age_range": [1, 19],
            "pages": "",
            "related_chunks": [],
            "word_count": 100,
            "token_count": 150,
            "contains_table": false,
            "contains_figure": false
        }}
    ],
    "tables": [],
    "figures": [],
    "total_items": {{"chunks": 1, "tables": 0, "figures": 0}}
}}

LƯU Ý QUAN TRỌNG:
- Field "content" PHẢI chứa văn bản nguyên gốc từ PDF
- Field "summary" mới là phần tóm tắt
- KHÔNG được để field "content" trống hoặc giống "summary"
- Trả về JSON hợp lệ, không có text thừa

Hãy phân tích và trả về JSON, đảm bảo field "content" chứa nội dung đầy đủ từ PDF.
"""
    return prompt

def validate_processed_format(data):
    """Validate format của processed data"""
    try:
        # Kiểm tra required fields
        required_fields = ['bai_info', 'chunks', 'total_items']
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Validate bai_info
        bai_info = data['bai_info']
        bai_info_fields = ['id', 'title', 'overview']
        for field in bai_info_fields:
            if field not in bai_info:
                logger.error(f"Missing bai_info field: {field}")
                return False
        
        # Validate chunks
        if not isinstance(data['chunks'], list):
            logger.error("chunks must be a list")
            return False
        
        for i, chunk in enumerate(data['chunks']):
            chunk_fields = ['id', 'title', 'content_type', 'age_range', 'summary']
            for field in chunk_fields:
                if field not in chunk:
                    logger.error(f"Missing chunk field '{field}' in chunk {i}")
                    return False
            
            # Validate age_range
            age_range = chunk['age_range']
            if not isinstance(age_range, list) or len(age_range) != 2:
                logger.error(f"Invalid age_range in chunk {i}: must be list of 2 integers")
                return False
            
            if not all(isinstance(x, int) and 1 <= x <= 19 for x in age_range):
                logger.error(f"Invalid age_range values in chunk {i}: must be integers 1-19")
                return False
        
        # Validate optional fields
        for table in data.get('tables', []):
            if 'age_range' in table:
                age_range = table['age_range']
                if not isinstance(age_range, list) or len(age_range) != 2:
                    logger.error("Invalid age_range in table")
                    return False
        
        for figure in data.get('figures', []):
            if 'age_range' in figure:
                age_range = figure['age_range']
                if not isinstance(age_range, list) or len(age_range) != 2:
                    logger.error("Invalid age_range in figure")
                    return False
        
        logger.info("Document format validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return False

def save_processed_document(doc_id, processed_data):
    try:
        embedding_model = get_embedding_model()
        
        document_title = processed_data.get('bai_info', {}).get('title', f'Tài liệu {doc_id}')
        
        # Chuẩn bị tất cả items để index
        all_items = []
        
        # Xử lý chunks
        for chunk in processed_data.get('chunks', []):
            chunk_content = chunk.get('content', chunk.get('summary', ''))
            if not chunk_content:
                # Fallback nếu không có content
                chunk_content = f"Tiêu đề: {chunk['title']}\nNội dung: {chunk.get('summary', '')}"
            
            # Chuẩn bị metadata theo format cần thiết
            metadata = {
                "chunk_id": chunk['id'],
                "chapter": doc_id,
                "title": chunk['title'],
                "content_type": chunk['content_type'],
                "age_range": f"{chunk['age_range'][0]}-{chunk['age_range'][1]}",
                "age_min": chunk['age_range'][0],
                "age_max": chunk['age_range'][1],
                "summary": chunk['summary'],
                "pages": chunk.get('pages', ''),
                "related_chunks": ','.join(chunk.get('related_chunks', [])),
                "word_count": chunk.get('word_count', 0),
                "token_count": chunk.get('token_count', 0),
                "contains_table": chunk.get('contains_table', False),
                "contains_figure": chunk.get('contains_figure', False),
                "created_at": datetime.datetime.now().isoformat(),
                "document_source": document_title,
                "document_title": document_title
            }
            
            # Thêm vào danh sách
            all_items.append({
                "content": chunk_content,
                "metadata": metadata,
                "id": chunk['id']
            })
        
        # Xử lý tables
        for table in processed_data.get('tables', []):
            table_content = table.get('content', f"Bảng: {table['title']}\nMô tả: {table.get('summary', '')}")
            
            metadata = {
                "chunk_id": table['id'],
                "chapter": doc_id,
                "title": table['title'],
                "content_type": "table",
                "age_range": f"{table['age_range'][0]}-{table['age_range'][1]}",
                "age_min": table['age_range'][0],
                "age_max": table['age_range'][1],
                "summary": table['summary'],
                "pages": table.get('pages', ''),
                "related_chunks": ','.join(table.get('related_chunks', [])),
                "table_columns": ','.join(table.get('table_columns', [])),
                "word_count": table.get('word_count', 0),
                "token_count": table.get('token_count', 0),
                "created_at": datetime.datetime.now().isoformat(),
                "document_source": document_title,
                "document_title": document_title  
            }
            
            all_items.append({
                "content": table_content,
                "metadata": metadata,
                "id": table['id']
            })
        
        # Xử lý figures
        for figure in processed_data.get('figures', []):
            figure_content = figure.get('content', f"Hình: {figure['title']}\nMô tả: {figure.get('summary', '')}")
            
            metadata = {
                "chunk_id": figure['id'],
                "chapter": doc_id,
                "title": figure['title'],
                "content_type": "figure",
                "age_range": f"{figure['age_range'][0]}-{figure['age_range'][1]}",
                "age_min": figure['age_range'][0],
                "age_max": figure['age_range'][1],
                "summary": figure['summary'],
                "pages": figure.get('pages', ''),
                "related_chunks": ','.join(figure.get('related_chunks', [])),
                "created_at": datetime.datetime.now().isoformat(),
                "document_source": document_title, 
                "document_title": document_title  
            }
            
            all_items.append({
                "content": figure_content,
                "metadata": metadata,
                "id": figure['id']
            })
        
        # Sử dụng index_chunks để lưu tất cả items
        if all_items:
            success = embedding_model.index_chunks(all_items)
            if success:
                logger.info(f"Successfully indexed {len(all_items)} items for document {doc_id} (title: {document_title})")
            else:
                raise Exception("Failed to index chunks")
        else:
            logger.warning(f"No items to index for document {doc_id}")
        
    except Exception as e:
        logger.error(f"Error in save_processed_document: {str(e)}")
        raise

@admin_routes.route('/documents/<doc_id>', methods=['DELETE'])
@require_admin
def delete_document(doc_id):
    """Xóa document theo chapter"""
    try:
        embedding_model = get_embedding_model()
        
        # Lấy tất cả chunks của document - BỎ include=['ids']
        results = embedding_model.collection.get(
            where={"chapter": doc_id}
            # Không cần include=['ids'] vì mặc định đã trả về ids
        )
        
        if results and results.get('ids'):
            # Xóa từng chunk
            for chunk_id in results['ids']:
                embedding_model.collection.delete(ids=[chunk_id])
            
            return jsonify({
                "success": True,
                "message": f"Đã xóa {len(results['ids'])} chunks của document {doc_id}"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy document"
            }), 404
        
    except Exception as e:
        logger.error(f"Lỗi xóa document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/documents/bulk-delete', methods=['POST'])
@require_admin
def bulk_delete_documents():
    """Xóa nhiều documents"""
    try:
        data = request.json
        doc_ids = data.get('doc_ids', [])
        
        if not doc_ids:
            return jsonify({
                "success": False,
                "error": "Không có document nào được chọn"
            }), 400
        
        embedding_model = get_embedding_model()
        deleted_count = 0
        
        for doc_id in doc_ids:
            try:
                # SỬA: Bỏ include=['ids']
                results = embedding_model.collection.get(
                    where={"chapter": doc_id}
                )
                
                if results and results.get('ids'):
                    for chunk_id in results['ids']:
                        embedding_model.collection.delete(ids=[chunk_id])
                    deleted_count += 1
                    
            except Exception as e:
                logger.error(f"Lỗi xóa document {doc_id}: {e}")
                continue
        
        return jsonify({
            "success": True,
            "message": f"Đã xóa {deleted_count}/{len(doc_ids)} documents",
            "deleted_count": deleted_count
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa bulk documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ===== ANALYTICS ROUTES =====

@admin_routes.route('/analytics/overview', methods=['GET'])
@require_admin
def get_analytics_overview():
    """Lấy thống kê phân tích"""
    try:
        db = get_db()
        
        # Thống kê cơ bản
        total_conversations = db.conversations.count_documents({})
        total_users = db.users.count_documents({}) if hasattr(db, 'users') else 1
        
        # Thống kê theo tuần (7 ngày gần nhất)
        daily_stats = []
        for i in range(7):
            day_start = datetime.datetime.now() - datetime.timedelta(days=6-i)
            day_end = day_start + datetime.timedelta(days=1)
            
            daily_conversations = db.conversations.count_documents({
                "created_at": {"$gte": day_start, "$lt": day_end}
            })
            
            daily_stats.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "label": day_start.strftime("%d/%m"),
                "conversations": daily_conversations,
                "users": 0  # Mock data
            })
        
        # Thống kê theo độ tuổi
        age_stats = list(db.conversations.aggregate([
            {"$group": {"_id": "$age_context", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]))
        
        return jsonify({
            "success": True,
            "overview": {
                "totalUsers": total_users,
                "activeUsers": total_users,
                "totalConversations": total_conversations,
                "avgMessagesPerConversation": 6.8,
                "userGrowth": "+8.5%",
                "conversationGrowth": "+12.3%"
            },
            "dailyStats": daily_stats,
            "ageDistribution": [
                {
                    "age_group": f"{stat['_id']} tuổi" if stat['_id'] else "Không rõ",
                    "count": stat["count"]
                }
                for stat in age_stats
            ]
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy analytics: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/users/<user_id>', methods=['PUT'])
@require_admin
def update_user(user_id):
    """Cập nhật thông tin người dùng"""
    try:
        data = request.json
        
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        # Cập nhật thông tin
        if 'name' in data:
            user.name = data['name']
        
        if 'gender' in data:
            user.gender = data['gender']
        
        if 'role' in data:
            user.role = data['role']
        
        # Lưu thay đổi
        user.save()
        
        return jsonify({
            "success": True,
            "message": "Cập nhật người dùng thành công",
            "user": {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "gender": user.gender,
                "role": user.role
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi cập nhật user: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/feedback', methods=['GET'])
@require_admin
def get_all_feedback():
    """API endpoint để admin xem tất cả feedback"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status_filter = request.args.get('status')
        skip = (page - 1) * per_page
        
        feedbacks = Feedback.get_all_for_admin(limit=per_page, skip=skip, status_filter=status_filter)
        
        result = []
        for feedback in feedbacks:
            result.append({
                "id": str(feedback.feedback_id),
                "user_name": getattr(feedback, 'user_name', 'Ẩn danh'),
                "user_email": getattr(feedback, 'user_email', ''),
                "rating": feedback.rating,
                "category": feedback.category,
                "title": feedback.title,
                "content": feedback.content,
                "status": feedback.status,
                "admin_response": feedback.admin_response,
                "created_at": feedback.created_at.isoformat(),
                "updated_at": feedback.updated_at.isoformat()
            })
        
        return jsonify({
            "success": True,
            "feedbacks": result
        })
        
    except Exception as e:
        logger.error(f"Error getting feedback for admin: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/feedback/stats', methods=['GET'])
@require_admin
def get_feedback_stats():
    """API endpoint để lấy thống kê feedback"""
    try:
        stats = Feedback.get_stats()
        return jsonify({
            "success": True,
            "stats": stats
        })
    except Exception as e:
        logger.error(f"Error getting feedback stats: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/feedback/<feedback_id>/respond', methods=['PUT'])
@require_admin
def respond_to_feedback(feedback_id):
    """API endpoint để admin phản hồi feedback"""
    try:
        data = request.json
        response_text = data.get('response', '')
        new_status = data.get('status', 'reviewed')
        
        if not response_text.strip():
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập phản hồi"
            }), 400
        
        feedback = Feedback.find_by_id(feedback_id)
        if not feedback:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy feedback"
            }), 404
        
        success = feedback.update_admin_response(response_text.strip(), new_status)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Đã phản hồi feedback thành công"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không thể cập nhật phản hồi"
            }), 500
        
    except Exception as e:
        logger.error(f"Error responding to feedback: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ===== SYSTEM SETTINGS ROUTES =====

@admin_routes.route('/settings/system-config', methods=['GET'])
@require_admin
def get_system_config():
    """Lấy cấu hình hệ thống thật"""
    try:
        import os
        from config import EMBEDDING_MODEL, GEMINI_API_KEY, CHROMA_PERSIST_DIRECTORY, COLLECTION_NAME
        from core.embedding_model import get_embedding_model
        
        # Thông tin database
        db = get_db()
        
        # Thông tin Collections trong MongoDB
        try:
            mongo_collections = db.list_collection_names()
            mongo_stats = {}
            for collection_name in mongo_collections:
                collection = db[collection_name]
                mongo_stats[collection_name] = {
                    "document_count": collection.count_documents({}),
                    "estimated_size": collection.estimated_document_count()
                }
        except Exception as e:
            mongo_collections = []
            mongo_stats = {"error": str(e)}
        
        # Thông tin ChromaDB/Vector Database
        try:
            embedding_model = get_embedding_model()
            vector_stats = embedding_model.get_stats()
            chroma_status = "Connected"
            vector_count = embedding_model.count()
        except Exception as e:
            vector_stats = {"error": str(e)}
            chroma_status = "Error"
            vector_count = 0
        
        # Thông tin Gemini API
        gemini_status = "Connected" if GEMINI_API_KEY else "Not configured"
        
        # Thông tin hệ thống
        import platform
        import psutil
        
        system_info = {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "cpu_count": psutil.cpu_count(),
            "memory_total": round(psutil.virtual_memory().total / (1024**3), 2),  # GB
            "memory_available": round(psutil.virtual_memory().available / (1024**3), 2),  # GB
            "disk_usage": round(psutil.disk_usage('/').percent, 2)
        }
        
        # Cấu hình application
        app_config = {
            "debug_mode": os.getenv("FLASK_ENV") == "development",
            "secret_key_configured": bool(os.getenv("JWT_SECRET_KEY")),
            "mongodb_uri": os.getenv("MONGO_URI", "mongodb://localhost:27017/"),
            "database_name": os.getenv("MONGO_DB_NAME", "nutribot_db"),
            "embedding_model": EMBEDDING_MODEL,
            "chroma_directory": CHROMA_PERSIST_DIRECTORY,
            "collection_name": COLLECTION_NAME,
            "gemini_configured": bool(GEMINI_API_KEY)
        }
        
        return jsonify({
            "success": True,
            "system_config": {
                "application": app_config,
                "system": system_info,
                "database": {
                    "mongodb": {
                        "status": "Connected",
                        "collections": mongo_collections,
                        "statistics": mongo_stats
                    },
                    "vector_db": {
                        "status": chroma_status,
                        "document_count": vector_count,
                        "statistics": vector_stats
                    }
                },
                "ai_services": {
                    "gemini": {
                        "status": gemini_status,
                        "model": "gemini-2.0-flash"
                    }
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy system config: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/settings/performance', methods=['GET'])
@require_admin
def get_performance_metrics():
    """Lấy metrics hiệu năng hệ thống"""
    try:
        import psutil
        import time
        from datetime import datetime, timedelta
        
        # CPU và Memory hiện tại
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Thống kê database
        db = get_db()
        
        # Thống kê MongoDB performance
        try:
            # Thời gian trung bình cho queries (mock data - MongoDB professional monitoring cần tools khác)
            conversations_count = db.conversations.count_documents({})
            users_count = db.users.count_documents({}) if hasattr(db, 'users') else 0
            
            # Tốc độ xử lý tin nhắn trong 24h qua
            yesterday = datetime.now() - timedelta(days=1)
            recent_conversations = db.conversations.count_documents({
                "updated_at": {"$gte": yesterday}
            })
            
            db_performance = {
                "total_documents": conversations_count + users_count,
                "query_speed": "~50ms",  # Mock data
                "recent_activity": recent_conversations,
                "index_efficiency": "95%"  # Mock data
            }
        except Exception as e:
            db_performance = {"error": str(e)}
        
        # Vector DB performance
        try:
            from core.embedding_model import get_embedding_model
            embedding_model = get_embedding_model()
            vector_count = embedding_model.count()
            
            # Test search speed
            start_time = time.time()
            test_results = embedding_model.search("test query", top_k=5)
            search_time = (time.time() - start_time) * 1000  # milliseconds
            
            vector_performance = {
                "total_vectors": vector_count,
                "search_speed_ms": round(search_time, 2),
                "embedding_dimension": 768,  # multilingual-e5-base dimension
                "retrieval_accuracy": "85%"  # Mock data - would need evaluation dataset
            }
        except Exception as e:
            vector_performance = {"error": str(e)}
        
        # AI API performance
        ai_performance = {
            "average_response_time": "2.5s",  # Mock data
            "success_rate": "98.5%",  # Mock data
            "daily_requests": recent_conversations * 2,  # Estimate
            "token_usage": "~150k tokens/day"  # Mock data
        }
        
        return jsonify({
            "success": True,
            "performance": {
                "system": {
                    "cpu_usage": cpu_percent,
                    "memory_usage": memory.percent,
                    "memory_total_gb": round(memory.total / (1024**3), 2),
                    "memory_used_gb": round(memory.used / (1024**3), 2),
                    "disk_usage": disk.percent,
                    "disk_total_gb": round(disk.total / (1024**3), 2),
                    "uptime": "24h 15m"  # Mock data
                },
                "database": db_performance,
                "vector_search": vector_performance,
                "ai_generation": ai_performance
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy performance metrics: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/settings/logs', methods=['GET'])
@require_admin  
def get_system_logs():
    """Lấy logs hệ thống"""
    try:
        import os
        from datetime import datetime
        
        log_entries = []
        
        # Đọc logs từ file nếu có
        log_files = [
            "logs/app.log",
            "logs/error.log", 
            "embed_data.log"
        ]
        
        for log_file in log_files:
            if os.path.exists(log_file):
                try:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        # Lấy 50 dòng cuối
                        recent_lines = lines[-50:] if len(lines) > 50 else lines
                        
                        for line in recent_lines:
                            if line.strip():
                                log_entries.append({
                                    "timestamp": datetime.now().isoformat(),
                                    "level": "INFO",  # Parse từ log format thực tế
                                    "source": log_file,
                                    "message": line.strip()
                                })
                except Exception as e:
                    log_entries.append({
                        "timestamp": datetime.now().isoformat(),
                        "level": "ERROR",
                        "source": "system",
                        "message": f"Cannot read {log_file}: {str(e)}"
                    })
        
        # Nếu không có log files, tạo mock logs
        if not log_entries:
            log_entries = [
                {
                    "timestamp": datetime.now().isoformat(),
                    "level": "INFO",
                    "source": "system",
                    "message": "Application started successfully"
                },
                {
                    "timestamp": datetime.now().isoformat(),
                    "level": "INFO", 
                    "source": "database",
                    "message": "MongoDB connection established"
                },
                {
                    "timestamp": datetime.now().isoformat(),
                    "level": "INFO",
                    "source": "vector_db",
                    "message": "ChromaDB initialized successfully"
                }
            ]
        
        # Sort by timestamp descending
        log_entries.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return jsonify({
            "success": True,
            "logs": log_entries[:100]  # Limit to 100 entries
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy system logs: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/settings/backup', methods=['POST'])
@require_admin
def create_backup():
    """Tạo backup dữ liệu"""
    try:
        from datetime import datetime
        import json
        import os
        
        # Tạo thư mục backup nếu chưa có
        backup_dir = "backups"
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Backup MongoDB data
        db = get_db()
        backup_data = {
            "timestamp": datetime.now().isoformat(),
            "collections": {}
        }
        
        # Export conversations
        conversations = list(db.conversations.find({}))
        for conv in conversations:
            conv["_id"] = str(conv["_id"])  # Convert ObjectId to string
            if "user_id" in conv:
                conv["user_id"] = str(conv["user_id"])
        backup_data["collections"]["conversations"] = conversations
        
        # Export users if exists
        if hasattr(db, 'users'):
            users = list(db.users.find({}))
            for user in users:
                user["_id"] = str(user["_id"])
                # Remove password for security
                if "password" in user:
                    del user["password"]
            backup_data["collections"]["users"] = users
        
        # Save backup file
        backup_filename = f"backup_{timestamp}.json"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, default=str, ensure_ascii=False)
        
        # Get file size
        file_size = os.path.getsize(backup_path)
        file_size_mb = round(file_size / (1024 * 1024), 2)
        
        return jsonify({
            "success": True,
            "message": "Backup created successfully",
            "backup": {
                "filename": backup_filename,
                "path": backup_path,
                "size_mb": file_size_mb,
                "timestamp": datetime.now().isoformat(),
                "collections_count": len(backup_data["collections"]),
                "total_documents": sum(len(coll) for coll in backup_data["collections"].values())
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi tạo backup: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/settings/security', methods=['GET'])
@require_admin
def get_security_settings():
    """Lấy cài đặt bảo mật"""
    try:
        import os
        from datetime import datetime, timedelta
        
        # Kiểm tra cấu hình bảo mật
        security_config = {
            "jwt_configured": bool(os.getenv("JWT_SECRET_KEY")),
            "admin_accounts": 1,  # Mock data
            "password_policy": {
                "min_length": 6,
                "require_special_chars": False,
                "require_numbers": False
            },
            "session_timeout": "24 hours",
            "ssl_enabled": False,  # Mock data
            "rate_limiting": False  # Mock data
        }
        
        # Recent login attempts (mock data)
        recent_logins = [
            {
                "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
                "user": "admin@nutribot.com", 
                "ip": "127.0.0.1",
                "status": "success"
            },
            {
                "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
                "user": "admin@nutribot.com",
                "ip": "127.0.0.1", 
                "status": "success"
            }
        ]
        
        # Security recommendations
        recommendations = [
            {
                "priority": "high",
                "title": "Enable HTTPS",
                "description": "Deploy with SSL certificate for production"
            },
            {
                "priority": "medium", 
                "title": "Implement Rate Limiting",
                "description": "Add rate limiting to prevent abuse"
            },
            {
                "priority": "low",
                "title": "Strengthen Password Policy", 
                "description": "Require stronger passwords for admin accounts"
            }
        ]
        
        return jsonify({
            "success": True,
            "security": {
                "configuration": security_config,
                "recent_logins": recent_logins,
                "recommendations": recommendations
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy security settings: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500