import os
import sys
import time
import argparse
import logging

# Set UTF-8 encoding cho console
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Thêm thư mục cha vào sys.path để import các module từ thư mục backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.data_processor import DataProcessor
from core.embedding_model import get_embedding_model

# Cấu hình logging với UTF-8
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("embed_data.log", encoding='utf-8')
    ]
)
logger = logging.getLogger("embed_data")

def embed_all_data(data_dir, force=False):
    """
    Embedding tất cả dữ liệu từ thư mục data
    
    Args:
        data_dir: Đường dẫn đến thư mục chứa dữ liệu
        force: Nếu True, sẽ xóa và tạo lại chỉ mục hiện có
    """
    logger.info(f"Bat dau qua trinh embedding du lieu tu {data_dir}")
    start_time = time.time()
    
    # Khởi tạo các components
    data_processor = DataProcessor(data_dir=data_dir)
    embedding_model = get_embedding_model()
    
    # Kiểm tra xem có chỉ mục hiện có không
    collection_size = embedding_model.count()
    if collection_size > 0 and not force:
        logger.info(f"Da ton tai chi muc voi {collection_size} items")
        end_time = time.time()
        logger.info(f"Hoan thanh kiem tra chi muc trong {end_time - start_time:.2f} giay")
        logger.info("Su dung --force de tao lai chi muc")
        return
    
    # Nếu buộc tạo lại hoặc chưa có chỉ mục, tạo mới
    if force:
        logger.info("Xoa chi muc cu va tao lai...")
        try:
            embedding_model.chroma_client.delete_collection(name=embedding_model.collection.name)
            # Tạo lại collection mới
            embedding_model.collection = embedding_model.chroma_client.create_collection(name=embedding_model.collection.name)
            logger.info("Da xoa va tao lai collection")
        except Exception as e:
            logger.error(f"Loi khi xoa collection: {e}")
    
    # Chuẩn bị dữ liệu cho embedding
    logger.info("Dang chuan bi du lieu cho qua trinh embedding...")
    all_items = data_processor.prepare_for_embedding()
    logger.info(f"Da chuan bi {len(all_items)} items de embedding")
    
    # Thống kê các loại dữ liệu
    text_chunks = len([item for item in all_items if item.get("metadata", {}).get("content_type") == "text"])
    tables = len([item for item in all_items if item.get("metadata", {}).get("content_type") == "table"])
    figures = len([item for item in all_items if item.get("metadata", {}).get("content_type") == "figure"])
    
    logger.info(f"Bao gom: {text_chunks} van ban, {tables} bang bieu, {figures} hinh anh")
    
    # Thực hiện embedding
    logger.info("Bat dau qua trinh embedding...")
    batch_size = 50  # Batch size phù hợp, tùy chỉnh nếu cần
    
    # Chia thành các batch nhỏ để xử lý
    for i in range(0, len(all_items), batch_size):
        batch = all_items[i:i + batch_size]
        logger.info(f"Dang xu ly batch {i//batch_size + 1}/{(len(all_items) + batch_size - 1)//batch_size}, kich thuoc: {len(batch)}")
        success = embedding_model.index_chunks(batch)
        if not success:
            logger.error(f"Loi xu ly batch {i//batch_size + 1}")
            return
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    # Kiểm tra kết quả cuối cùng
    final_count = embedding_model.count()
    logger.info(f"Hoan thanh qua trinh embedding {final_count} items trong {elapsed_time:.2f} giay")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Embedding du lieu cho he thong Nutribot")
    parser.add_argument("--data-dir", type=str, default="data", 
                        help="Duong dan den thu muc chua du lieu (mac dinh: data)")
    parser.add_argument("--force", action="store_true", 
                        help="Xoa va tao lai chi muc neu da ton tai")
    
    args = parser.parse_args()
    
    # Chuẩn hóa đường dẫn
    data_dir = os.path.abspath(args.data_dir)
    
    # Kiểm tra thư mục data có tồn tại không
    if not os.path.exists(data_dir):
        logger.error(f"Thu muc {data_dir} khong ton tai!")
        sys.exit(1)
    
    # Thực hiện embedding
    embed_all_data(data_dir, args.force)