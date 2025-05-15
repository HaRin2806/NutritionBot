from flask import Blueprint, request, jsonify
import logging
import time
import threading
from core.rag_pipeline import RAGPipeline
from core.embedding_model import get_embedding_model
from core.data_processor import DataProcessor
from models.user_model import User
from models.conversation_model import Conversation
from bson.objectid import ObjectId
from api.utils import generate_conversation_title

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

# Thêm một hàm để cập nhật tên cuộc trò chuyện trong background
def set_conversation_title_async(conversation, message):
    """Cập nhật tên cuộc trò chuyện bất đồng bộ"""
    try:
        # Tạo tiêu đề tự động
        title = generate_conversation_title(message)
        
        # Cập nhật tiêu đề cho cuộc hội thoại
        conversation.title = title
        conversation.save()
        
        logger.info(f"Đã cập nhật tên cuộc hội thoại: {title}")
        
        # Lưu vết log để gỡ lỗi
        logger.debug(f"Conversation ID: {conversation.conversation_id}, New title: {title}")
        
        # Tại đây bạn có thể thêm cơ chế thông báo (websocket/SSE) nếu cần
        # Bước phát triển tiếp theo: Triển khai Websocket để thông báo real-time
        
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật tên cuộc hội thoại bất đồng bộ: {str(e)}")

@chat_routes.route('/chat', methods=['POST'])
def chat():
    """API endpoint để trò chuyện với chatbot"""
    try:
        data = request.json
        
        # Lấy dữ liệu đầu vào từ frontend React
        message = data.get('message')
        # Lấy thông tin tuổi từ request
        age = data.get('age')
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id')  # Lấy user_id từ request thay vì JWT
        
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
                    # Nếu đây là tin nhắn đầu tiên, hãy tạo tiêu đề tự động
                    is_new_conversation = True
            
            # Nếu không tìm thấy cuộc hội thoại, tạo mới và đặt biến flag
            if not conversation:
                is_new_conversation = True
                # Tạo tiêu đề tạm thời
                title = "Cuộc trò chuyện mới"
                
                conversation = Conversation(
                    user_id=ObjectId(user_id) if ObjectId.is_valid(user_id) else None,
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
            
            # Nếu là cuộc trò chuyện mới, tạo tiêu đề tự động từ tin nhắn đầu tiên
            if is_new_conversation:
                # Tạo tiêu đề mặc định trước
                default_title = message[:50] + ("..." if len(message) > 50 else "")
                conversation.title = default_title
                conversation.save()
                
                # Tạo tiêu đề cuộc trò chuyện trong background
                conversation_title = default_title  # Gán tiêu đề mặc định để trả về trong response
                
                # Tạo và bắt đầu thread để cập nhật tiêu đề
                title_thread = threading.Thread(
                    target=set_conversation_title_async,
                    args=(conversation, message)
                )
                title_thread.daemon = True  # Đảm bảo thread sẽ không chặn ứng dụng kết thúc
                title_thread.start()
                
                logger.info(f"Đã bắt đầu cập nhật tên cuộc hội thoại trong background")
        
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