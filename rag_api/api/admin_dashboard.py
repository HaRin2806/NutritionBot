from flask import Blueprint, request, jsonify
import logging
import datetime
from bson.objectid import ObjectId
from models.user_model import User
from models.conversation_model import Conversation
from models.admin_model import AdminUser
from api.admin_auth import admin_required
from core.embedding_model import get_embedding_model
from core.data_processor import DataProcessor
import os

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
admin_dashboard_routes = Blueprint('admin_dashboard', __name__)

@admin_dashboard_routes.route('/stats/overview', methods=['GET'])
@admin_required()
def get_overview_stats():
    """API endpoint để lấy thống kê tổng quan"""
    try:
        # Thống kê người dùng
        user_stats = User.get_stats() if hasattr(User, 'get_stats') else {
            "total_users": 0,
            "active_users": 0,
            "new_users_today": 0
        }
        
        # Thống kê cuộc hội thoại
        conversation_stats = Conversation.get_stats()
        
        # Thống kê dữ liệu embedding
        try:
            embedding_model = get_embedding_model()
            embedding_count = embedding_model.count()
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê embedding: {e}")
            embedding_count = 0
        
        # Thống kê dữ liệu được xử lý
        try:
            data_processor = DataProcessor()
            data_stats = data_processor.get_stats()
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê data: {e}")
            data_stats = {
                "total_chunks": 0,
                "total_tables": 0,
                "total_figures": 0,
                "total_items": 0
            }
        
        # Thống kê admin
        try:
            admins, total_admins = AdminUser.get_all(page=1, per_page=1)
        except Exception as e:
            logger.error(f"Lỗi lấy thống kê admin: {e}")
            total_admins = 0
        
        # Thống kê hệ thống
        system_stats = {
            "server_uptime": "N/A",  # Có thể implement sau
            "database_size": "N/A",  # Có thể implement sau
            "api_version": "1.0.0"
        }
        
        return jsonify({
            "success": True,
            "stats": {
                "users": {
                    "total": user_stats.get("total_users", 0),
                    "active": user_stats.get("active_users", 0),
                    "new_today": user_stats.get("new_users_today", 0)
                },
                "conversations": {
                    "total": conversation_stats.get("total_conversations", 0),
                    "avg_messages": conversation_stats.get("avg_messages_per_conversation", 0),
                    "recent": conversation_stats.get("recent_conversations", 0)
                },
                "data": {
                    "total_chunks": data_stats.get("total_chunks", 0),
                    "total_tables": data_stats.get("total_tables", 0),
                    "total_figures": data_stats.get("total_figures", 0),
                    "total_items": data_stats.get("total_items", 0),
                    "embeddings": embedding_count
                },
                "admins": {
                    "total": total_admins
                },
                "system": system_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê tổng quan: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_dashboard_routes.route('/stats/users', methods=['GET'])
@admin_required(resource="analytics", action="read")
def get_user_stats():
    """API endpoint để lấy thống kê chi tiết về người dùng"""
    try:
        from models.user_model import get_db
        
        db = get_db()
        users_collection = db.users
        
        # Thống kê tổng quan
        total_users = users_collection.count_documents({})
        
        # Thống kê theo thời gian (7 ngày gần nhất)
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=7)
        
        daily_stats = []
        for i in range(7):
            day_start = start_date + datetime.timedelta(days=i)
            day_end = day_start + datetime.timedelta(days=1)
            
            new_users = users_collection.count_documents({
                "created_at": {"$gte": day_start, "$lt": day_end}
            })
            
            daily_stats.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "new_users": new_users
            })
        
        # Thống kê theo giới tính
        gender_stats = list(users_collection.aggregate([
            {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Top users theo số cuộc hội thoại
        top_users = list(db.conversations.aggregate([
            {"$group": {"_id": "$user_id", "conversation_count": {"$sum": 1}}},
            {"$sort": {"conversation_count": -1}},
            {"$limit": 10},
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
        
        return jsonify({
            "success": True,
            "stats": {
                "total_users": total_users,
                "daily_stats": daily_stats,
                "gender_distribution": gender_stats,
                "top_users": top_users
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_dashboard_routes.route('/stats/conversations', methods=['GET'])
@admin_required(resource="analytics", action="read")
def get_conversation_stats():
    """API endpoint để lấy thống kê chi tiết về cuộc hội thoại"""
    try:
        from models.conversation_model import get_db
        
        db = get_db()
        conversations_collection = db.conversations
        
        # Thống kê tổng quan
        total_conversations = conversations_collection.count_documents({})
        
        # Thống kê theo độ tuổi
        age_stats = list(conversations_collection.aggregate([
            {"$group": {"_id": "$age_context", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]))
        
        # Thống kê theo thời gian (7 ngày gần nhất)
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=7)
        
        daily_conversations = []
        for i in range(7):
            day_start = start_date + datetime.timedelta(days=i)
            day_end = day_start + datetime.timedelta(days=1)
            
            new_conversations = conversations_collection.count_documents({
                "created_at": {"$gte": day_start, "$lt": day_end}
            })
            
            daily_conversations.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "new_conversations": new_conversations
            })
        
        # Thống kê số tin nhắn
        message_stats = list(conversations_collection.aggregate([
            {"$project": {"message_count": {"$size": "$messages"}}},
            {"$group": {
                "_id": None,
                "avg_messages": {"$avg": "$message_count"},
                "max_messages": {"$max": "$message_count"},
                "min_messages": {"$min": "$message_count"},
                "total_messages": {"$sum": "$message_count"}
            }}
        ]))
        
        # Cuộc hội thoại có nhiều tin nhắn nhất
        top_conversations = list(conversations_collection.aggregate([
            {"$project": {
                "title": 1,
                "user_id": 1,
                "message_count": {"$size": "$messages"},
                "created_at": 1
            }},
            {"$sort": {"message_count": -1}},
            {"$limit": 10}
        ]))
        
        return jsonify({
            "success": True,
            "stats": {
                "total_conversations": total_conversations,
                "age_distribution": age_stats,
                "daily_stats": daily_conversations,
                "message_stats": message_stats[0] if message_stats else {},
                "top_conversations": top_conversations
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_dashboard_routes.route('/stats/system', methods=['GET'])
@admin_required(resource="system", action="read")
def get_system_stats():
    """API endpoint để lấy thống kê hệ thống"""
    try:
        import psutil
        import platform
        
        # Thông tin hệ thống
        system_info = {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "hostname": platform.node(),
            "processor": platform.processor()
        }
        
        # Thông tin CPU
        cpu_info = {
            "physical_cores": psutil.cpu_count(logical=False),
            "total_cores": psutil.cpu_count(logical=True),
            "max_frequency": f"{psutil.cpu_freq().max:.2f}Mhz" if psutil.cpu_freq() else "N/A",
            "current_frequency": f"{psutil.cpu_freq().current:.2f}Mhz" if psutil.cpu_freq() else "N/A",
            "cpu_usage": f"{psutil.cpu_percent()}%"
        }
        
        # Thông tin bộ nhớ
        svmem = psutil.virtual_memory()
        memory_info = {
            "total": f"{svmem.total / (1024**3):.2f} GB",
            "available": f"{svmem.available / (1024**3):.2f} GB",
            "used": f"{svmem.used / (1024**3):.2f} GB",
            "percentage": f"{svmem.percent}%"
        }
        
        # Thông tin ổ đĩa
        disk_info = []
        partitions = psutil.disk_partitions()
        for partition in partitions:
            try:
                partition_usage = psutil.disk_usage(partition.mountpoint)
                disk_info.append({
                    "device": partition.device,
                    "mountpoint": partition.mountpoint,
                    "file_system": partition.fstype,
                    "total": f"{partition_usage.total / (1024**3):.2f} GB",
                    "used": f"{partition_usage.used / (1024**3):.2f} GB",
                    "free": f"{partition_usage.free / (1024**3):.2f} GB",
                    "percentage": f"{(partition_usage.used / partition_usage.total) * 100:.1f}%"
                })
            except PermissionError:
                continue
        
        # Thông tin mạng
        try:
            net_io = psutil.net_io_counters()
            network_info = {
                "bytes_sent": f"{net_io.bytes_sent / (1024**2):.2f} MB",
                "bytes_received": f"{net_io.bytes_recv / (1024**2):.2f} MB",
                "packets_sent": net_io.packets_sent,
                "packets_received": net_io.packets_recv
            }
        except:
            network_info = {"error": "Không thể lấy thông tin mạng"}
        
        # Thông tin database
        try:
            from models.user_model import get_db
            db = get_db()
            db_stats = db.command("dbstats")
            
            database_info = {
                "collections": db_stats.get("collections", 0),
                "documents": db_stats.get("objects", 0),
                "data_size": f"{db_stats.get('dataSize', 0) / (1024**2):.2f} MB",
                "storage_size": f"{db_stats.get('storageSize', 0) / (1024**2):.2f} MB",
                "indexes": db_stats.get("indexes", 0),
                "index_size": f"{db_stats.get('indexSize', 0) / (1024**2):.2f} MB"
            }
        except Exception as e:
            database_info = {"error": f"Không thể lấy thông tin database: {str(e)}"}
        
        return jsonify({
            "success": True,
            "stats": {
                "system": system_info,
                "cpu": cpu_info,
                "memory": memory_info,
                "disk": disk_info,
                "network": network_info,
                "database": database_info
            }
        })
        
    except ImportError:
        return jsonify({
            "success": False,
            "error": "Cần cài đặt psutil để lấy thông tin hệ thống: pip install psutil"
        }), 500
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê hệ thống: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_dashboard_routes.route('/recent-activities', methods=['GET'])
@admin_required()
def get_recent_activities():
    """API endpoint để lấy hoạt động gần đây"""
    try:
        limit = int(request.args.get('limit', 20))
        
        activities = []
        
        # Người dùng mới đăng ký
        try:
            from models.user_model import get_db
            db = get_db()
            recent_users = list(db.users.find(
                {},
                {"name": 1, "email": 1, "created_at": 1}
            ).sort("created_at", -1).limit(5))
            
            for user in recent_users:
                activities.append({
                    "type": "user_registered",
                    "title": "Người dùng mới đăng ký",
                    "description": f"{user['name']} ({user['email']}) đã đăng ký tài khoản",
                    "timestamp": user['created_at'].isoformat(),
                    "icon": "user-plus",
                    "color": "green"
                })
        except Exception as e:
            logger.error(f"Lỗi lấy user activities: {e}")
        
        # Cuộc hội thoại mới
        try:
            from models.conversation_model import get_db
            db = get_db()
            recent_conversations = list(db.conversations.find(
                {},
                {"title": 1, "user_id": 1, "created_at": 1}
            ).sort("created_at", -1).limit(5))
            
            for conv in recent_conversations:
                activities.append({
                    "type": "conversation_created",
                    "title": "Cuộc hội thoại mới",
                    "description": f"Cuộc hội thoại '{conv['title']}' được tạo",
                    "timestamp": conv['created_at'].isoformat(),
                    "icon": "message-circle",
                    "color": "blue"
                })
        except Exception as e:
            logger.error(f"Lỗi lấy conversation activities: {e}")
        
        # Sắp xếp theo thời gian và giới hạn số lượng
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:limit]
        
        return jsonify({
            "success": True,
            "activities": activities
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy hoạt động gần đây: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_dashboard_routes.route('/alerts', methods=['GET'])
@admin_required()
def get_system_alerts():
    """API endpoint để lấy cảnh báo hệ thống"""
    try:
        alerts = []
        
        # Kiểm tra dung lượng ổ đĩa
        try:
            import psutil
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    used_percent = (usage.used / usage.total) * 100
                    
                    if used_percent > 90:
                        alerts.append({
                            "type": "warning",
                            "title": "Dung lượng ổ đĩa thấp",
                            "message": f"Ổ đĩa {partition.device} đã sử dụng {used_percent:.1f}%",
                            "severity": "high" if used_percent > 95 else "medium"
                        })
                except:
                    continue
        except ImportError:
            pass
        
        # Kiểm tra bộ nhớ
        try:
            import psutil
            memory = psutil.virtual_memory()
            if memory.percent > 85:
                alerts.append({
                    "type": "warning",
                    "title": "Bộ nhớ cao",
                    "message": f"Sử dụng bộ nhớ: {memory.percent}%",
                    "severity": "high" if memory.percent > 95 else "medium"
                })
        except ImportError:
            pass
        
        # Kiểm tra số lượng người dùng online (giả lập)
        try:
            from models.user_model import get_db
            db = get_db()
            total_users = db.users.count_documents({})
            
            if total_users > 1000:  # Ngưỡng cảnh báo
                alerts.append({
                    "type": "info",
                    "title": "Lượng người dùng cao",
                    "message": f"Hiện có {total_users} người dùng đã đăng ký",
                    "severity": "low"
                })
        except Exception as e:
            alerts.append({
                "type": "error",
                "title": "Lỗi kết nối database",
                "message": f"Không thể kết nối database: {str(e)}",
                "severity": "high"
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