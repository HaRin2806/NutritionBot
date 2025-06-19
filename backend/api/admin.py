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
        
        # Tạo document record
        document_id = f"upload_{int(datetime.datetime.now().timestamp())}"
        
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
                    max_output_tokens=10000
                )
            )
            
            if not response or not response.text:
                return jsonify({
                    "success": False,
                    "error": "Gemini không trả về response"
                }), 500
                
            result_text = response.text.strip()
            logger.info(f"Got response from Gemini: {len(result_text)} characters")
            
        except Exception as gemini_error:
            logger.error(f"Lỗi gọi Gemini API: {gemini_error}")
            return jsonify({
                "success": False,
                "error": f"Lỗi gọi AI API: {str(gemini_error)}"
            }), 500
        
        # Parse JSON response
        try:
            # Làm sạch JSON response
            if result_text.startswith('```json'):
                result_text = result_text.replace('```json', '').replace('```', '').strip()
            elif result_text.startswith('```'):
                result_text = result_text[3:].rstrip('```').strip()
            
            processed_data = json.loads(result_text)
            logger.info("Successfully parsed JSON response")
            
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON decode error: {json_error}")
            logger.error(f"Raw response: {result_text}")
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
            "document_id": doc_id
        })
        
    except Exception as e:
        logger.error(f"Lỗi xử lý document: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi xử lý: {str(e)}"
        }), 500

def create_document_processing_prompt(pdf_text):
    """Tạo prompt chi tiết cho Gemini"""
    # Cắt ngắn text để tránh vượt quá limit
    max_text_length = 8000
    if len(pdf_text) > max_text_length:
        pdf_text = pdf_text[:max_text_length] + "..."
    
    prompt = f"""
Bạn là một chuyên gia phân tích tài liệu dinh dưỡng. Nhiệm vụ của bạn là phân tích và chia nhỏ tài liệu PDF về dinh dưỡng thành các phần có nghĩa.

TÁCH LIỆU CẦN XỬ LÝ:
{pdf_text}

YÊU CẦU PHÂN TÍCH:

1. PHÂN CHIA NỘI DUNG:
   - Chia tài liệu thành các chunk có nghĩa (mỗi chunk 200-500 từ)
   - Bạn phải giữ nguyên nội dung chunk và trả lại nội dung chunk đó, không được thay đổi ý nghĩa
   - Mỗi chunk phải có tiêu đề rõ ràng
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

{{
    "bai_info": {{
        "id": "bosungX",
        "title": "Tiêu đề tài liệu bổ sung",
        "pages": "trang áp dụng",
        "overview": "Tổng quan tài liệu"
    }},
    "chunks": [
        {{
            "id": "bosungX_mucY_Z",
            "title": "Tiêu đề chunk",
            "content_type": "text",
            "age_range": [1, 19],
            "pages": "trang",
            "related_chunks": [],
            "summary": "Tóm tắt nội dung",
            "word_count": 100,
            "token_count": 150,
            "contains_table": false,
            "contains_figure": false
        }}
    ],
    "tables": [
        {{
            "id": "bosungX_bangY",
            "title": "Tiêu đề bảng",
            "content_type": "table",
            "age_range": [1, 19],
            "pages": "trang",
            "related_chunks": [],
            "table_columns": ["cột1", "cột2"],
            "summary": "Mô tả bảng",
            "word_count": 50,
            "token_count": 75
        }}
    ],
    "figures": [
        {{
            "id": "bosungX_hinhY",
            "title": "Tiêu đề hình",
            "content_type": "figure",
            "age_range": [1, 19],
            "pages": "trang",
            "related_chunks": [],
            "summary": "Mô tả hình ảnh"
        }}
    ],
    "total_items": {{
        "chunks": 1,
        "tables": 1,
        "figures": 1
    }},
    "document_source": "Tài liệu bổ sung"
}}

LUU Ý QUAN TRỌNG:
- Đảm bảo JSON format hoàn toàn chính xác
- Không thêm bất kỳ text nào ngoài JSON
- age_range phải là array 2 số nguyên từ 1 đến 19
- Tất cả field bắt buộc phải có
- related_chunks phải là array string
- Phân tích kỹ nội dung để xác định độ tuổi phù hợp

Hãy phân tích và trả về JSON theo đúng format trên.
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
    """Lưu processed document vào ChromaDB"""
    try:
        embedding_model = get_embedding_model()
        
        # Chuẩn bị tất cả items để index
        all_items = []
        
        # Xử lý chunks
        for chunk in processed_data.get('chunks', []):
            # Tạo content đầy đủ
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
                "document_source": "Tài liệu upload"
            }
            
            # Thêm vào danh sách
            all_items.append({
                "content": chunk_content,
                "metadata": metadata,
                "id": chunk['id']
            })
        
        # Xử lý tables
        for table in processed_data.get('tables', []):
            table_content = f"Bảng: {table['title']}\nMô tả: {table.get('summary', '')}"
            
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
                "document_source": "Tài liệu upload"
            }
            
            all_items.append({
                "content": table_content,
                "metadata": metadata,
                "id": table['id']
            })
        
        # Xử lý figures
        for figure in processed_data.get('figures', []):
            figure_content = f"Hình: {figure['title']}\nMô tả: {figure.get('summary', '')}"
            
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
                "document_source": "Tài liệu upload"
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
                logger.info(f"Successfully indexed {len(all_items)} items for document {doc_id}")
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