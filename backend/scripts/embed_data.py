import os
import sys
import time
import argparse
import logging

# Thêm thư mục cha vào sys.path để import các module từ thư mục rag_api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_processor import DataProcessor
from embedding_model import EmbeddingModel
from embedding_checker import check_embeddings, re_embed_missing_data

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("embed_data.log")
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
    logger.info(f"Bắt đầu quá trình embedding dữ liệu từ {data_dir}")
    start_time = time.time()
    
    # Khởi tạo các components
    data_processor = DataProcessor(data_dir=data_dir)
    embedding_model = EmbeddingModel()
    
    # Kiểm tra xem có chỉ mục hiện có không
    collection_size = embedding_model.count()
    if collection_size > 0 and not force:
        logger.info(f"Đã tồn tại chỉ mục với {collection_size} items")
        check_result = check_embeddings()
        
        # Nếu có items bị thiếu, hỏi xem có muốn embedding lại không
        if check_result["missing_ids"]:
            logger.info(f"Có {len(check_result['missing_ids'])} items chưa được embedding")
            re_embed_missing_data()
            logger.info("Đã hoàn thành embedding các items còn thiếu")
        else:
            logger.info("Tất cả items đã được embedding đầy đủ")
        
        end_time = time.time()
        logger.info(f"Hoàn thành kiểm tra và cập nhật chỉ mục trong {end_time - start_time:.2f} giây")
        return
    
    # Nếu buộc tạo lại hoặc chưa có chỉ mục, tạo mới
    if force:
        logger.info("Xóa chỉ mục cũ và tạo lại...")
        try:
            embedding_model.chroma_client.delete_collection(name=embedding_model.collection.name)
            # Tạo lại collection mới
            embedding_model.collection = embedding_model.chroma_client.create_collection(name=embedding_model.collection.name)
            logger.info("Đã xóa và tạo lại collection")
        except Exception as e:
            logger.error(f"Lỗi khi xóa collection: {e}")
    
    # Chuẩn bị dữ liệu cho embedding
    logger.info("Đang chuẩn bị dữ liệu cho quá trình embedding...")
    all_items = data_processor.prepare_for_embedding()
    logger.info(f"Đã chuẩn bị {len(all_items)} items để embedding")
    
    # Thống kê các loại dữ liệu
    text_chunks = len([item for item in all_items if item.get("content_type") == "text"])
    tables = len([item for item in all_items if item.get("content_type") == "table"])
    figures = len([item for item in all_items if item.get("content_type") == "figure"])
    
    logger.info(f"Bao gồm: {text_chunks} văn bản, {tables} bảng biểu, {figures} hình ảnh")
    
    # Thực hiện embedding
    logger.info("Bắt đầu quá trình embedding...")
    batch_size = 50  # Batch size phù hợp, tùy chỉnh nếu cần
    
    # Chia thành các batch nhỏ để xử lý
    for i in range(0, len(all_items), batch_size):
        batch = all_items[i:i + batch_size]
        logger.info(f"Đang xử lý batch {i//batch_size + 1}/{(len(all_items) + batch_size - 1)//batch_size}, kích thước: {len(batch)}")
        embedding_model.index_chunks(batch)
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    # Kiểm tra kết quả cuối cùng
    final_count = embedding_model.count()
    logger.info(f"Hoàn thành quá trình embedding {final_count} items trong {elapsed_time:.2f} giây")
    
    # Kiểm tra xem có items không
    check_embeddings()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Embedding dữ liệu cho hệ thống Nutribot")
    parser.add_argument("--data-dir", type=str, default="data", 
                        help="Đường dẫn đến thư mục chứa dữ liệu (mặc định: ../data)")
    parser.add_argument("--force", action="store_true", 
                        help="Xóa và tạo lại chỉ mục nếu đã tồn tại")
    
    args = parser.parse_args()
    
    # Chuẩn hóa đường dẫn
    data_dir = os.path.abspath(args.data_dir)
    
    # Kiểm tra thư mục data có tồn tại không
    if not os.path.exists(data_dir):
        logger.error(f"Thư mục {data_dir} không tồn tại!")
        sys.exit(1)
    
    # Thực hiện embedding
    embed_all_data(data_dir, args.force)