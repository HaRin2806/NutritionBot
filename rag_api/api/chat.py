from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import time
from core.rag_pipeline import RAGPipeline
from core.embedding_model import get_embedding_model
from core.data_processor import DataProcessor
from models.user_model import User
from models.conversation_model import Conversation
from bson.objectid import ObjectId

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

@chat_routes.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat():
    """API endpoint để trò chuyện với chatbot"""
    try:
        data = request.json
        
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
        
        # Nếu user đã đăng nhập
        user_id = get_jwt_identity()
        
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
        
        # Lưu trữ tin nhắn vào conversation nếu có conversation_id
        if user_id:
            # Tìm hoặc tạo cuộc hội thoại
            conversation = None
            
            if conversation_id:
                # Tìm cuộc hội thoại hiện có
                conversation = Conversation.find_by_id(conversation_id)
                
                # Kiểm tra quyền truy cập
                if conversation and str(conversation.user_id) != user_id:
                    conversation = None
            
            # Nếu không tìm thấy cuộc hội thoại hoặc không có quyền truy cập, tạo mới
            if not conversation:
                # Tạo tiêu đề từ nội dung tin nhắn (đơn giản)
                words = message.split()
                title = " ".join(words[:5]) if len(words) > 0 else "Cuộc trò chuyện mới"
                if len(title) > 50:
                    title = title[:47] + "..."
                
                conversation = Conversation(
                    user_id=ObjectId(user_id),
                    title=title,
                    age_context=age
                )
                conversation.save()
                conversation_id = str(conversation.conversation_id)
            
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
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Lỗi xử lý yêu cầu: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "reply": "Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau."
        }), 500