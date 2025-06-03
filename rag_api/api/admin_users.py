from flask import Blueprint, request, jsonify
import logging
import datetime
from bson.objectid import ObjectId
from models.user_model import User, get_db
from models.conversation_model import Conversation
from api.admin_auth import admin_required

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
admin_users_routes = Blueprint('admin_users', __name__)

@admin_users_routes.route('/users', methods=['GET'])
@admin_required(resource="users", action="read")
def get_all_users():
    """API endpoint để lấy danh sách tất cả người dùng"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        gender_filter = request.args.get('gender', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        db = get_db()
        users_collection = db.users
        
        # Tạo query filter
        query_filter = {}
        if search:
            query_filter["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        if gender_filter:
            query_filter["gender"] = gender_filter
        
        # Tính toán offset
        skip = (page - 1) * per_page
        
        # Xác định sort direction
        sort_direction = -1 if sort_order == 'desc' else 1
        
        # Lấy danh sách users
        users_cursor = users_collection.find(query_filter).sort(sort_by, sort_direction).skip(skip).limit(per_page)
        
        # Đếm tổng số users
        total_users = users_collection.count_documents(query_filter)
        
        # Chuẩn bị dữ liệu response
        users_list = []
        for user_data in users_cursor:
            # Đếm số conversations của user
            conversation_count = db.conversations.count_documents({"user_id": user_data["_id"]})
            
            # Lấy conversation gần nhất
            latest_conversation = db.conversations.find_one(
                {"user_id": user_data["_id"]},
                sort=[("updated_at", -1)]
            )
            
            user_info = {
                "id": str(user_data["_id"]),
                "name": user_data.get("name", ""),
                "email": user_data.get("email", ""),
                "gender": user_data.get("gender", ""),
                "created_at": user_data.get("created_at").isoformat() if user_data.get("created_at") else None,
                "updated_at": user_data.get("updated_at").isoformat() if user_data.get("updated_at") else None,
                "conversation_count": conversation_count,
                "last_activity": latest_conversation.get("updated_at").isoformat() if latest_conversation and latest_conversation.get("updated_at") else None
            }
            users_list.append(user_info)
        
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

@admin_users_routes.route('/users/<user_id>', methods=['GET'])
@admin_required(resource="users", action="read")
def get_user_detail(user_id):
    """API endpoint để lấy chi tiết một user"""
    try:
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        # Lấy thống kê conversations của user
        db = get_db()
        user_conversations = list(db.conversations.find(
            {"user_id": ObjectId(user_id)},
            {"title": 1, "created_at": 1, "updated_at": 1, "age_context": 1, "messages": 1}
        ).sort("updated_at", -1))
        
        # Tính toán thống kê
        conversation_stats = {
            "total_conversations": len(user_conversations),
            "total_messages": sum(len(conv.get("messages", [])) for conv in user_conversations),
            "avg_messages_per_conversation": 0,
            "most_recent_conversation": None,
            "age_distribution": {}
        }
        
        if user_conversations:
            conversation_stats["avg_messages_per_conversation"] = conversation_stats["total_messages"] / len(user_conversations)
            conversation_stats["most_recent_conversation"] = user_conversations[0].get("updated_at").isoformat() if user_conversations[0].get("updated_at") else None
            
            # Thống kê theo độ tuổi
            age_counts = {}
            for conv in user_conversations:
                age = conv.get("age_context")
                if age:
                    age_counts[age] = age_counts.get(age, 0) + 1
            conversation_stats["age_distribution"] = age_counts
        
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
                for conv in user_conversations[:10]  # 10 conversations gần nhất
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

@admin_users_routes.route('/users/<user_id>', methods=['PUT'])
@admin_required(resource="users", action="write")
def update_user(user_id):
    """API endpoint để cập nhật thông tin user"""
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
        
        # Lưu thay đổi
        user.save()
        
        return jsonify({
            "success": True,
            "message": "Cập nhật thông tin người dùng thành công"
        })
        
    except Exception as e:
        logger.error(f"Lỗi cập nhật user: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_users_routes.route('/users/<user_id>', methods=['DELETE'])
@admin_required(resource="users", action="delete")
def delete_user(user_id):
    """API endpoint để xóa user và tất cả data liên quan"""
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

@admin_users_routes.route('/users/bulk-delete', methods=['POST'])
@admin_required(resource="users", action="delete")
def bulk_delete_users():
    """API endpoint để xóa nhiều users cùng lúc"""
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

@admin_users_routes.route('/users/<user_id>/conversations', methods=['GET'])
@admin_required(resource="users", action="read")
def get_user_conversations(user_id):
    """API endpoint để lấy danh sách conversations của một user"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Kiểm tra user có tồn tại không
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        # Lấy conversations của user
        skip = (page - 1) * per_page
        
        db = get_db()
        conversations_cursor = db.conversations.find(
            {"user_id": ObjectId(user_id)}
        ).sort("updated_at", -1).skip(skip).limit(per_page)
        
        total_conversations = db.conversations.count_documents({"user_id": ObjectId(user_id)})
        
        conversations_list = []
        for conv in conversations_cursor:
            conversations_list.append({
                "id": str(conv["_id"]),
                "title": conv.get("title", ""),
                "created_at": conv.get("created_at").isoformat() if conv.get("created_at") else None,
                "updated_at": conv.get("updated_at").isoformat() if conv.get("updated_at") else None,
                "age_context": conv.get("age_context"),
                "message_count": len(conv.get("messages", [])),
                "is_archived": conv.get("is_archived", False)
            })
        
        return jsonify({
            "success": True,
            "conversations": conversations_list,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_conversations,
                "pages": (total_conversations + per_page - 1) // per_page
            },
            "user": {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy conversations của user: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_users_routes.route('/users/<user_id>/conversations/<conversation_id>', methods=['DELETE'])
@admin_required(resource="conversations", action="delete")
def delete_user_conversation(user_id, conversation_id):
    """API endpoint để xóa một conversation cụ thể của user"""
    try:
        # Kiểm tra user có tồn tại không
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy người dùng"
            }), 404
        
        # Kiểm tra conversation có thuộc về user này không
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Cuộc hội thoại không thuộc về người dùng này"
            }), 400
        
        # Xóa conversation
        conversation.delete()
        
        return jsonify({
            "success": True,
            "message": "Đã xóa cuộc hội thoại"
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa conversation của user: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_users_routes.route('/users/export', methods=['GET'])
@admin_required(resource="users", action="read")
def export_users():
    """API endpoint để xuất danh sách users ra CSV"""
    try:
        import csv
        from io import StringIO
        
        # Lấy parameters
        format_type = request.args.get('format', 'csv')  # csv hoặc json
        include_stats = request.args.get('include_stats', 'false').lower() == 'true'
        
        db = get_db()
        users_cursor = db.users.find({})
        
        if format_type == 'csv':
            output = StringIO()
            writer = csv.writer(output)
            
            # Headers
            headers = ['ID', 'Tên', 'Email', 'Giới tính', 'Ngày tạo', 'Ngày cập nhật']
            if include_stats:
                headers.extend(['Số cuộc hội thoại', 'Hoạt động gần nhất'])
            
            writer.writerow(headers)
            
            # Data rows
            for user_data in users_cursor:
                row = [
                    str(user_data["_id"]),
                    user_data.get("name", ""),
                    user_data.get("email", ""),
                    user_data.get("gender", ""),
                    user_data.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if user_data.get("created_at") else "",
                    user_data.get("updated_at").strftime("%Y-%m-%d %H:%M:%S") if user_data.get("updated_at") else ""
                ]
                
                if include_stats:
                    # Đếm conversations
                    conv_count = db.conversations.count_documents({"user_id": user_data["_id"]})
                    
                    # Lấy hoạt động gần nhất
                    latest_conv = db.conversations.find_one(
                        {"user_id": user_data["_id"]},
                        sort=[("updated_at", -1)]
                    )
                    last_activity = latest_conv.get("updated_at").strftime("%Y-%m-%d %H:%M:%S") if latest_conv and latest_conv.get("updated_at") else "Chưa có"
                    
                    row.extend([conv_count, last_activity])
                
                writer.writerow(row)
            
            output.seek(0)
            
            from flask import Response
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-disposition": "attachment; filename=users_export.csv"}
            )
        
        elif format_type == 'json':
            users_list = []
            for user_data in users_cursor:
                user_info = {
                    "id": str(user_data["_id"]),
                    "name": user_data.get("name", ""),
                    "email": user_data.get("email", ""),
                    "gender": user_data.get("gender", ""),
                    "created_at": user_data.get("created_at").isoformat() if user_data.get("created_at") else None,
                    "updated_at": user_data.get("updated_at").isoformat() if user_data.get("updated_at") else None
                }
                
                if include_stats:
                    conv_count = db.conversations.count_documents({"user_id": user_data["_id"]})
                    latest_conv = db.conversations.find_one(
                        {"user_id": user_data["_id"]},
                        sort=[("updated_at", -1)]
                    )
                    
                    user_info["stats"] = {
                        "conversation_count": conv_count,
                        "last_activity": latest_conv.get("updated_at").isoformat() if latest_conv and latest_conv.get("updated_at") else None
                    }
                
                users_list.append(user_info)
            
            return jsonify({
                "success": True,
                "users": users_list,
                "exported_at": datetime.datetime.now().isoformat(),
                "total_users": len(users_list)
            })
        
        else:
            return jsonify({
                "success": False,
                "error": "Format không hỗ trợ. Chỉ hỗ trợ 'csv' hoặc 'json'"
            }), 400
        
    except Exception as e:
        logger.error(f"Lỗi export users: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_users_routes.route('/users/stats/summary', methods=['GET'])
@admin_required(resource="analytics", action="read")
def get_users_summary_stats():
    """API endpoint để lấy thống kê tóm tắt về users"""
    try:
        db = get_db()
        
        # Thống kê cơ bản
        total_users = db.users.count_documents({})
        
        # Users đăng ký trong 30 ngày qua
        thirty_days_ago = datetime.datetime.now() - datetime.timedelta(days=30)
        new_users_30d = db.users.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Users đăng ký trong 7 ngày qua
        seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)
        new_users_7d = db.users.count_documents({
            "created_at": {"$gte": seven_days_ago}
        })
        
        # Users đăng ký hôm nay
        today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        new_users_today = db.users.count_documents({
            "created_at": {"$gte": today_start}
        })
        
        # Thống kê theo giới tính
        gender_stats = list(db.users.aggregate([
            {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Thống kê users có hoạt động (có ít nhất 1 conversation)
        active_users = len(list(db.conversations.distinct("user_id")))
        
        # Top 5 users có nhiều conversations nhất
        top_active_users = list(db.conversations.aggregate([
            {"$group": {"_id": "$user_id", "conversation_count": {"$sum": 1}}},
            {"$sort": {"conversation_count": -1}},
            {"$limit": 5},
            {"$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "_id",
                "as": "user_info"
            }},
            {"$unwind": "$user_info"},
            {"$project": {
                "user_id": "$_id",
                "name": "$user_info.name",
                "email": "$user_info.email",
                "conversation_count": 1
            }}
        ]))
        
        # Tính tỷ lệ tăng trưởng
        growth_rate_7d = 0
        growth_rate_30d = 0
        
        if total_users > 0:
            growth_rate_7d = (new_users_7d / total_users) * 100
            growth_rate_30d = (new_users_30d / total_users) * 100
        
        return jsonify({
            "success": True,
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": total_users - active_users,
                "new_users": {
                    "today": new_users_today,
                    "last_7_days": new_users_7d,
                    "last_30_days": new_users_30d
                },
                "growth_rates": {
                    "weekly": round(growth_rate_7d, 2),
                    "monthly": round(growth_rate_30d, 2)
                },
                "gender_distribution": [
                    {
                        "gender": stat["_id"] if stat["_id"] else "Không xác định",
                        "count": stat["count"],
                        "percentage": round((stat["count"] / total_users) * 100, 1) if total_users > 0 else 0
                    }
                    for stat in gender_stats
                ],
                "top_active_users": [
                    {
                        "user_id": str(user["user_id"]),
                        "name": user["name"],
                        "email": user["email"],
                        "conversation_count": user["conversation_count"]
                    }
                    for user in top_active_users
                ]
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê users: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_users_routes.route('/users/search', methods=['GET'])
@admin_required(resource="users", action="read")
def search_users():
    """API endpoint để tìm kiếm users nâng cao"""
    try:
        # Lấy parameters
        query = request.args.get('q', '')
        search_type = request.args.get('type', 'all')  # all, name, email
        gender = request.args.get('gender', '')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        has_conversations = request.args.get('has_conversations', '')
        limit = int(request.args.get('limit', 50))
        
        if not query and not gender and not date_from and not has_conversations:
            return jsonify({
                "success": False,
                "error": "Cần ít nhất một tiêu chí tìm kiếm"
            }), 400
        
        db = get_db()
        
        # Xây dựng query filter
        search_filter = {}
        
        # Text search
        if query:
            if search_type == 'name':
                search_filter["name"] = {"$regex": query, "$options": "i"}
            elif search_type == 'email':
                search_filter["email"] = {"$regex": query, "$options": "i"}
            else:  # all
                search_filter["$or"] = [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"email": {"$regex": query, "$options": "i"}}
                ]
        
        # Gender filter
        if gender:
            search_filter["gender"] = gender
        
        # Date range filter
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_filter["$lte"] = datetime.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            search_filter["created_at"] = date_filter
        
        # Tìm kiếm users
        users_cursor = db.users.find(search_filter).limit(limit)
        
        results = []
        for user_data in users_cursor:
            # Đếm conversations nếu cần
            conversation_count = 0
            last_activity = None
            
            if has_conversations != '':
                conversation_count = db.conversations.count_documents({"user_id": user_data["_id"]})
                
                # Nếu filter theo has_conversations và không thỏa mãn, skip
                if has_conversations == 'true' and conversation_count == 0:
                    continue
                elif has_conversations == 'false' and conversation_count > 0:
                    continue
                
                # Lấy hoạt động gần nhất
                latest_conv = db.conversations.find_one(
                    {"user_id": user_data["_id"]},
                    sort=[("updated_at", -1)]
                )
                if latest_conv and latest_conv.get("updated_at"):
                    last_activity = latest_conv["updated_at"].isoformat()
            
            user_result = {
                "id": str(user_data["_id"]),
                "name": user_data.get("name", ""),
                "email": user_data.get("email", ""),
                "gender": user_data.get("gender", ""),
                "created_at": user_data.get("created_at").isoformat() if user_data.get("created_at") else None,
                "conversation_count": conversation_count,
                "last_activity": last_activity
            }
            results.append(user_result)
        
        return jsonify({
            "success": True,
            "results": results,
            "total_found": len(results),
            "search_params": {
                "query": query,
                "search_type": search_type,
                "gender": gender,
                "date_from": date_from,
                "date_to": date_to,
                "has_conversations": has_conversations
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi tìm kiếm users: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500