from flask import Blueprint, request, jsonify
import logging
from core.rag_pipeline import RAGPipeline
from core.embedding_model import get_embedding_model
from models.conversation_model import Conversation
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
chat_routes = Blueprint('chat', __name__)

# Khởi tạo RAG Pipeline một lần duy nhất khi module được load
rag_pipeline = None

def get_rag_pipeline():
    """Singleton pattern để tránh khởi tạo lại RAG Pipeline"""
    global rag_pipeline
    if rag_pipeline is None:
        logger.info("Khởi tạo RAG Pipeline lần đầu")
        rag_pipeline = RAGPipeline()
    return rag_pipeline

# Hàm tạo tiêu đề từ tin nhắn
def create_title_from_message(message, max_length=50):
    """Tạo tiêu đề cuộc trò chuyện từ tin nhắn đầu tiên của người dùng"""
    message = message.strip().replace('\n', ' ')
    if len(message) <= max_length:
        return message
    return message[:max_length-3] + "..."

@chat_routes.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """API endpoint để xử lý tin nhắn chat"""
    try:
        data = request.json
        message = data.get('message')
        age = data.get('age', 1)
        conversation_id = data.get('conversation_id')
        
        user_id = get_jwt_identity()
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập tin nhắn"
            }), 400
        
        logger.info(f"Nhận tin nhắn từ user {user_id}: {message[:50]}...")
        
        # Xử lý conversation
        if conversation_id:
            conversation = Conversation.find_by_id(conversation_id)
            if not conversation or str(conversation.user_id) != user_id:
                return jsonify({
                    "success": False,
                    "error": "Không tìm thấy cuộc trò chuyện"
                }), 404
            
            if len(conversation.messages) == 0:
                final_title = create_title_from_message(message, 50)
                conversation.title = final_title
                logger.info(f"Cập nhật title cho conversation {conversation_id}: '{final_title}'")
        else:
            final_title = create_title_from_message(message, 50)
            conversation = Conversation.create(
                user_id=user_id,
                title=final_title,
                age_context=age
            )
            logger.info(f"Tạo conversation mới với title: '{final_title}'")
        
        # Thêm tin nhắn của user
        conversation.add_message("user", message)
        
        # Sử dụng RAG Pipeline để generate response
        pipeline = get_rag_pipeline()
        
        # Generate response sử dụng RAG
        logger.info("Bắt đầu generate response với RAG Pipeline")
        response_data = pipeline.generate_response(message, age)
        
        if response_data.get("success"):
            bot_response = response_data.get("response", "Xin lỗi, tôi không thể trả lời câu hỏi này.")
            sources = response_data.get("sources", [])
            
            # Thêm tin nhắn bot vào conversation
            conversation.add_message("bot", bot_response, sources=sources)
            
            logger.info(f"Đã generate response thành công cho conversation {conversation.conversation_id}")
            
            return jsonify({
                "success": True,
                "response": bot_response,
                "sources": sources,
                "conversation_id": str(conversation.conversation_id)
            })
        else:
            error_msg = response_data.get("error", "Không thể tạo phản hồi")
            logger.error(f"Lỗi generate response: {error_msg}")
            
            return jsonify({
                "success": False,
                "error": error_msg
            }), 500
            
    except Exception as e:
        logger.error(f"Lỗi xử lý chat: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500

@chat_routes.route('/follow-up-questions', methods=['POST'])
@jwt_required()
def generate_follow_up_questions():
    """API endpoint để tạo câu hỏi gợi ý"""
    try:
        data = request.json
        query = data.get('query')
        answer = data.get('answer')
        age = data.get('age', 1)
        
        if not query or not answer:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cần thiết"
            }), 400
        
        # Sử dụng RAG Pipeline thay vì khởi tạo DataProcessor
        pipeline = get_rag_pipeline()
        
        # Generate follow-up questions
        follow_up_data = pipeline.generate_follow_up_questions(query, answer, age)
        
        if follow_up_data.get("success"):
            return jsonify({
                "success": True,
                "questions": follow_up_data.get("questions", [])
            })
        else:
            return jsonify({
                "success": False,
                "error": follow_up_data.get("error", "Không thể tạo câu hỏi gợi ý")
            }), 500
            
    except Exception as e:
        logger.error(f"Lỗi tạo câu hỏi gợi ý: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500

# === MESSAGE EDITING ENDPOINTS ===
@chat_routes.route('/messages/<message_id>/edit', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """API endpoint để chỉnh sửa tin nhắn"""
    try:
        data = request.json
        new_content = data.get('content')
        conversation_id = data.get('conversation_id')
        age = data.get('age', 1)
        
        user_id = get_jwt_identity()
        
        if not new_content or not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cần thiết"
            }), 400
        
        # Tìm conversation
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc trò chuyện"
            }), 404
        
        # Tìm message và kiểm tra quyền
        message_found = False
        for msg in conversation.messages:
            if str(msg.get('_id', msg.get('id'))) == message_id:
                if msg['role'] != 'user':
                    return jsonify({
                        "success": False,
                        "error": "Chỉ có thể chỉnh sửa tin nhắn của người dùng"
                    }), 400
                message_found = True
                break
        
        if not message_found:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn"
            }), 404
        
        # Cập nhật tin nhắn và xóa tất cả tin nhắn sau nó
        success, result_message = conversation.edit_message(message_id, new_content)
        
        if not success:
            return jsonify({
                "success": False,
                "error": result_message
            }), 400
        
        # Tạo phản hồi mới với RAG Pipeline
        pipeline = get_rag_pipeline()
        response_data = pipeline.generate_response(new_content, age)
        
        if response_data.get("success"):
            bot_response = response_data.get("response", "Xin lỗi, tôi không thể trả lời câu hỏi này.")
            sources = response_data.get("sources", [])
            
            # Thêm phản hồi bot mới
            success, bot_message = conversation.regenerate_bot_response_after_edit(message_id, bot_response, sources)
            
            if success:
                # Trả về conversation đã cập nhật
                updated_conversation = Conversation.find_by_id(conversation_id)
                return jsonify({
                    "success": True,
                    "message": "Đã chỉnh sửa tin nhắn và tạo phản hồi mới",
                    "conversation": {
                        "id": str(updated_conversation.conversation_id),
                        "messages": [
                            {
                                "id": str(msg["_id"]),
                                "role": msg["role"],
                                "content": msg["content"],
                                "timestamp": msg["timestamp"].isoformat(),
                                "sources": msg.get("sources", []),
                                "is_edited": msg.get("is_edited", False),
                                "versions": msg.get("versions", []),
                                "current_version": msg.get("current_version", 1)
                            }
                            for msg in updated_conversation.messages
                        ]
                    }
                })
            else:
                return jsonify({
                    "success": False,
                    "error": bot_message
                }), 500
        else:
            return jsonify({
                "success": False,
                "error": response_data.get("error", "Không thể tạo phản hồi mới")
            }), 500
            
    except Exception as e:
        logger.error(f"Lỗi chỉnh sửa tin nhắn: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500

@chat_routes.route('/messages/<message_id>/regenerate', methods=['POST'])
@jwt_required()
def regenerate_response(message_id):
    """API endpoint để tạo lại phản hồi"""
    try:
        data = request.json
        conversation_id = data.get('conversation_id')
        age = data.get('age', 1)
        
        user_id = get_jwt_identity()
        
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu conversation_id"
            }), 400
        
        # Tìm conversation
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc trò chuyện"
            }), 404
        
        # Tìm tin nhắn và tin nhắn user trước đó
        user_message = None
        for i, msg in enumerate(conversation.messages):
            if str(msg.get('_id', msg.get('id'))) == message_id:
                if msg['role'] != 'bot':
                    return jsonify({
                        "success": False,
                        "error": "Chỉ có thể regenerate phản hồi của bot"
                    }), 400
                # Tìm tin nhắn user trước đó
                if i > 0 and conversation.messages[i-1]['role'] == 'user':
                    user_message = conversation.messages[i-1]['content']
                break
        
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn người dùng tương ứng"
            }), 404
        
        # Sử dụng RAG Pipeline để generate response mới
        pipeline = get_rag_pipeline()
        response_data = pipeline.generate_response(user_message, age)
        
        if response_data.get("success"):
            bot_response = response_data.get("response", "Xin lỗi, tôi không thể trả lời câu hỏi này.")
            sources = response_data.get("sources", [])
            
            success, result_message = conversation.regenerate_response(message_id, bot_response, sources)
            
            if success:
                # Trả về conversation đã cập nhật
                updated_conversation = Conversation.find_by_id(conversation_id)
                return jsonify({
                    "success": True,
                    "conversation": updated_conversation.to_dict()
                })
            else:
                return jsonify({
                    "success": False,
                    "error": result_message
                }), 400
        else:
            return jsonify({
                "success": False,
                "error": response_data.get("error", "Không thể tạo phản hồi mới")
            }), 500
            
    except Exception as e:
        logger.error(f"Lỗi regenerate response: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500

@chat_routes.route('/messages/<message_id>/versions/<int:version>', methods=['PUT'])
@jwt_required()
def switch_message_version(message_id, version):
    """API endpoint để chuyển đổi version của tin nhắn"""
    try:
        data = request.json
        conversation_id = data.get('conversation_id')
        
        user_id = get_jwt_identity()
        
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu conversation_id"
            }), 400
        
        # Tìm conversation
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc trò chuyện"
            }), 404
        
        # Chuyển đổi version
        success = conversation.switch_message_version(message_id, version)
        
        if success:
            updated_conversation = Conversation.find_by_id(conversation_id)
            return jsonify({
                "success": True,
                "conversation": updated_conversation.to_dict()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không thể chuyển đổi version"
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi chuyển đổi version: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500

@chat_routes.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message_and_following(message_id):
    """API endpoint để xóa tin nhắn và tất cả tin nhắn sau nó"""
    try:
        data = request.json
        conversation_id = data.get('conversation_id')
        
        user_id = get_jwt_identity()
        
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu conversation_id"
            }), 400
        
        # Tìm conversation
        conversation = Conversation.find_by_id(conversation_id)
        if not conversation or str(conversation.user_id) != user_id:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy cuộc trò chuyện"
            }), 404
        
        # Xóa tin nhắn và các tin nhắn theo sau
        success = conversation.delete_message_and_following(message_id)
        
        if success:
            updated_conversation = Conversation.find_by_id(conversation_id)
            return jsonify({
                "success": True,
                "conversation": updated_conversation.to_dict()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không thể xóa tin nhắn"
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi xóa tin nhắn: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Lỗi máy chủ: {str(e)}"
        }), 500