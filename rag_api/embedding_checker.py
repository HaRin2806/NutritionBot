import os
import json
from typing import Dict, List, Any, Set
from data_processor import DataProcessor
from embedding_model import EmbeddingModel
import chromadb
from chromadb.config import Settings
import config

def check_embeddings():
    """
    Kiểm tra xem tất cả dữ liệu đã được embedding hay chưa
    """
    print("===== BẮT ĐẦU KIỂM TRA EMBEDDING =====")
    
    # 1. Khởi tạo data_processor để lấy tất cả dữ liệu
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "..", "data")
    data_dir = os.path.abspath(data_dir)
    
    data_processor = DataProcessor(data_dir=data_dir)
    
    # 2. Lấy danh sách tất cả items từ data_processor
    all_data = data_processor.get_all_items()
    chunks = all_data["chunks"]
    tables = all_data["tables"]
    figures = all_data["figures"]
    phuluc_data = all_data.get("phuluc_data", [])
    
    # 3. Tổng hợp tất cả IDs từ data đã load
    loaded_ids = set()
    for item in chunks + tables + figures + phuluc_data:
        item_id = item.get("id")
        if item_id:
            loaded_ids.add(item_id)
    
    # 4. Kết nối với ChromaDB để lấy danh sách IDs đã được embedding
    chroma_client = chromadb.PersistentClient(
        path=config.CHROMA_PERSIST_DIRECTORY,
        settings=Settings(anonymized_telemetry=False)
    )
    
    try:
        collection = chroma_client.get_collection(name=config.COLLECTION_NAME)
        # Lấy tất cả IDs đã được embedding
        embedded_data = collection.get()
        embedded_ids = set(embedded_data["ids"])
    except Exception as e:
        print(f"Lỗi khi kết nối với ChromaDB: {e}")
        embedded_ids = set()
    
    # 5. So sánh và báo cáo kết quả
    missing_ids = loaded_ids - embedded_ids
    
    print(f"Tổng số items đã load: {len(loaded_ids)}")
    print(f"Tổng số items đã embedding: {len(embedded_ids)}")
    
    # Kiểm tra các loại dữ liệu
    print(f"\nThống kê chi tiết:")
    print(f"- Số lượng chunk văn bản: {len(chunks)}")
    print(f"- Số lượng bảng: {len(tables)}")
    print(f"- Số lượng hình ảnh: {len(figures)}")
    print(f"- Số lượng phụ lục: {len(phuluc_data)}")
    
    # Kiểm tra các ID bắt đầu bằng phuluc
    phuluc_loaded = [id for id in loaded_ids if id.startswith("phuluc")]
    phuluc_embedded = [id for id in embedded_ids if id.startswith("phuluc")]
    
    print(f"\nKiểm tra phụ lục:")
    print(f"- Số lượng phụ lục đã load: {len(phuluc_loaded)}")
    print(f"- Số lượng phụ lục đã embedding: {len(phuluc_embedded)}")
    
    if missing_ids:
        print(f"\nCó {len(missing_ids)} items chưa được embedding:")
        for missing_id in sorted(list(missing_ids)):
            print(f"- {missing_id}")
    else:
        print("\nTất cả items đã được embedding thành công!")
    
    # Kiểm tra các ID có trong embedding nhưng không có trong dữ liệu đã load
    extra_ids = embedded_ids - loaded_ids
    if extra_ids:
        print(f"\nCó {len(extra_ids)} items đã embedding nhưng không có trong dữ liệu hiện tại:")
        for extra_id in sorted(list(extra_ids)):
            print(f"- {extra_id}")
    
    print("\n===== KẾT THÚC KIỂM TRA EMBEDDING =====")
    
    return {
        "loaded_ids": loaded_ids,
        "embedded_ids": embedded_ids,
        "missing_ids": missing_ids,
        "extra_ids": extra_ids
    }

def re_embed_missing_data():
    """
    Tìm và embedding lại các dữ liệu bị thiếu
    """
    print("===== BẮT ĐẦU RE-EMBEDDING DỮ LIỆU THIẾU =====")
    
    # 1. Kiểm tra và lấy danh sách IDs bị thiếu
    check_result = check_embeddings()
    missing_ids = check_result["missing_ids"]
    
    if not missing_ids:
        print("Không có dữ liệu nào bị thiếu. Không cần re-embedding.")
        return
    
    # 2. Khởi tạo các components
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "..", "data")
    data_dir = os.path.abspath(data_dir)
    
    data_processor = DataProcessor(data_dir=data_dir)
    embedding_model = EmbeddingModel()
    
    # 3. Lấy tất cả items từ data_processor
    all_items = data_processor.prepare_for_embedding()
    
    # 4. Lọc ra các items cần embedding lại
    items_to_embed = []
    for item in all_items:
        if item["id"] in missing_ids:
            items_to_embed.append(item)
    
    # 5. Thực hiện embedding
    if items_to_embed:
        print(f"Đang embedding lại {len(items_to_embed)} items...")
        embedding_model.index_chunks(items_to_embed)
        print(f"Đã hoàn thành re-embedding {len(items_to_embed)} items.")
    
    # 6. Kiểm tra lại sau khi embedding
    print("\nKiểm tra lại sau khi re-embedding:")
    check_embeddings()
    
    print("\n===== KẾT THÚC RE-EMBEDDING DỮ LIỆU THIẾU =====")

if __name__ == "__main__":
    # Chạy kiểm tra embedding
    check_result = check_embeddings()
    
    # Nếu có dữ liệu bị thiếu, hỏi người dùng có muốn embedding lại không
    if check_result["missing_ids"]:
        user_input = input("\nBạn có muốn embedding lại các dữ liệu bị thiếu không? (y/n): ")
        if user_input.lower() == 'y':
            re_embed_missing_data()