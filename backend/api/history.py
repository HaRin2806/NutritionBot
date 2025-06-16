from flask import Blueprint, request, jsonify
import logging
from bson.objectid import ObjectId
from models.conversation_model import Conversation
from models.user_model import User
from flask_jwt_extended import jwt_required, get_jwt_identity

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
history_routes = Blueprint('history', __name__)

# Hàm đơn giản để tạo tiêu đề từ tin nhắn
def create_title_from_message(message, max_length=50):
    """Tạo tiêu đề cuộc trò chuyện từ tin nhắn đầu tiên của người dùng"""
    # Loại bỏ ký tự xuống dòng và khoảng trắng thừa
    message = message.strip().replace('\n', ' ')
    
    # Nếu tin nhắn đủ ngắn, sử dụng làm tiêu đề luôn
    if len(message) <= max_length:
        return message
    
    # Nếu tin nhắn quá dài, cắt ngắn và thêm dấu "..."
    return message[:max_length-3] + "..."

@history_routes.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """API endpoint để lấy danh sách cuộc hội thoại của người dùng"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy tham số phân trang từ query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))  # ✅ TĂNG default per_page
        include_archived = request.args.get('include_archived', 'false').lower() == 'true'
        
        # Tính toán offset
        skip = (page - 1) * per_page
        
        logger.info(f"🔍 Getting conversations for user {user_id}, page {page}, per_page {per_page}, include_archived {include_archived}")
        
        # Lấy danh sách cuộc hội thoại
        conversations = Conversation.find_by_user(
            user_id=user_id,
            limit=per_page,
            skip=skip,
            include_archived=include_archived
        )
        
        # Đếm tổng số cuộc hội thoại
        total_count = Conversation.count_by_user(
            user_id=user_id,
            include_archived=include_archived
        )
        
        logger.info(f"📊 Found {len(conversations)} conversations, total: {total_count}")
        
        # Chuẩn bị dữ liệu phản hồi
        result = []
        for conversation in conversations:
            # Chỉ lấy tin nhắn mới nhất để hiển thị xem trước
            last_message = conversation.messages[-1]["content"] if conversation.messages else ""
            message_count = len(conversation.messages)
            
            result.append({
                "id": str(conversation.conversation_id),
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
                "age_context": conversation.age_context,
                "is_archived": conversation.is_archived,
                "last_message": last_message[:100] + "..." if len(last_message) > 100 else last_message,
                "message_count": message_count
            })
        
        logger.info(f"✅ Returning {len(result)} conversations")
        
        # Tạo phản hồi với thông tin phân trang
        return jsonify({
            "success": True,
            "conversations": result,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "pages": (total_count + per_page - 1) // per_page  # Ceiling division
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Lỗi khi lấy danh sách cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation_detail(conversation_id):
    """API endpoint để lấy chi tiết một cuộc hội thoại"""
    try:
        user_id = get_jwt_identity()
        
        def safe_datetime_to_string(dt_obj):
            """Safely convert datetime object to ISO string"""
            if dt_obj is None:
                return None
            # Nếu đã là string, return nguyên
            if isinstance(dt_obj, str):
                return dt_obj
            # Nếu là datetime object, convert sang string
            if hasattr(dt_obj, 'isoformat'):
                return dt_obj.isoformat()
            # Fallback: convert to string
            return str(dt_obj)
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền truy cập cuộc hội thoại này"
            }), 403
        
        conversation_data = {
            "id": str(conversation.conversation_id),
            "title": conversation.title,
            "created_at": safe_datetime_to_string(conversation.created_at),
            "updated_at": safe_datetime_to_string(conversation.updated_at), 
            "age_context": conversation.age_context,
            "is_archived": conversation.is_archived,
            "messages": []
        }
        
        for message in conversation.messages:
            message_data = {
                "id": str(message["_id"]),
                "_id": str(message["_id"]),
                "role": message["role"],
                "content": message["content"],
                "timestamp": safe_datetime_to_string(message.get("timestamp")),
                "current_version": message.get("current_version", 1),
                "is_edited": message.get("is_edited", False) 
            }
            
            if "versions" in message and message["versions"]:
                message_data["versions"] = []
                for version in message["versions"]:
                    version_data = {
                        "content": version["content"],
                        "timestamp": safe_datetime_to_string(version.get("timestamp")),
                        "version": version["version"]
                    }
                    
                    # Thêm sources cho version nếu có
                    if "sources" in version:
                        version_data["sources"] = version["sources"]
                    
                    # Thêm metadata cho version nếu có  
                    if "metadata" in version:
                        version_data["metadata"] = version["metadata"]
                    
                    # conversation_snapshot chỉ dùng để restore, không cần trả về frontend
                    message_data["versions"].append(version_data)
            else:
                # Nếu không có versions, tạo default version
                message_data["versions"] = [{
                    "content": message["content"],
                    "timestamp": safe_datetime_to_string(message.get("timestamp")),
                    "version": 1
                }]
            
            # Thêm sources nếu có
            if "sources" in message:
                message_data["sources"] = message["sources"]
                
            # Thêm metadata nếu có
            if "metadata" in message:
                message_data["metadata"] = message["metadata"]
                
            conversation_data["messages"].append(message_data)
        
        return jsonify({
            "success": True,
            "conversation": conversation_data
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi lấy chi tiết cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """API endpoint để tạo cuộc hội thoại mới"""
    try:
        data = request.json
        user_id = get_jwt_identity()
            
        # Lấy thông tin user
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy thông tin người dùng"
            }), 404
            
        # Tạo cuộc hội thoại mới
        title = data.get('title', 'Cuộc trò chuyện mới')
        age_context = data.get('age_context')
        
        # ✅ SỬA: Sử dụng Conversation.create thay vì khởi tạo trực tiếp
        conversation_id = Conversation.create(
            user_id=user_id,
            title=title,
            age_context=age_context
        )
        
        logger.info(f"✅ Created new conversation {conversation_id} for user {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Đã tạo cuộc hội thoại mới",
            "conversation_id": str(conversation_id)
        })
        
    except Exception as e:
        logger.error(f"❌ Lỗi khi tạo cuộc hội thoại mới: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>', methods=['PUT'])
@jwt_required()
def update_conversation(conversation_id):
    """API endpoint để cập nhật thông tin cuộc hội thoại"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền cập nhật cuộc hội thoại này"
            }), 403
        
        # Cập nhật thông tin
        if 'title' in data:
            conversation.title = data['title']
            
        if 'age_context' in data:
            conversation.age_context = data['age_context']
            
        if 'is_archived' in data:
            conversation.is_archived = data['is_archived']
        
        # Lưu thay đổi
        conversation.save()
        
        logger.info(f"✅ Updated conversation {conversation_id}")
        
        return jsonify({
            "success": True,
            "message": "Đã cập nhật thông tin cuộc hội thoại"
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật thông tin cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """API endpoint để xóa cuộc hội thoại"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền xóa cuộc hội thoại này"
            }), 403
        
        # Xóa cuộc hội thoại
        conversation.delete()
        
        logger.info(f"✅ Deleted conversation {conversation_id}")
        
        return jsonify({
            "success": True,
            "message": "Đã xóa cuộc hội thoại"
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi xóa cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>/archive', methods=['POST'])
@jwt_required()
def archive_conversation(conversation_id):
    """API endpoint để lưu trữ cuộc hội thoại"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền lưu trữ cuộc hội thoại này"
            }), 403
        
        # Lưu trữ cuộc hội thoại
        conversation.is_archived = True
        conversation.save()
        
        return jsonify({
            "success": True,
            "message": "Đã lưu trữ cuộc hội thoại"
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi lưu trữ cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>/unarchive', methods=['POST'])
@jwt_required()
def unarchive_conversation(conversation_id):
    """API endpoint để hủy lưu trữ cuộc hội thoại"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền hủy lưu trữ cuộc hội thoại này"
            }), 403
        
        # Hủy lưu trữ cuộc hội thoại
        conversation.is_archived = False
        conversation.save()
        
        return jsonify({
            "success": True,
            "message": "Đã hủy lưu trữ cuộc hội thoại"
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi hủy lưu trữ cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/search', methods=['GET'])
@jwt_required()
def search_conversations():
    """API endpoint để tìm kiếm cuộc hội thoại theo nội dung"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy tham số từ query string
        query = request.args.get('q', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Tính toán offset
        skip = (page - 1) * per_page
        
        # Kiểm tra từ khóa tìm kiếm
        if not query:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập từ khóa tìm kiếm"
            }), 400
            
        # Tìm kiếm cuộc hội thoại
        conversations = Conversation.search_by_content(
            user_id=user_id,
            query=query,
            limit=per_page,
            skip=skip
        )
        
        # Chuẩn bị dữ liệu phản hồi
        result = []
        for conversation in conversations:
            # Tìm tin nhắn chứa từ khóa tìm kiếm
            matching_messages = [m for m in conversation.messages if query.lower() in m["content"].lower()]
            
            result.append({
                "id": str(conversation.conversation_id),
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
                "age_context": conversation.age_context,
                "is_archived": conversation.is_archived,
                "message_count": len(conversation.messages),
                "matching_messages": len(matching_messages),
                "preview": matching_messages[0]["content"][:100] + "..." if matching_messages else ""
            })
        
        return jsonify({
            "success": True,
            "conversations": result,
            "query": query
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi tìm kiếm cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>/messages', methods=['POST'])
@jwt_required()
def add_message(conversation_id):
    """API endpoint để thêm tin nhắn mới vào cuộc hội thoại"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền thêm tin nhắn vào cuộc hội thoại này"
            }), 403
        
        # Lấy thông tin tin nhắn
        role = data.get('role')
        content = data.get('content')
        sources = data.get('sources')
        metadata = data.get('metadata')
        
        # Kiểm tra dữ liệu
        if not role or not content:
            return jsonify({
                "success": False,
                "error": "Vui lòng cung cấp role và content cho tin nhắn"
            }), 400
            
        # Kiểm tra role hợp lệ
        if role not in ["user", "bot"]:
            return jsonify({
                "success": False,
                "error": "Role không hợp lệ, chỉ chấp nhận 'user' hoặc 'bot'"
            }), 400
        
        # Thêm tin nhắn mới
        message_id = conversation.add_message(
            role=role,
            content=content,
            sources=sources,
            metadata=metadata
        )
        
        return jsonify({
            "success": True,
            "message": "Đã thêm tin nhắn mới",
            "message_id": str(message_id)
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi thêm tin nhắn mới: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/stats', methods=['GET'])
@jwt_required()
def get_user_conversation_stats():
    """API endpoint để lấy thống kê cuộc hội thoại của người dùng"""
    try:
        user_id = get_jwt_identity()
            
        # Lấy tổng số cuộc hội thoại
        total_conversations = Conversation.count_by_user(
            user_id=user_id,
            include_archived=True
        )
        
        # Lấy số cuộc hội thoại đã lưu trữ
        archived_conversations = Conversation.count_by_user(
            user_id=user_id,
            include_archived=True
        ) - Conversation.count_by_user(
            user_id=user_id,
            include_archived=False
        )
        
        # Lấy danh sách cuộc hội thoại để tính số tin nhắn
        all_conversations = Conversation.find_by_user(
            user_id=user_id,
            limit=100,  # Giới hạn 100 cuộc hội thoại gần nhất để tính thống kê
            skip=0,
            include_archived=True
        )
        
        # Tính số tin nhắn và số ngày
        total_messages = 0
        messages_by_date = {}
        
        for conversation in all_conversations:
            total_messages += len(conversation.messages)
            
            # Đếm số tin nhắn theo ngày
            for message in conversation.messages:
                date_str = message["timestamp"].strftime("%Y-%m-%d")
                if date_str not in messages_by_date:
                    messages_by_date[date_str] = 0
                messages_by_date[date_str] += 1
        
        # Sắp xếp ngày và lấy 7 ngày gần nhất
        sorted_dates = sorted(messages_by_date.keys(), reverse=True)[:7]
        recent_activity = {date: messages_by_date[date] for date in sorted_dates}
        
        # Tính trung bình số tin nhắn mỗi cuộc hội thoại
        avg_messages = total_messages / total_conversations if total_conversations > 0 else 0
        
        return jsonify({
            "success": True,
            "stats": {
                "total_conversations": total_conversations,
                "archived_conversations": archived_conversations,
                "total_messages": total_messages,
                "avg_messages_per_conversation": round(avg_messages, 1),
                "recent_activity": recent_activity
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi lấy thống kê cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>/export', methods=['GET'])
@jwt_required()
def export_conversation(conversation_id):
    """API endpoint để xuất cuộc hội thoại dưới dạng JSON"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền xuất cuộc hội thoại này"
            }), 403
        
        # Chuẩn bị dữ liệu xuất
        export_data = {
            "id": str(conversation.conversation_id),
            "title": conversation.title,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat(),
            "age_context": conversation.age_context,
            "messages": []
        }
        
        # Chuẩn bị danh sách tin nhắn
        for message in conversation.messages:
            message_data = {
                "role": message["role"],
                "content": message["content"],
                "timestamp": message["timestamp"].isoformat()
            }
            
            # Thêm sources nếu có
            if "sources" in message:
                message_data["sources"] = message["sources"]
                
            export_data["messages"].append(message_data)
        
        return jsonify(export_data)
        
    except Exception as e:
        logger.error(f"Lỗi khi xuất cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_conversations():
    """API endpoint để xóa nhiều cuộc hội thoại cùng lúc"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        conversation_ids = data.get('conversation_ids', [])
        
        if not conversation_ids:
            return jsonify({
                "success": False,
                "error": "Vui lòng cung cấp danh sách IDs cuộc hội thoại"
            }), 400
        
        # Duyệt qua từng ID và xóa
        deleted_count = 0
        failed_ids = []
        
        for conv_id in conversation_ids:
            try:
                # Lấy thông tin cuộc hội thoại
                conversation = Conversation.find_by_id(conv_id)
                
                # Kiểm tra quyền truy cập và xóa nếu hợp lệ
                if conversation and str(conversation.user_id) == user_id:
                    conversation.delete()
                    deleted_count += 1
                else:
                    failed_ids.append(conv_id)
            except Exception:
                failed_ids.append(conv_id)
                continue
        
        return jsonify({
            "success": True,
            "message": f"Đã xóa {deleted_count}/{len(conversation_ids)} cuộc hội thoại",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi xóa nhiều cuộc hội thoại: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@history_routes.route('/conversations/<conversation_id>/generate-title', methods=['POST'])
@jwt_required()
def generate_title_for_conversation(conversation_id):
    """API endpoint để tạo tự động tiêu đề cho cuộc hội thoại dựa trên nội dung"""
    try:
        user_id = get_jwt_identity()
        
        # Lấy thông tin cuộc hội thoại
        conversation = Conversation.find_by_id(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại"
            }), 404
        
        # Kiểm tra quyền truy cập
        if str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Bạn không có quyền cập nhật cuộc hội thoại này"
            }), 403
            
        # Kiểm tra số lượng tin nhắn
        if len(conversation.messages) < 2:
            return jsonify({
                "success": False,
                "error": "Cuộc hội thoại cần ít nhất 2 tin nhắn để tạo tiêu đề"
            }), 400
        
        # Lấy nội dung tin nhắn đầu tiên của người dùng
        first_user_message = None
        for message in conversation.messages:
            if message["role"] == "user":
                first_user_message = message["content"]
                break
                
        if not first_user_message:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn của người dùng"
            }), 400
            
        # Tạo tiêu đề từ nội dung
        title = create_title_from_message(first_user_message)
            
        # Cập nhật tiêu đề
        conversation.title = title
        conversation.save()
        
        return jsonify({
            "success": True,
            "message": "Đã tạo tiêu đề mới",
            "title": title
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi tạo tiêu đề: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500