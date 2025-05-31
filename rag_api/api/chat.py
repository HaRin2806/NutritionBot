from flask import Blueprint, request, jsonify
import logging
import time
import datetime
from core.rag_pipeline import RAGPipeline
from core.embedding_model import get_embedding_model
from core.data_processor import DataProcessor
from models.user_model import User
from models.conversation_model import Conversation
from bson.objectid import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
chat_routes = Blueprint('chat', __name__)

# Khởi tạo components - Tối ưu hóa để sử dụng singleton
def get_data_processor():
    return DataProcessor()

def get_rag_pipeline():
    data_processor = get_data_processor()
    embedding_model = get_embedding_model()
    return RAGPipeline(data_processor, embedding_model)

def create_title_from_message(message, max_length=50):
    """Tạo tiêu đề cuộc trò chuyện từ tin nhắn đầu tiên của người dùng"""
    message = message.strip().replace('\n', ' ')
    if len(message) <= max_length:
        return message
    return message[:max_length-3] + "..."

def get_conversation_context(conversation, before_message_index=None):
    """
    Lấy context từ cuộc hội thoại cho RAG pipeline
    
    Args:
        conversation: Đối tượng Conversation
        before_message_index: Chỉ lấy context trước message này (dùng cho edit)
    
    Returns:
        List context theo format [{"user": str, "bot": str}, ...]
    """
    if not conversation or not conversation.messages:
        return []
    
    # Xác định messages cần lấy context
    if before_message_index is not None:
        messages = conversation.messages[:before_message_index]
    else:
        # Lấy tối đa 6 tin nhắn gần nhất (3 cặp hỏi đáp)
        messages = conversation.messages[-6:] if len(conversation.messages) >= 6 else conversation.messages
    
    context = []
    # Lấy các cặp user-bot
    for i in range(0, len(messages)-1, 2):
        if i+1 < len(messages):
            if messages[i]["role"] == "user" and messages[i+1]["role"] == "bot":
                user_msg = messages[i]["content"]
                bot_msg = messages[i+1]["content"]
                context.append({"user": user_msg, "bot": bot_msg})
    
    return context

def generate_bot_response(user_message, age, conversation_context=None):
    """
    Tạo phản hồi bot thống nhất cho tất cả trường hợp
    
    Args:
        user_message: Nội dung tin nhắn user
        age: Tuổi người dùng
        conversation_context: Context từ cuộc hội thoại trước đó
    
    Returns:
        Dict với answer, sources, query_time
    """
    rag_pipeline = get_rag_pipeline()
    start_time = time.time()
    
    result = rag_pipeline.process_query(
        user_message, 
        age, 
        conversation_context=conversation_context or []
    )
    
    end_time = time.time()
    query_time = end_time - start_time
    
    return {
        "answer": result["answer"],
        "sources": result.get("sources", []),
        "contexts": result.get("contexts", []),
        "query_time": query_time
    }

@chat_routes.route('/chat', methods=['POST'])
def chat():
    """API endpoint để trò chuyện với chatbot"""
    try:
        data = request.json
        
        # Cố gắng lấy user_id từ JWT, nếu có
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            user_id = None

        message = data.get('message')
        age = data.get('age')
        conversation_id = data.get('conversation_id')
        
        if not age:
            return jsonify({
                "success": False,
                "error": "Vui lòng cung cấp thông tin về độ tuổi",
                "reply": "Để có thể cung cấp thông tin phù hợp, tôi cần biết độ tuổi của bạn."
            }), 400
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập tin nhắn",
                "reply": "Tôi không hiểu câu hỏi của bạn. Vui lòng thử lại."
            }), 400
        
        logger.info(f"Nhận câu hỏi: {message}, Tuổi: {age}")
        
        # Tìm hoặc tạo cuộc hội thoại
        conversation = None
        is_new_conversation = False
        conversation_title = None
        
        if user_id:
            if conversation_id:
                conversation = Conversation.find_by_id(conversation_id)
                if conversation and len(conversation.messages) == 0:
                    is_new_conversation = True
            
            if not conversation:
                is_new_conversation = True
                title = create_title_from_message(message)
                conversation = Conversation(
                    user_id=ObjectId(user_id) if ObjectId.is_valid(user_id) else None,
                    title=title,
                    age_context=age
                )
                conversation.save()
                conversation_id = str(conversation.conversation_id)
                conversation_title = title
        
        # Lấy context từ cuộc hội thoại hiện tại
        conversation_context = get_conversation_context(conversation)
        
        # Tạo phản hồi bot
        bot_response = generate_bot_response(message, age, conversation_context)
        
        # Lưu tin nhắn vào database nếu có conversation
        if conversation:
            # Thêm tin nhắn user
            conversation.add_message(
                role="user",
                content=message,
                metadata={"token_count": len(message.split())}
            )
            
            # Thêm tin nhắn bot
            conversation.add_message(
                role="bot",
                content=bot_response["answer"],
                sources=bot_response["sources"],
                metadata={
                    "query_time": bot_response["query_time"],
                    "token_count": len(bot_response["answer"].split())
                }
            )
            
            # Cập nhật tiêu đề nếu là cuộc hội thoại mới
            if is_new_conversation and not conversation_title:
                title = create_title_from_message(message)
                conversation.title = title
                conversation.save()
                conversation_title = title
        
        # Định dạng response
        response = {
            "success": True,
            "reply": bot_response["answer"],
            "sources": bot_response["sources"],
            "contexts": bot_response["contexts"],
            "query": message,
            "query_time": bot_response["query_time"]
        }
        
        if conversation_id:
            response["conversation_id"] = conversation_id
            
        if is_new_conversation and conversation_title:
            response["conversation_title"] = conversation_title
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Lỗi xử lý yêu cầu: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "reply": "Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau."
        }), 500

@chat_routes.route('/messages/<message_id>/edit', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """API endpoint để chỉnh sửa tin nhắn và regenerate bot response"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        new_content = data.get('content')
        conversation_id = data.get('conversation_id')
        age = data.get('age')
        
        if not new_content or not conversation_id or not age:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin bắt buộc"
            }), 400
        
        # Tìm cuộc hội thoại và kiểm tra quyền
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại hoặc không có quyền truy cập"
            }), 404
        
        # Tìm vị trí của tin nhắn cần edit
        user_message_index = None
        for i, msg in enumerate(conversation.messages):
            if str(msg["_id"]) == str(message_id):
                if msg["role"] != "user":
                    return jsonify({
                        "success": False,
                        "error": "Chỉ có thể chỉnh sửa tin nhắn của người dùng"
                    }), 400
                user_message_index = i
                break
        
        if user_message_index is None:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn"
            }), 404
        
        # Cập nhật tin nhắn user
        success, message_result = conversation.edit_message(message_id, new_content)
        if not success:
            return jsonify({
                "success": False,
                "error": message_result
            }), 400
        
        # Kiểm tra có bot message để regenerate không
        bot_message_index = user_message_index + 1
        bot_message_exists = (bot_message_index < len(conversation.messages) and 
                            conversation.messages[bot_message_index]["role"] == "bot")
        
        if bot_message_exists:
            # Lấy context TRƯỚC tin nhắn đã edit (để regenerate đúng context)
            conversation_context = get_conversation_context(conversation, user_message_index)
            
            # Tạo phản hồi mới với context đúng
            bot_response = generate_bot_response(new_content, age, conversation_context)
            
            # Cập nhật bot message với version mới
            bot_message = conversation.messages[bot_message_index]
            timestamp = datetime.datetime.now()
            
            # Khởi tạo versions nếu chưa có
            if "versions" not in bot_message:
                bot_message["versions"] = [{
                    "content": bot_message["content"],
                    "timestamp": bot_message["timestamp"],
                    "version": 1,
                    "sources": bot_message.get("sources", []),
                    "metadata": bot_message.get("metadata", {})
                }]
            
            # Tạo version mới
            new_version = len(bot_message["versions"]) + 1
            new_version_data = {
                "content": bot_response["answer"],
                "timestamp": timestamp,
                "version": new_version,
                "sources": bot_response["sources"],
                "metadata": {
                    "query_time": bot_response["query_time"],
                    "token_count": len(bot_response["answer"].split()),
                    "regenerated_from_edit": True
                }
            }
            
            # Cập nhật bot message
            bot_message["versions"].append(new_version_data)
            bot_message["current_version"] = new_version
            bot_message["content"] = bot_response["answer"]
            bot_message["sources"] = bot_response["sources"]
            bot_message["is_edited"] = True
            
            # Lưu conversation
            conversation.updated_at = timestamp
            conversation.save()
            
            logger.info(f"Đã regenerate bot response cho message: {bot_message['_id']}")
        
        return jsonify({
            "success": True,
            "message": "Đã chỉnh sửa tin nhắn thành công",
            "regenerated": bot_message_exists
        })
            
    except Exception as e:
        logger.error(f"Lỗi khi chỉnh sửa tin nhắn: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_routes.route('/messages/<message_id>/regenerate', methods=['POST'])
@jwt_required()
def regenerate_response(message_id):
    """API endpoint để tạo lại phản hồi của bot"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        conversation_id = data.get('conversation_id')
        age = data.get('age')
        
        if not conversation_id or not age:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin bắt buộc"
            }), 400
        
        # Tìm cuộc hội thoại và kiểm tra quyền
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại hoặc không có quyền truy cập"
            }), 404
        
        # Tìm user message
        user_message_index = None
        user_message = None
        for i, msg in enumerate(conversation.messages):
            if str(msg["_id"]) == str(message_id):
                if msg["role"] != "user":
                    return jsonify({
                        "success": False,
                        "error": "Chỉ có thể regenerate phản hồi cho tin nhắn của người dùng"
                    }), 400
                user_message_index = i
                user_message = msg
                break
        
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn người dùng"
            }), 404
        
        # Tìm bot message tương ứng
        bot_message_index = user_message_index + 1
        if (bot_message_index >= len(conversation.messages) or 
            conversation.messages[bot_message_index]["role"] != "bot"):
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn bot tương ứng"
            }), 404
        
        # Lấy context trước user message
        conversation_context = get_conversation_context(conversation, user_message_index)
        
        # Tạo phản hồi mới
        bot_response = generate_bot_response(user_message["content"], age, conversation_context)
        
        # Cập nhật bot message với version mới
        bot_message = conversation.messages[bot_message_index]
        timestamp = datetime.datetime.now()
        
        # Khởi tạo versions nếu chưa có
        if "versions" not in bot_message:
            bot_message["versions"] = [{
                "content": bot_message["content"],
                "timestamp": bot_message["timestamp"],
                "version": 1,
                "sources": bot_message.get("sources", []),
                "metadata": bot_message.get("metadata", {})
            }]
        
        # Tạo version mới
        new_version = len(bot_message["versions"]) + 1
        new_version_data = {
            "content": bot_response["answer"],
            "timestamp": timestamp,
            "version": new_version,
            "sources": bot_response["sources"],
            "metadata": {
                "query_time": bot_response["query_time"],
                "token_count": len(bot_response["answer"].split()),
                "regenerated": True
            }
        }
        
        # Cập nhật bot message
        bot_message["versions"].append(new_version_data)
        bot_message["current_version"] = new_version
        bot_message["content"] = bot_response["answer"]
        bot_message["sources"] = bot_response["sources"]
        bot_message["is_edited"] = True
        
        # Lưu conversation
        conversation.updated_at = timestamp
        conversation.save()
        
        return jsonify({
            "success": True,
            "message": "Đã tạo lại phản hồi thành công",
            "new_content": bot_response["answer"],
            "sources": bot_response["sources"]
        })
            
    except Exception as e:
        logger.error(f"Lỗi khi tạo lại phản hồi: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_routes.route('/messages/<message_id>/versions/<int:version>', methods=['PUT'])
@jwt_required()
def switch_message_version(message_id, version):
    """API endpoint để chuyển đổi version của tin nhắn"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        conversation_id = data.get('conversation_id')
        
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cuộc hội thoại"
            }), 400
        
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại hoặc không có quyền truy cập"
            }), 404
        
        success, message_result = conversation.switch_message_version(message_id, version)
        
        if success:
            updated_message = conversation.get_message_by_id(message_id)
            return jsonify({
                "success": True,
                "message": "Đã chuyển đổi version thành công",
                "updated_message": updated_message
            })
        else:
            return jsonify({
                "success": False,
                "error": message_result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi khi chuyển đổi version tin nhắn: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_routes.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message_and_following(message_id):
    """API endpoint để xóa tin nhắn và tất cả tin nhắn sau nó"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        conversation_id = data.get('conversation_id')
        
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cuộc hội thoại"
            }), 400
        
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc hội thoại hoặc không có quyền truy cập"
            }), 404
        
        success, message_result = conversation.delete_message_and_following(message_id)
        
        if success:
            # Convert ObjectId trong messages
            updated_messages = []
            for msg in conversation.messages:
                msg_copy = msg.copy()
                msg_copy["_id"] = str(msg_copy["_id"])
                if "parent_message_id" in msg_copy and msg_copy["parent_message_id"]:
                    msg_copy["parent_message_id"] = str(msg_copy["parent_message_id"])
                updated_messages.append(msg_copy)
            
            return jsonify({
                "success": True,
                "message": "Đã xóa tin nhắn và các tin nhắn sau nó",
                "updated_messages": updated_messages
            })
        else:
            return jsonify({
                "success": False,
                "error": message_result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi khi xóa tin nhắn: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500