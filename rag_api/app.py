from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import logging
import time
import os
from data_processor import DataProcessor
from embedding_model import EmbeddingModel
from rag_pipeline import RAGPipeline
from auth import register_user, login_user, get_user_profile, update_user_profile, change_password

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

# Cấu hình JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 24 * 60 * 60  # 1 ngày
jwt = JWTManager(app)

# Đường dẫn đến thư mục dữ liệu
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, "..", "data")
data_dir = os.path.abspath(data_dir)
logger.info(f"Thư mục dữ liệu: {data_dir}")

# Khởi tạo components - Tối ưu hóa để không tải lại dữ liệu khi không cần thiết
# Chỉ tải metadata và không thực hiện embedding tự động
def get_data_processor():
    # Sử dụng lazy loading để tải dữ liệu chỉ khi cần
    return DataProcessor(data_dir=data_dir)

def get_embedding_model():
    # Kết nối đến ChromaDB đã có sẵn các embedding
    return EmbeddingModel()

def get_rag_pipeline(data_processor=None, embedding_model=None):
    # Tạo RAG pipeline với các components đã được khởi tạo
    if not data_processor:
        data_processor = get_data_processor()
    if not embedding_model:
        embedding_model = get_embedding_model()
    return RAGPipeline(data_processor, embedding_model)

# Khởi tạo các components cần thiết
embedding_model = get_embedding_model()
collection_count = embedding_model.count()
logger.info(f"Đã tìm thấy {collection_count} items đã được embedding trong database.")

# Kiểm tra nếu chưa có dữ liệu nào được embedding
if collection_count == 0:
    logger.warning("Chưa có dữ liệu nào được embedding. Vui lòng chạy script embed_data.py trước khi sử dụng API.")
    logger.info("Ví dụ: python scripts/embed_data.py --data-dir ../data")

@app.route('/api/health', methods=['GET'])
def health_check():
    """API endpoint để kiểm tra trạng thái của server"""
    return jsonify({
        "status": "healthy",
        "message": "Server đang hoạt động",
        "time": time.strftime('%Y-%m-%d %H:%M:%S'),
        "data_items": embedding_model.count()
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    """API endpoint để đăng ký người dùng mới"""
    try:
        data = request.json
        
        name = data.get('fullName')
        email = data.get('email')
        password = data.get('password')
        age = data.get('age')
        gender = data.get('gender')
        
        success, result = register_user(name, email, password, age, gender)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Đăng ký thành công",
                "user_id": result.get("user_id")
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi đăng ký người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """API endpoint để đăng nhập"""
    try:
        data = request.json
        
        email = data.get('email')
        password = data.get('password')
        
        success, result = login_user(email, password)
        
        if success:
            return jsonify({
                "success": True,
                "access_token": result.get("access_token"),
                "user": result.get("user")
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 401
            
    except Exception as e:
        logger.error(f"Lỗi đăng nhập: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def user_profile():
    """API endpoint để lấy thông tin người dùng"""
    try:
        user_id = get_jwt_identity()
        profile = get_user_profile(user_id)
        
        if profile:
            return jsonify({
                "success": True,
                "user": profile
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy thông tin người dùng"
            }), 404
            
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """API endpoint để cập nhật thông tin người dùng"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        name = data.get('name')
        age = data.get('age')
        gender = data.get('gender')
        
        success, message = update_user_profile(user_id, name, age, gender)
        
        if success:
            return jsonify({
                "success": True,
                "message": message
            })
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi cập nhật thông tin người dùng: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/user/change-password', methods=['POST'])
@jwt_required()
def update_password():
    """API endpoint để đổi mật khẩu"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        success, message = change_password(user_id, current_password, new_password)
        
        if success:
            return jsonify({
                "success": True,
                "message": message
            })
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi đổi mật khẩu: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/chat', methods=['POST'])
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
                profile = get_user_profile(user_id)
                if profile:
                    age = profile.get('age')
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Vui lòng nhập tin nhắn",
                "reply": "Tôi không hiểu câu hỏi của bạn. Vui lòng thử lại."
            }), 400
        
        logger.info(f"Nhận câu hỏi: {message}")
        logger.info(f"Độ tuổi người dùng: {age}")
        
        # Tạo RAG pipeline mới cho mỗi request (để đảm bảo thread-safe)
        rag_pipeline = get_rag_pipeline(embedding_model=embedding_model)
        
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

@app.route('/api/figures/<path:bai_id>/<path:filename>', methods=['GET'])
def serve_figure(bai_id, filename):
    """API endpoint để phục vụ hình ảnh theo bài"""
    try:
        # Đường dẫn chính xác đến thư mục figures
        figure_dir = os.path.join(data_dir, bai_id, 'figures')
        figure_dir = os.path.abspath(figure_dir)
        
        # Kiểm tra xem thư mục có tồn tại không
        if os.path.exists(figure_dir) and os.path.isdir(figure_dir):
            for ext in ['', '.png', '.jpg', '.jpeg', '.gif', '.svg']:
                # Kiểm tra với nhiều phần mở rộng khác nhau
                file_to_check = os.path.join(figure_dir, filename + ext)
                if os.path.exists(file_to_check):
                    return send_from_directory(figure_dir, filename + ext)
        
        logger.error(f"Không tìm thấy hình ảnh: {os.path.join(figure_dir, filename)}")
        return jsonify({"error": "Không tìm thấy hình ảnh"}), 404
        
    except Exception as e:
        logger.error(f"Lỗi khi tải hình ảnh: {str(e)}")
        return jsonify({"error": f"Lỗi máy chủ: {str(e)}"}), 500

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    """API endpoint để lấy thông tin metadata của tài liệu"""
    try:
        # Tạo data_processor mới để lấy metadata
        data_processor = get_data_processor()
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
    # Chạy Flask app trong mode debug (có thể tắt debug bằng cách đặt debug=False)
    app.run(host='0.0.0.0', port=5000, debug=False)