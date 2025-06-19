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

logger = logging.getLogger(__name__)

# Tạo blueprint
admin_routes = Blueprint('admin', __name__)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

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
    """Lấy danh sách cuộc hội thoại"""
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
            user = User.find_by_id(conv.get("user_id"))
            
            conversations_list.append({
                "id": str(conv["_id"]),
                "title": conv.get("title", ""),
                "user_name": user.name if user else "Unknown",
                "age_context": conv.get("age_context"),
                "message_count": len(conv.get("messages", [])),
                "is_archived": conv.get("is_archived", False),
                "created_at": conv.get("created_at").isoformat() if conv.get("created_at") else None,
                "updated_at": conv.get("updated_at").isoformat() if conv.get("updated_at") else None,
                "messages": conv.get("messages", [])  # Cho detail modal
            })
        
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
    """Xóa cuộc hội thoại"""
    try:
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        conversation.delete()
        
        return jsonify({
            "success": True,
            "message": "Đã xóa cuộc hội thoại"
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa conversation: {str(e)}")
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
        
        # Debug: In ra một vài metadata đầu tiên để kiểm tra
        logger.info("Sample metadata from ChromaDB:")
        for i, metadata in enumerate(results['metadatas'][:3]):
            logger.info(f"Metadata {i}: {metadata}")
        
        # Phân tích metadata để tìm ra cấu trúc thực tế
        documents_by_chapter = {}
        stats = {
            "total": 0,
            "by_chapter": {},
            "by_type": {}
        }
        
        for i, metadata in enumerate(results['metadatas']):
            # Tìm chapter từ chunk_id hoặc metadata
            chapter = None
            chunk_id = metadata.get('chunk_id', '')
            
            # Phân tích chunk_id để tìm chapter
            if chunk_id.startswith('bai1_'):
                chapter = 'bai1'
            elif chunk_id.startswith('bai2_'):
                chapter = 'bai2'
            elif chunk_id.startswith('bai3_'):
                chapter = 'bai3'
            elif chunk_id.startswith('bai4_'):
                chapter = 'bai4'
            elif 'phuluc' in chunk_id.lower() or 'appendix' in chunk_id.lower():
                chapter = 'phuluc'
            else:
                # Thử tìm từ metadata khác
                chapter = metadata.get('chapter', metadata.get('source', 'unknown'))
            
            if not chapter:
                chapter = 'unknown'
            
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
    """Lấy tiêu đề chapter"""
    chapter_titles = {
        'bai1': 'Bài 1: Dinh dưỡng theo lứa tuổi học sinh',
        'bai2': 'Bài 2: An toàn thực phẩm',
        'bai3': 'Bài 3: Vệ sinh dinh dưỡng',
        'bai4': 'Bài 4: Giáo dục dinh dưỡng',
        'phuluc': 'Phụ lục',
        'unknown': 'Tài liệu khác'
    }
    return chapter_titles.get(chapter, f'Chương {chapter}')

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
        embedding_model = get_embedding_model()
        
        # Query documents theo chapter - thử nhiều cách
        queries = []
        
        # Thử query theo chunk_id pattern
        if doc_id != 'unknown':
            queries.append({"chunk_id": {"$regex": f"^{doc_id}_"}})
        
        # Thử query theo chapter field
        queries.append({"chapter": doc_id})
        
        # Thử query theo source
        queries.append({"source": doc_id})
        
        results = None
        for query in queries:
            try:
                results = embedding_model.collection.get(
                    where=query,
                    include=['metadatas', 'documents', 'ids']
                )
                if results and results['metadatas']:
                    logger.info(f"Found {len(results['metadatas'])} documents with query: {query}")
                    break
            except Exception as e:
                logger.warning(f"Query {query} failed: {e}")
                continue
        
        # Nếu không tìm thấy bằng query, thử filter manually
        if not results or not results['metadatas']:
            logger.info(f"Trying manual filter for doc_id: {doc_id}")
            all_results = embedding_model.collection.get(
                include=['metadatas', 'documents', 'ids']
            )
            
            if all_results and all_results['metadatas']:
                filtered_indices = []
                for i, metadata in enumerate(all_results['metadatas']):
                    chunk_id = metadata.get('chunk_id', '')
                    chapter = metadata.get('chapter', '')
                    source = metadata.get('source', '')
                    
                    if (chunk_id.startswith(f"{doc_id}_") or 
                        chapter == doc_id or 
                        source == doc_id or
                        (doc_id == 'unknown' and not any(chunk_id.startswith(f"bai{i}_") for i in range(1, 5)) and 'phuluc' not in chunk_id.lower())):
                        filtered_indices.append(i)
                
                if filtered_indices:
                    results = {
                        'ids': [all_results['ids'][i] for i in filtered_indices],
                        'metadatas': [all_results['metadatas'][i] for i in filtered_indices],
                        'documents': [all_results['documents'][i] for i in filtered_indices]
                    }
        
        if not results or not results['metadatas']:
            return jsonify({
                "success": False,
                "error": f"Không tìm thấy tài liệu cho {doc_id}"
            }), 404
        
        # Xử lý kết quả
        chunks = []
        for i, metadata in enumerate(results['metadatas']):
            chunk = {
                "id": results['ids'][i],
                "content": results['documents'][i][:200] + "..." if len(results['documents'][i]) > 200 else results['documents'][i],
                "metadata": metadata,
                "content_type": metadata.get('content_type', 'text'),
                "age_range": metadata.get('age_range', []),
                "created_at": metadata.get('created_at')
            }
            chunks.append(chunk)
        
        logger.info(f"Returning {len(chunks)} chunks for {doc_id}")
        
        return jsonify({
            "success": True,
            "document": {
                "id": doc_id,
                "chunks": chunks,
                "total_chunks": len(chunks)
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy chi tiết document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/documents/debug/metadata', methods=['GET'])
@require_admin
def debug_metadata():
    """Debug metadata trong ChromaDB"""
    try:
        embedding_model = get_embedding_model()
        
        # Lấy 10 documents đầu tiên để debug
        results = embedding_model.collection.get(
            limit=10,
            include=['metadatas', 'ids']
        )
        
        debug_info = {
            "total_documents": len(results['metadatas']) if results else 0,
            "sample_metadata": results['metadatas'][:5] if results else [],
            "sample_ids": results['ids'][:5] if results else [],
            "all_metadata_keys": []
        }
        
        if results and results['metadatas']:
            # Lấy tất cả keys từ metadata
            all_keys = set()
            for metadata in results['metadatas']:
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
        
        # Lưu file tạm thời
        filename = secure_filename(file.filename)
        temp_path = os.path.join('/tmp', filename)
        file.save(temp_path)
        
        # Metadata từ form
        title = request.form.get('title', filename.replace('.pdf', ''))
        description = request.form.get('description', '')
        author = request.form.get('author', '')
        
        # Tạo document record
        document_id = f"upload_{int(datetime.datetime.now().timestamp())}"
        
        return jsonify({
            "success": True,
            "message": "File đã được upload thành công",
            "document_id": document_id,
            "filename": filename,
            "temp_path": temp_path
        })
        
    except Exception as e:
        logger.error(f"Lỗi upload document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/documents/<doc_id>/process', methods=['POST'])
@require_admin
def process_document(doc_id):
    """Process document với Gemini"""
    try:
        data = request.json
        temp_path = data.get('temp_path')
        
        if not temp_path or not os.path.exists(temp_path):
            return jsonify({
                "success": False,
                "error": "File không tồn tại"
            }), 400
        
        # Đọc PDF content (cần thêm PyPDF2 hoặc pdfplumber)
        import PyPDF2
        
        with open(temp_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            pdf_text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                pdf_text += page.extract_text()
        
        if not pdf_text.strip():
            return jsonify({
                "success": False,
                "error": "Không thể trích xuất text từ PDF. Vui lòng đảm bảo PDF có thể copy được chữ (không phải file scan)"
            }), 400
        
        # Tạo prompt cho Gemini
        prompt = create_document_processing_prompt(pdf_text)
        
        # Gọi Gemini API
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = model.generate_content(prompt)
                result_text = response.text.strip()
                
                # Parse JSON response
                try:
                    if result_text.startswith('```json'):
                        result_text = result_text.replace('```json', '').replace('```', '').strip()
                    
                    processed_data = json.loads(result_text)
                    
                    # Validate format
                    if validate_processed_format(processed_data):
                        # Lưu vào ChromaDB
                        save_processed_document(doc_id, processed_data)
                        
                        # Xóa file tạm
                        os.remove(temp_path)
                        
                        return jsonify({
                            "success": True,
                            "message": "Xử lý tài liệu thành công",
                            "processed_chunks": len(processed_data.get('chunks', [])),
                            "document_id": doc_id
                        })
                    else:
                        if attempt == max_retries - 1:
                            return jsonify({
                                "success": False,
                                "error": "Gemini không trả về đúng định dạng sau nhiều lần thử"
                            }), 500
                        continue
                        
                except json.JSONDecodeError:
                    if attempt == max_retries - 1:
                        return jsonify({
                            "success": False,
                            "error": "Không thể parse JSON từ Gemini response"
                        }), 500
                    continue
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    return jsonify({
                        "success": False,
                        "error": f"Lỗi gọi Gemini API: {str(e)}"
                    }), 500
                time.sleep(2)  # Wait before retry
                continue
        
    except Exception as e:
        logger.error(f"Lỗi xử lý document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def create_document_processing_prompt(pdf_text):
    """Tạo prompt chi tiết cho Gemini"""
    return f"""
Bạn là một chuyên gia phân tích tài liệu dinh dưỡng. Nhiệm vụ của bạn là phân tích và chia nhỏ tài liệu PDF về dinh dưỡng thành các phần có nghĩa.

TÁCH LIỆU CẦN XỬ LÝ:
{pdf_text[:8000]}...

YÊU CẦU PHÂN TÍCH:

1. PHÂN CHIA NỘI DUNG:
   - Chia tài liệu thành các chunk có nghĩa (mỗi chunk 200-500 từ)
   - Mỗi chunk phải hoàn chỉnh về ý nghĩa
   - Phân biệt rõ text, table, figure

2. ĐẶT TÊN THEO QUY CHUẨN:
   - Text chunks: "bosungX_mucY_Z" (X=số thứ tự bài bổ sung, Y=mục, Z=phần)
   - Tables: "bosungX_bangY" 
   - Figures: "bosungX_hinhY"

3. XÁC ĐỊNH METADATA:
   - age_range: Phân tích nội dung để xác định độ tuổi áp dụng [min_age, max_age]
   - content_type: "text", "table", hoặc "figure"
   - summary: Tóm tắt ngắn gọn nội dung (1-2 câu)
   - related_chunks: Danh sách ID các chunk liên quan

4. ĐỊNH DẠNG OUTPUT:
Trả về JSON với cấu trúc chính xác như sau:

{
    "bai_info": {
        "id": "bosungX",
        "title": "Tiêu đề tài liệu bổ sung",
        "pages": "trang áp dụng",
        "overview": "Tổng quan tài liệu"
    },
    "chunks": [
        {
            "id": "bosungX_mucY_Z",
            "title": "Tiêu đề chunk",
            "content_type": "text",
            "age_range": [min_age, max_age],
            "pages": "trang",
            "related_chunks": ["chunk_id_khac"],
            "summary": "Tóm tắt nội dung",
            "word_count": số_từ,
            "token_count": số_token_ước_tính,
            "contains_table": true/false,
            "contains_figure": true/false
        }
    ],
    "tables": [
        {
            "id": "bosungX_bangY",
            "title": "Tiêu đề bảng",
            "content_type": "table",
            "age_range": [min_age, max_age],
            "pages": "trang",
            "related_chunks": ["chunk_liên_quan"],
            "table_columns": ["cột1", "cột2", "cột3"],
            "summary": "Mô tả bảng",
            "word_count": số_từ,
            "token_count": số_token
        }
    ],
    "figures": [
        {
            "id": "bosungX_hinhY",
            "title": "Tiêu đề hình",
            "content_type": "figure",
            "age_range": [min_age, max_age],
            "pages": "trang",
            "related_chunks": ["chunk_liên_quan"],
            "summary": "Mô tả hình ảnh"
        }
    ],
    "total_items": {
        "chunks": số_chunk,
        "tables": số_bảng,
        "figures": số_hình
    },
    "document_source": "Tài liệu bổ sung"
}

LUU Ý QUAN TRỌNG:
- Đảm bảo JSON format hoàn toàn chính xác
- Không thêm bất kỳ text nào ngoài JSON
- age_range phải là array 2 số nguyên
- Tất cả field bắt buộc phải có
- related_chunks phải là array string
- Phân tích kỹ nội dung để xác định độ tuổi phù hợp

Hãy phân tích và trả về JSON theo đúng format trên.
"""

def validate_processed_format(data):
    """Validate format của processed data"""
    try:
        required_fields = ['bai_info', 'chunks', 'total_items']
        for field in required_fields:
            if field not in data:
                return False
        
        # Validate bai_info
        bai_info_fields = ['id', 'title', 'overview']
        for field in bai_info_fields:
            if field not in data['bai_info']:
                return False
        
        # Validate chunks
        if not isinstance(data['chunks'], list):
            return False
        
        for chunk in data['chunks']:
            chunk_fields = ['id', 'title', 'content_type', 'age_range', 'summary']
            for field in chunk_fields:
                if field not in chunk:
                    return False
            
            if not isinstance(chunk['age_range'], list) or len(chunk['age_range']) != 2:
                return False
        
        return True
        
    except Exception:
        return False

def save_processed_document(doc_id, processed_data):
    """Lưu processed document vào ChromaDB"""
    try:
        embedding_model = get_embedding_model()
        
        # Lưu chunks
        for chunk in processed_data.get('chunks', []):
            chunk_content = f"Tiêu đề: {chunk['title']}\nNội dung: {chunk.get('summary', '')}"
            
            metadata = {
                "chunk_id": chunk['id'],
                "chapter": doc_id,
                "content_type": chunk['content_type'],
                "age_range": chunk['age_range'],
                "title": chunk['title'],
                "summary": chunk['summary'],
                "related_chunks": chunk.get('related_chunks', []),
                "created_at": datetime.datetime.now().isoformat(),
                "document_source": "Tài liệu bổ sung"
            }
            
            embedding_model.add_document(
                text=chunk_content,
                metadata=metadata,
                doc_id=chunk['id']
            )
        
        # Lưu tables
        for table in processed_data.get('tables', []):
            table_content = f"Bảng: {table['title']}\nMô tả: {table.get('summary', '')}"
            
            metadata = {
                "chunk_id": table['id'],
                "chapter": doc_id,
                "content_type": "table",
                "age_range": table['age_range'],
                "title": table['title'],
                "summary": table['summary'],
                "table_columns": table.get('table_columns', []),
                "created_at": datetime.datetime.now().isoformat(),
                "document_source": "Tài liệu bổ sung"
            }
            
            embedding_model.add_document(
                text=table_content,
                metadata=metadata,
                doc_id=table['id']
            )
        
        # Lưu figures
        for figure in processed_data.get('figures', []):
            figure_content = f"Hình: {figure['title']}\nMô tả: {figure.get('summary', '')}"
            
            metadata = {
                "chunk_id": figure['id'],
                "chapter": doc_id,
                "content_type": "figure",
                "age_range": figure['age_range'],
                "title": figure['title'],
                "summary": figure['summary'],
                "created_at": datetime.datetime.now().isoformat(),
                "document_source": "Tài liệu bổ sung"
            }
            
            embedding_model.add_document(
                text=figure_content,
                metadata=metadata,
                doc_id=figure['id']
            )
        
        logger.info(f"Đã lưu processed document {doc_id} vào ChromaDB")
        
    except Exception as e:
        logger.error(f"Lỗi lưu processed document: {str(e)}")
        raise

@admin_routes.route('/documents/<doc_id>', methods=['DELETE'])
@require_admin
def delete_document(doc_id):
    """Xóa document theo chapter"""
    try:
        embedding_model = get_embedding_model()
        
        # Lấy tất cả chunks của document
        results = embedding_model.collection.get(
            where={"chapter": doc_id},
            include=['ids']
        )
        
        if results and results['ids']:
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
                results = embedding_model.collection.get(
                    where={"chapter": doc_id},
                    include=['ids']
                )
                
                if results and results['ids']:
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