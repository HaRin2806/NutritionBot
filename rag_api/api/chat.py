from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import time
from core.rag_pipeline import RAGPipeline
from core.embedding_model import get_embedding_model
from core.data_processor import DataProcessor
from models.user_model import User

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
        # Lấy thông tin tuổi nếu có trong request
        age = data.get('age')
        
        # Nếu user đã đăng nhập, lấy thông tin tuổi từ profile nếu không có trong request
        if not age:
            user_id = get_jwt_identity()
            if user_id:
                user = User.find_by_id(user_id)
                if user:
                    age = user.age
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập tin nhắn",
                "reply": "Tôi không hiểu câu hỏi của bạn. Vui lòng thử lại."
            }), 400
        
        logger.info(f"Nhận câu hỏi: {message}")
        logger.info(f"Độ tuổi người dùng: {age}")
        
        # Tạo RAG pipeline mới cho mỗi request (để đảm bảo thread-safe)
        rag_pipeline = get_rag_pipeline()
        
        # Xử lý câu hỏi qua RAG pipeline
        result = rag_pipeline.process_query(message, age)
        
        # Định dạng kết quả cho frontend
        return jsonify({
            "success": True,
            "reply": result["answer"],
            "contexts": result.get("contexts", []),
            "sources": result.get("sources", []),
            "query": result.get("query", message)
        })
        
    except Exception as e:
        logger.error(f"Lỗi xử lý yêu cầu: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "reply": "Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau."
        }), 500