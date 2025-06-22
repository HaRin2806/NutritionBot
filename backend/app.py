from flask import Flask
from flask_cors import CORS
import logging
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
import datetime
from api.admin import admin_routes

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
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "hathimylinh")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=24)
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_SECURE'] = False
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

# Cấu hình upload files cho admin
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

jwt = JWTManager(app)

# Cho phép CORS từ frontend React với credentials
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"], 
        "supports_credentials": True
    }
})

# Đăng ký các API endpoints cho user
from api.auth import auth_routes
from api.chat import chat_routes
from api.data import data_routes
from api.history import history_routes
from api.feedback import feedback_routes


# Đăng ký các blueprint cho user
app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(chat_routes, url_prefix='/api')
app.register_blueprint(data_routes, url_prefix='/api')
app.register_blueprint(history_routes, url_prefix='/api')
app.register_blueprint(feedback_routes, url_prefix='/api')

# Đăng ký các blueprint cho admin
app.register_blueprint(admin_routes, url_prefix='/api/admin')

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

@app.route('/api/admin/init', methods=['POST'])
def init_admin():
    """API endpoint để khởi tạo admin đầu tiên"""
    try:
        from models.admin_model import AdminUser
        
        success, result = AdminUser.create_default_super_admin()
        
        if success:
            return jsonify({
                "success": True,
                "message": "Khởi tạo admin thành công",
                "admin_info": result
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        logger.error(f"Lỗi khởi tạo admin: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Tạo super admin mặc định nếu chưa có
    try:
        from models.admin_model import AdminUser
        success, result = AdminUser.create_default_super_admin()
        if success and "email" in result:
            logger.info("=== THÔNG TIN ADMIN ===")
            logger.info(f"Email: {result['email']}")
            logger.info(f"Password: {result['password']}")
            logger.info("======================")
    except Exception as e:
        logger.error(f"Lỗi tạo super admin: {e}")

    # Tạo indexes cho feedback
    try:
        from models.feedback_model import ensure_indexes
        ensure_indexes()
    except Exception as e:
        logger.error(f"Lỗi tạo feedback indexes: {e}")
    
    # Chạy Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)