from flask import Blueprint, request, jsonify
import logging
import datetime
import os
from bson.objectid import ObjectId
from models.user_model import User
from models.conversation_model import get_db, Conversation
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

logger = logging.getLogger(__name__)

# Tạo blueprint
admin_routes = Blueprint('admin', __name__)

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
    """Lấy danh sách người dùng"""
    try:
        db = get_db()
        users_collection = db.users
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        gender_filter = request.args.get('gender', '')
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
        
        # Pagination
        skip = (page - 1) * per_page
        sort_direction = -1 if sort_order == 'desc' else 1
        
        users_cursor = users_collection.find(query_filter).sort(sort_by, sort_direction).skip(skip).limit(per_page)
        total_users = users_collection.count_documents(query_filter)
        
        users_list = []
        for user_data in users_cursor:
            conversation_count = db.conversations.count_documents({"user_id": user_data["_id"]})
            latest_conversation = db.conversations.find_one(
                {"user_id": user_data["_id"]},
                sort=[("updated_at", -1)]
            )
            
            users_list.append({
                "id": str(user_data["_id"]),
                "name": user_data.get("name", ""),
                "email": user_data.get("email", ""),
                "gender": user_data.get("gender", ""),
                "created_at": user_data.get("created_at").isoformat() if user_data.get("created_at") else None,
                "updated_at": user_data.get("updated_at").isoformat() if user_data.get("updated_at") else None,
                "conversation_count": conversation_count,
                "last_activity": latest_conversation.get("updated_at").isoformat() if latest_conversation and latest_conversation.get("updated_at") else None
            })
        
        return jsonify({
            "success": True,
            "users": users_list,
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
    """Lấy chi tiết người dùng"""
    try:
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        db = get_db()
        user_conversations = list(db.conversations.find(
            {"user_id": ObjectId(user_id)},
            {"title": 1, "created_at": 1, "updated_at": 1, "age_context": 1, "messages": 1}
        ).sort("updated_at", -1))
        
        conversation_stats = {
            "total_conversations": len(user_conversations),
            "total_messages": sum(len(conv.get("messages", [])) for conv in user_conversations),
            "avg_messages_per_conversation": 0,
            "most_recent_conversation": None
        }
        
        if user_conversations:
            conversation_stats["avg_messages_per_conversation"] = conversation_stats["total_messages"] / len(user_conversations)
            conversation_stats["most_recent_conversation"] = user_conversations[0].get("updated_at").isoformat() if user_conversations[0].get("updated_at") else None
        
        user_detail = {
            "id": str(user.user_id),
            "name": user.name,
            "email": user.email,
            "gender": user.gender,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "stats": conversation_stats,
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
    """Lấy danh sách tài liệu"""
    try:
        # Mock documents data - có thể thay thế bằng logic thực tế từ data processor
        documents = [
            {
                "id": "doc1",
                "title": "Hướng dẫn dinh dưỡng trẻ em",
                "description": "Tài liệu hướng dẫn dinh dưỡng cơ bản cho trẻ em",
                "type": "lesson",
                "status": "processed",
                "created_at": datetime.datetime.now().isoformat(),
                "content_stats": {
                    "chunks": 150,
                    "tables": 5,
                    "figures": 10
                }
            },
            {
                "id": "doc2", 
                "title": "Phụ lục dinh dưỡng",
                "description": "Bảng thành phần dinh dưỡng thực phẩm",
                "type": "appendix",
                "status": "processed", 
                "created_at": datetime.datetime.now().isoformat(),
                "content_stats": {
                    "chunks": 80,
                    "tables": 15,
                    "figures": 3
                }
            }
        ]
        
        return jsonify({
            "success": True,
            "documents": documents,
            "total": len(documents),
            "stats": {
                "processed": 2,
                "uploaded": 0,
                "total_chunks": 230,
                "total_tables": 20,
                "total_figures": 13
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy danh sách documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_routes.route('/documents/<doc_id>', methods=['DELETE'])
@require_admin
def delete_document(doc_id):
    """Xóa tài liệu"""
    try:
        # Mock delete - thay thế bằng logic thực tế
        return jsonify({
            "success": True,
            "message": f"Đã xóa tài liệu {doc_id}"
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa document: {str(e)}")
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