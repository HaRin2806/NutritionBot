from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging
import time
import os
from data_processor import DataProcessor
from embedding_model import EmbeddingModel
from rag_pipeline import RAGPipeline

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Khởi tạo Flask app
app = Flask(__name__)
# Cho phép CORS từ frontend React
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Khởi tạo components
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, "..", "data")
data_dir = os.path.abspath(data_dir)

data_processor = DataProcessor(data_dir=data_dir)
embedding_model = EmbeddingModel()
rag_pipeline = RAGPipeline(data_processor, embedding_model)

def initialize_index():
    """Hàm khởi tạo chỉ mục - chỉ chạy một lần khi cần thiết"""
    try:
        collection_stats = embedding_model.collection.count()
        if collection_stats > 0:
            logger.info(f"Đã tồn tại chỉ mục với {collection_stats} items. Bỏ qua quá trình lập chỉ mục.")
            return
        
        logger.info("Bắt đầu quá trình lập chỉ mục...")
        
        # Chuẩn bị dữ liệu cho embedding
        all_items = data_processor.prepare_for_embedding()
        
        # Lập chỉ mục tất cả items
        embedding_model.index_chunks(all_items)
        
        logger.info(f"Đã lập chỉ mục thành công {len(all_items)} items")
        
        # Thống kê số lượng theo loại
        text_chunks = len([item for item in all_items if item.get("content_type") == "text"])
        tables = len([item for item in all_items if item.get("content_type") == "table"])
        figures = len([item for item in all_items if item.get("content_type") == "figure"])
        
        logger.info(f"Thống kê: {text_chunks} văn bản, {tables} bảng biểu, {figures} hình ảnh")
        
    except Exception as e:
        logger.error(f"Lỗi khi lập chỉ mục ban đầu: {str(e)}")

# Khởi tạo chỉ mục - chỉ chạy một lần khi server khởi động
initialize_index()

@app.route('/api/health', methods=['GET'])
def health_check():
    """API endpoint để kiểm tra trạng thái của server"""
    return jsonify({
        "status": "healthy",
        "message": "Server đang hoạt động",
        "time": time.strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """API endpoint để trò chuyện với chatbot"""
    try:
        data = request.json
        
        # Lấy dữ liệu đầu vào từ frontend React
        message = data.get('message')
        # Lấy thông tin tuổi nếu có trong request
        age = data.get('age')
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập tin nhắn",
                "reply": "Tôi không hiểu câu hỏi của bạn. Vui lòng thử lại."
            }), 400
        
        logger.info(f"Nhận câu hỏi: {message}")
        logger.info(f"Độ tuổi người dùng: {age}")
        
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

@app.route('/api/user', methods=['POST'])
def register_user():
    """API endpoint để đăng ký người dùng mới hoặc cập nhật thông tin"""
    try:
        data = request.json
        
        name = data.get('name')
        age = data.get('age')
        
        if not name or not age:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập đầy đủ tên và tuổi",
            }), 400
        
        # Kiểm tra tuổi hợp lệ (1-19 tuổi cho tài liệu dinh dưỡng học sinh)
        try:
            age = int(age)
            if age < 1 or age > 19:
                return jsonify({
                    "success": False,
                    "error": "Tuổi phải nằm trong khoảng từ 1 đến 19",
                }), 400
        except ValueError:
            return jsonify({
                "success": False,
                "error": "Tuổi phải là một số nguyên",
            }), 400
        
        # Ở đây bạn có thể lưu thông tin người dùng vào cơ sở dữ liệu
        # Nhưng hiện tại chúng ta chỉ giả lập
        
        return jsonify({
            "success": True,
            "message": "Đăng ký thành công",
            "user": {
                "id": str(int(time.time())),  # ID giả lập
                "name": name,
                "age": age
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi đăng ký người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500

@app.route('/api/figures/<path:filename>', methods=['GET'])
def serve_figure(filename):
    """API endpoint để phục vụ hình ảnh"""
    # Tìm thư mục chứa hình ảnh
    for item in os.listdir('data'):
        figure_dir = os.path.join('data', item, 'figures')
        if os.path.exists(figure_dir) and os.path.isdir(figure_dir):
            if os.path.exists(os.path.join(figure_dir, filename)):
                return send_from_directory(figure_dir, filename)
    
    return jsonify({"error": "Không tìm thấy hình ảnh"}), 404

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    """API endpoint để lấy thông tin metadata của tài liệu"""
    try:
        metadata = data_processor.get_all_metadata()
        return jsonify({
            "success": True,
            "metadata": metadata
        })
    except Exception as e:
        logger.error(f"Lỗi khi lấy metadata: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Chạy Flask app mà không cần lập chỉ mục lại ở đây
    app.run(host='0.0.0.0', port=5000, debug=True)