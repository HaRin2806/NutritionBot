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
        figure_dir = os.path.join(current_dir, '..', 'data', bai_id, 'figures')
        figure_dir = os.path.abspath(figure_dir)
        
        # Kiểm tra xem thư mục có tồn tại không
        if os.path.exists(figure_dir) and os.path.isdir(figure_dir):
            if os.path.exists(os.path.join(figure_dir, filename)):
                return send_from_directory(figure_dir, filename)
        print("Đường dẫn hình ảnh:", os.path.join(figure_dir, filename))
        # Nếu không tìm thấy, log lỗi
        logger.error(f"Không tìm thấy hình ảnh: {os.path.join(figure_dir, filename)}")
        return jsonify({"error": "Không tìm thấy hình ảnh"}), 404
    except Exception as e:
        logger.error(f"Lỗi khi tải hình ảnh: {str(e)}")
        return jsonify({"error": f"Lỗi máy chủ: {str(e)}"}), 500

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