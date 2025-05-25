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
    # Lazy loading để tải dữ liệu chỉ khi cần
    return DataProcessor()

def get_rag_pipeline():
    # Tạo RAG pipeline với các components đã được khởi tạo
    data_processor = get_data_processor()
    embedding_model = get_embedding_model()
    return RAGPipeline(data_processor, embedding_model)

# Hàm đơn giản để tạo tiêu đề từ nội dung tin nhắn
def create_title_from_message(message, max_length=50):
    """Tạo tiêu đề cuộc trò chuyện từ tin nhắn đầu tiên của người dùng"""
    # Loại bỏ ký tự xuống dòng và khoảng trắng thừa
    message = message.strip().replace('\n', ' ')
    
    # Nếu tin nhắn đủ ngắn, sử dụng làm tiêu đề luôn
    if len(message) <= max_length:
        return message
    
    # Nếu tin nhắn quá dài, cắt ngắn và thêm dấu "..."
    return message[:max_length-3] + "..."

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

        # Lấy dữ liệu đầu vào từ frontend React
        message = data.get('message')
        # Lấy thông tin tuổi từ request
        age = data.get('age')
        conversation_id = data.get('conversation_id')
        
        # Kiểm tra nếu không có tuổi
        if not age:
            return jsonify({
                "success": False,
                "error": "Vui lòng cung cấp thông tin về độ tuổi",
                "reply": "Để có thể cung cấp thông tin phù hợp, tôi cần biết độ tuổi của bạn. Vui lòng thiết lập độ tuổi trước khi tiếp tục."
            }), 400
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập tin nhắn",
                "reply": "Tôi không hiểu câu hỏi của bạn. Vui lòng thử lại."
            }), 400
        
        logger.info(f"Nhận câu hỏi: {message}")
        logger.info(f"Độ tuổi người dùng: {age}")
        
        # Lấy context từ cuộc hội thoại (tối đa 3 câu hỏi và trả lời gần nhất)
        conversation_context = []
        if conversation_id:
            conversation = Conversation.find_by_id(conversation_id)
            if conversation and conversation.messages:
                # Lọc ra các tin nhắn gần nhất (tối đa 6 tin nhắn - 3 cặp hỏi đáp)
                recent_messages = conversation.messages[-6:] if len(conversation.messages) >= 6 else conversation.messages
                
                # Chỉ lấy những tin nhắn hoàn chỉnh (cặp user-bot)
                for i in range(0, len(recent_messages)-1, 2):
                    if i+1 < len(recent_messages):
                        if recent_messages[i]["role"] == "user" and recent_messages[i+1]["role"] == "bot":
                            user_msg = recent_messages[i]["content"]
                            bot_msg = recent_messages[i+1]["content"]
                            conversation_context.append({"user": user_msg, "bot": bot_msg})
        
        # Tạo RAG pipeline mới cho mỗi request (để đảm bảo thread-safe)
        rag_pipeline = get_rag_pipeline()
        
        start_time = time.time()
        
        # Xử lý câu hỏi qua RAG pipeline với context
        result = rag_pipeline.process_query(message, age, conversation_context=conversation_context)
        
        end_time = time.time()
        query_time = end_time - start_time
        
        # Kiểm tra xem đây có phải là tin nhắn đầu tiên và cần tạo cuộc hội thoại mới không
        is_new_conversation = False
        conversation = None
        conversation_title = None
        
        if user_id:
            # Tìm hoặc tạo cuộc hội thoại
            if conversation_id:
                # Tìm cuộc hội thoại hiện có
                conversation = Conversation.find_by_id(conversation_id)
                
                # Kiểm tra số lượng tin nhắn
                if conversation and len(conversation.messages) == 0:
                    # Nếu đây là tin nhắn đầu tiên, đánh dấu là cuộc hội thoại mới
                    is_new_conversation = True
            
            # Nếu không tìm thấy cuộc hội thoại, tạo mới và đặt biến flag
            if not conversation:
                is_new_conversation = True
                # Tạo tiêu đề từ nội dung tin nhắn đầu tiên
                title = create_title_from_message(message)
                
                conversation = Conversation(
                    user_id=ObjectId(user_id) if ObjectId.is_valid(user_id) else None,
                    title=title,
                    age_context=age
                )
                conversation.save()
                conversation_id = str(conversation.conversation_id)
                conversation_title = title
            
            # Thêm tin nhắn của người dùng
            conversation.add_message(
                role="user",
                content=message,
                metadata={
                    "token_count": len(message.split())
                }
            )
            
            # Thêm tin nhắn của bot
            conversation.add_message(
                role="bot",
                content=result["answer"],
                sources=result.get("sources", []),
                metadata={
                    "query_time": query_time,
                    "token_count": len(result["answer"].split())
                }
            )
            
            # Nếu là cuộc trò chuyện mới, tạo tiêu đề từ tin nhắn đầu tiên
            if is_new_conversation and not conversation_title:
                title = create_title_from_message(message)
                conversation.title = title
                conversation.save()
                conversation_title = title
                logger.info(f"Đã tạo tiêu đề cuộc hội thoại: {title}")
        
        # Định dạng kết quả cho frontend
        response = {
            "success": True,
            "reply": result["answer"],
            "contexts": result.get("contexts", []),
            "sources": result.get("sources", []),
            "query": result.get("query", message),
            "query_time": query_time
        }
        
        # Nếu có conversation_id, thêm vào phản hồi
        if conversation_id:
            response["conversation_id"] = conversation_id
            
        # Nếu là cuộc trò chuyện mới, thêm tiêu đề vào phản hồi
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
    """API endpoint để chỉnh sửa tin nhắn và tự động regenerate bot response"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        
        new_content = data.get('content')
        conversation_id = data.get('conversation_id')
        age = data.get('age')  # Thêm age để regenerate
        
        if not new_content:
            return jsonify({
                "success": False,
                "error": "Nội dung tin nhắn không được để trống"
            }), 400
            
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cuộc hội thoại"
            }), 400
            
        if not age:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin độ tuổi"
            }), 400
        
        # Tìm cuộc hội thoại
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
                "error": "Bạn không có quyền chỉnh sửa tin nhắn này"
            }), 403
        
        # Chỉnh sửa tin nhắn
        success, message_result = conversation.edit_message(message_id, new_content)
        
        if not success:
            return jsonify({
                "success": False,
                "error": message_result
            }), 400
        
        # Tìm bot message cần regenerate
        user_message_index = None
        for i, msg in enumerate(conversation.messages):
            if str(msg["_id"]) == str(message_id):
                user_message_index = i
                break
        
        bot_response_generated = False
        bot_message = None
        
        if user_message_index is not None:
            bot_message_index = user_message_index + 1
            
            if (bot_message_index < len(conversation.messages) and 
                conversation.messages[bot_message_index]["role"] == "bot"):
                
                # Regenerate bot response
                try:
                    # Tạo RAG pipeline
                    rag_pipeline = get_rag_pipeline()
                    
                    # Lấy context từ cuộc hội thoại (các tin nhắn trước tin nhắn user này)
                    conversation_context = []
                    if user_message_index > 0:
                        context_messages = conversation.messages[:user_message_index]
                        for i in range(0, len(context_messages)-1, 2):
                            if i+1 < len(context_messages):
                                if context_messages[i]["role"] == "user" and context_messages[i+1]["role"] == "bot":
                                    user_msg = context_messages[i]["content"]
                                    bot_msg = context_messages[i+1]["content"]
                                    conversation_context.append({"user": user_msg, "bot": bot_msg})
                    
                    start_time = time.time()
                    
                    # Tạo phản hồi mới
                    result = rag_pipeline.process_query(
                        new_content, 
                        age, 
                        conversation_context=conversation_context
                    )
                    
                    end_time = time.time()
                    query_time = end_time - start_time
                    
                    # Cập nhật bot message với version mới
                    bot_message = conversation.messages[bot_message_index]
                    timestamp = datetime.datetime.now()
                    
                    # Tạo version mới cho bot response
                    new_version = len(bot_message.get("versions", [])) + 1
                    new_version_data = {
                        "content": result["answer"],
                        "timestamp": timestamp,
                        "version": new_version,
                        "sources": result.get("sources", []),
                        "metadata": {
                            "query_time": query_time,
                            "token_count": len(result["answer"].split()),
                            "regenerated_from_edit": True
                        }
                    }
                    
                    # Khởi tạo versions nếu chưa có
                    if "versions" not in bot_message:
                        bot_message["versions"] = [{
                            "content": bot_message["content"],
                            "timestamp": bot_message["timestamp"],
                            "version": 1,
                            "sources": bot_message.get("sources", []),
                            "metadata": bot_message.get("metadata", {})
                        }]
                    
                    # Thêm version mới
                    bot_message["versions"].append(new_version_data)
                    bot_message["current_version"] = new_version
                    bot_message["content"] = result["answer"]
                    bot_message["sources"] = result.get("sources", [])
                    bot_message["is_edited"] = True
                    
                    # Xóa flag needs_regeneration
                    if "needs_regeneration" in bot_message:
                        del bot_message["needs_regeneration"]
                    
                    # Cập nhật thời gian của cuộc hội thoại
                    conversation.updated_at = timestamp
                    conversation.save()
                    
                    bot_response_generated = True
                    logger.info(f"Đã regenerate bot response thành công cho message: {bot_message['_id']}")
                    
                except Exception as regenerate_error:
                    logger.error(f"Lỗi khi regenerate bot response: {regenerate_error}")
                    # Vẫn trả về success cho việc edit, chỉ log lỗi regenerate
        
        # Lấy tin nhắn đã cập nhật
        updated_user_message = conversation.get_message_by_id(message_id)
        updated_bot_message = None
        if bot_message:
            updated_bot_message = conversation.get_message_by_id(str(bot_message["_id"]))
        
        response_data = {
            "success": True,
            "message": "Đã chỉnh sửa tin nhắn thành công",
            "updated_message": updated_user_message,
            "bot_response_generated": bot_response_generated
        }
        
        if updated_bot_message:
            response_data["updated_bot_message"] = updated_bot_message
        
        return jsonify(response_data)
            
    except Exception as e:
        logger.error(f"Lỗi khi chỉnh sửa tin nhắn: {str(e)}")
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
        
        # Tìm cuộc hội thoại
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
                "error": "Bạn không có quyền thao tác với tin nhắn này"
            }), 403
        
        # Chuyển đổi version
        success, message_result = conversation.switch_message_version(message_id, version)
        
        if success:
            # Lấy tin nhắn đã cập nhật và convert ObjectId
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

@chat_routes.route('/messages/<message_id>/regenerate', methods=['POST'])
@jwt_required()
def regenerate_response(message_id):
    """API endpoint để tạo lại phản hồi của bot cho tin nhắn user"""
    try:
        data = request.json
        user_id = get_jwt_identity()
        conversation_id = data.get('conversation_id')
        age = data.get('age')
        
        if not conversation_id:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cuộc hội thoại"
            }), 400
            
        if not age:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin độ tuổi"
            }), 400
        
        # Tìm cuộc hội thoại
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
                "error": "Bạn không có quyền thao tác với cuộc hội thoại này"
            }), 403
        
        # Tìm tin nhắn user
        user_message = conversation.get_message_by_id(message_id)
        if not user_message or user_message["role"] != "user":
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn của người dùng"
            }), 404
        
        # Tạo RAG pipeline
        rag_pipeline = get_rag_pipeline()
        
        # Tìm index của user message
        user_message_index = None
        for i, msg in enumerate(conversation.messages):
            if str(msg["_id"]) == str(message_id):
                user_message_index = i
                break
        
        # Lấy context từ cuộc hội thoại (các tin nhắn trước tin nhắn này)
        conversation_context = []
        if user_message_index and user_message_index > 0:
            # Lấy context từ các tin nhắn trước đó
            context_messages = conversation.messages[:user_message_index]
            for i in range(0, len(context_messages)-1, 2):
                if i+1 < len(context_messages):
                    if context_messages[i]["role"] == "user" and context_messages[i+1]["role"] == "bot":
                        user_msg = context_messages[i]["content"]
                        bot_msg = context_messages[i+1]["content"]
                        conversation_context.append({"user": user_msg, "bot": bot_msg})
        
        start_time = time.time()
        
        # Tạo phản hồi mới
        result = rag_pipeline.process_query(
            user_message["content"], 
            age, 
            conversation_context=conversation_context
        )
        
        end_time = time.time()
        query_time = end_time - start_time
        
        # Tìm tin nhắn bot tương ứng (tin nhắn ngay sau tin nhắn user)
        bot_message_index = user_message_index + 1
        
        if bot_message_index < len(conversation.messages) and conversation.messages[bot_message_index]["role"] == "bot":
            # Cập nhật tin nhắn bot hiện có với version mới
            bot_message = conversation.messages[bot_message_index]
            timestamp = datetime.datetime.now()
            
            # Tạo version mới cho bot response
            new_version = len(bot_message["versions"]) + 1
            new_version_data = {
                "content": result["answer"],
                "timestamp": timestamp,
                "version": new_version,
                "sources": result.get("sources", []),
                "metadata": {
                    "query_time": query_time,
                    "token_count": len(result["answer"].split()),
                    "regenerated": True
                }
            }
            
            # Thêm version mới
            bot_message["versions"].append(new_version_data)
            bot_message["current_version"] = new_version
            bot_message["content"] = result["answer"]
            bot_message["sources"] = result.get("sources", [])
            bot_message["is_edited"] = True
            
            # Xóa flag regenerate_required nếu có
            if "regenerate_required" in bot_message:
                del bot_message["regenerate_required"]
            
            # Cập nhật thời gian của cuộc hội thoại
            conversation.updated_at = timestamp
            conversation.save()
            
            # Lấy tin nhắn đã cập nhật và convert ObjectId
            updated_message = conversation.get_message_by_id(str(bot_message["_id"]))
            
            return jsonify({
                "success": True,
                "message": "Đã tạo lại phản hồi thành công",
                "updated_message": updated_message,
                "reply": result["answer"],
                "sources": result.get("sources", []),
                "query_time": query_time
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tin nhắn bot tương ứng"
            }), 404
            
    except Exception as e:
        logger.error(f"Lỗi khi tạo lại phản hồi: {str(e)}")
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
        
        # Tìm cuộc hội thoại
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
                "error": "Bạn không có quyền xóa tin nhắn này"
            }), 403
        
        # Xóa tin nhắn và các tin nhắn sau nó
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

# Các route khác giữ nguyên...
@chat_routes.route('/follow-up-questions', methods=['POST'])
def get_follow_up_questions():
    """API endpoint để lấy các câu hỏi gợi ý tiếp theo"""
    try:
        data = request.json
        
        query = data.get('query')
        answer = data.get('answer')
        age = data.get('age')
        
        if not query or not answer:
            return jsonify({
                "success": False,
                "error": "Thiếu thông tin cần thiết"
            }), 400
            
        # Tạo RAG pipeline
        rag_pipeline = get_rag_pipeline()
        
        # Lấy câu hỏi tiếp theo
        follow_up_questions = rag_pipeline.get_follow_up_questions(
            query=query,
            answer=answer,
            age=age
        )
        
        return jsonify({
            "success": True,
            "follow_up_questions": follow_up_questions
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi lấy câu hỏi gợi ý: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@chat_routes.route('/health', methods=['GET'])
def health_check():
    """API endpoint để kiểm tra trạng thái của chatbot"""
    try:
        # Tải data_processor để kiểm tra dữ liệu
        data_processor = get_data_processor()
        chunk_count = len(data_processor.chunks)
        table_count = len(data_processor.tables)
        figure_count = len(data_processor.figures)
        
        # Tải embedding_model để kiểm tra chỉ mục
        embedding_model = get_embedding_model()
        index_count = embedding_model.count()
        
        # Kiểm tra RAG pipeline
        rag_pipeline = get_rag_pipeline()
        
        # Thống kê theo bài học
        stats_by_lesson = {}
        for key, value in data_processor.get_stats().get("by_lesson", {}).items():
            stats_by_lesson[key] = {
                "chunks": value.get("chunks", 0),
                "tables": value.get("tables", 0),
                "figures": value.get("figures", 0),
                "total": value.get("total", 0)
            }
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "data": {
                "chunks": chunk_count,
                "tables": table_count,
                "figures": figure_count,
                "total_items": chunk_count + table_count + figure_count,
                "indexed_items": index_count,
                "stats_by_lesson": stats_by_lesson
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi kiểm tra sức khỏe chatbot: {str(e)}")
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }), 500

@chat_routes.route('/search', methods=['GET'])
@jwt_required(optional=True)
def search_data():
    """API endpoint để tìm kiếm dữ liệu"""
    try:
        query = request.args.get('q')
        age = request.args.get('age')
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Thiếu từ khóa tìm kiếm"
            }), 400
            
        # Chuyển đổi age thành số nếu có
        if age and age.isdigit():
            age = int(age)
        else:
            age = None
            
        # Tìm kiếm dữ liệu
        embedding_model = get_embedding_model()
        results = embedding_model.search_by_content_types(
            query=query, 
            age=age, 
            content_types=["text", "table", "figure"],
            top_k=10
        )
        
        # Định dạng kết quả
        formatted_results = {
            "text": [],
            "table": [],
            "figure": []
        }
        
        for content_type, items in results.items():
            for item in items:
                formatted_item = {
                    "id": item["id"],
                    "content": item["content"][:200] + "..." if len(item["content"]) > 200 else item["content"],
                    "metadata": item["metadata"],
                    "relevance_score": round(item["relevance_score"], 3)
                }
                formatted_results[content_type].append(formatted_item)
        
        return jsonify({
            "success": True,
            "query": query,
            "results": formatted_results
        })
        
    except Exception as e:
        logger.error(f"Lỗi tìm kiếm dữ liệu: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500