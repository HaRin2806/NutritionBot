from flask import Flask
from flask_cors import CORS
import logging
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
import datetime

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tải biến môi trường
load_dotenv()

# Khởi tạo Flask app
app = Flask(__name__)

# Cấu hình JWT
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "hathimylinh")  # Dùng secret key từ .env
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)  # Token hết hạn sau 1 giờ
jwt = JWTManager(app)

# Cho phép CORS từ frontend React
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Đăng ký các API endpoints
from api.auth import auth_routes
from api.chat import chat_routes
from api.data import data_routes
from api.history import history_routes

# Đăng ký các blueprint
app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(chat_routes, url_prefix='/api')
app.register_blueprint(data_routes, url_prefix='/api')
app.register_blueprint(history_routes, url_prefix='/api')

@app.route('/api/health', methods=['GET'])
def health_check():
    """API endpoint để kiểm tra trạng thái của server"""
    from flask import jsonify
    import time
    from core.embedding_model import get_embedding_model
    
    embedding_model = get_embedding_model()
    collection_count = embedding_model.count()
    
    return jsonify({
        "status": "healthy",
        "message": "Server đang hoạt động",
        "time": time.strftime('%Y-%m-%d %H:%M:%S'),
        "data_items": collection_count
    })

if __name__ == '__main__':
    # Chạy Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)