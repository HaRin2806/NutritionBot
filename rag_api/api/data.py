from flask import Blueprint, request, jsonify, send_from_directory
import os
import logging
from core.data_processor import DataProcessor

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
data_routes = Blueprint('data', __name__)

# Đường dẫn đến thư mục dữ liệu
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(current_dir, "..", "data")
data_dir = os.path.abspath(data_dir)

@data_routes.route('/figures/<path:bai_id>/<path:filename>', methods=['GET'])
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

@data_routes.route('/metadata', methods=['GET'])
def get_metadata():
    """API endpoint để lấy thông tin metadata của tài liệu"""
    try:
        # Tạo data_processor mới để lấy metadata
        data_processor = DataProcessor(data_dir=data_dir)
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