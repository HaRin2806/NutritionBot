from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Union
import chromadb
from chromadb.config import Settings
import logging
import os
from dotenv import load_dotenv

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Tải biến môi trường
load_dotenv()

# Cấu hình mô hình
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-base")
CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "nutrition_data")
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "5"))

# Singleton pattern để tránh tải lại model nhiều lần
_embedding_model_instance = None

def get_embedding_model():
    """Trả về instance của EmbeddingModel (singleton pattern)"""
    global _embedding_model_instance
    if _embedding_model_instance is None:
        _embedding_model_instance = EmbeddingModel()
    return _embedding_model_instance

class EmbeddingModel:
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        """
        Khởi tạo embedding model và kết nối với ChromaDB.
        
        Args:
            model_name: Tên mô hình embedding (mặc định từ biến môi trường)
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        logger.info(f"Đã tải mô hình embedding: {model_name}")
        
        # Kết nối với ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIRECTORY,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Kiểm tra collection đã tồn tại chưa
        try:
            self.collection = self.chroma_client.get_collection(name=COLLECTION_NAME)
            logger.info(f"Đã kết nối với collection: {COLLECTION_NAME}, số lượng items: {self.collection.count()}")
        except Exception as e:
            # Nếu chưa tồn tại, tạo mới
            logger.info(f"Collection {COLLECTION_NAME} chưa tồn tại, đang tạo mới...")
            self.collection = self.chroma_client.create_collection(name=COLLECTION_NAME)
            logger.info(f"Đã tạo collection mới: {COLLECTION_NAME}")
    
    def get_embedding(self, text: str) -> List[float]:
        """Tính toán embedding vector cho văn bản"""
        if not text or not text.strip():
            logger.warning("Cảnh báo: Đang tạo embedding cho text rỗng")
            return [0.0] * 768  # Trả về vector zero nếu text rỗng
            
        embedding = self.model.encode(text)
        return embedding.tolist()
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Tính toán embedding vectors cho danh sách văn bản"""
        if not texts:
            return []
            
        # Lọc các text rỗng
        valid_texts = [text for text in texts if text and text.strip()]
        if not valid_texts:
            logger.warning("Cảnh báo: Danh sách texts chứa toàn text rỗng")
            return [[0.0] * 768] * len(texts)  # Trả về vector zero cho mỗi text
            
        embeddings = self.model.encode(valid_texts)
        return embeddings.tolist()
    
    def index_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Lập chỉ mục các chunks vào ChromaDB.
        
        Args:
            chunks: Danh sách các chunk cần embedding và lưu trữ
        """
        if not chunks:
            logger.warning("Không có chunks để lập chỉ mục")
            return
        
        ids = []
        documents = []
        metadatas = []
        embeddings = []
        
        for chunk in chunks:
            chunk_id = chunk.get("id")
            content = chunk.get("content", "")
            
            if not chunk_id or not content:
                logger.warning(f"Bỏ qua chunk không hợp lệ: ID={chunk_id}")
                continue
                
            # Chuẩn bị metadata
            metadata = {
                "title": chunk.get("title", ""),
                "content_type": chunk.get("content_type", "text"),
                "summary": chunk.get("summary", ""),
                "pages": chunk.get("pages", ""),
                "word_count": chunk.get("word_count", 0),
                "token_count": chunk.get("token_count", 0),
                "contains_table": chunk.get("contains_table", False),
                "contains_figure": chunk.get("contains_figure", False)
            }
            
            # Thêm age_range vào metadata
            age_range = chunk.get("age_range")
            if age_range and len(age_range) == 2:
                metadata["age_min"] = age_range[0]
                metadata["age_max"] = age_range[1]
            
            # Lưu danh sách các chunks liên quan
            related_chunks = chunk.get("related_chunks", [])
            if related_chunks:
                metadata["related_chunks"] = ",".join(related_chunks)
            
            # Tính embedding vector cho nội dung chunk
            try:
                chunk_embedding = self.get_embedding(content)
            except Exception as e:
                logger.error(f"Lỗi khi tạo embedding cho chunk {chunk_id}: {e}")
                continue
            
            ids.append(chunk_id)
            documents.append(content)
            metadatas.append(metadata)
            embeddings.append(chunk_embedding)
        
        # Thêm chunks vào ChromaDB
        try:
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings
            )
            logger.info(f"Đã lập chỉ mục thành công {len(ids)} chunks")
        except Exception as e:
            logger.error(f"Lỗi khi lập chỉ mục chunks: {e}")

    def count(self):
        """Đếm số lượng items trong collection"""
        try:
            return self.collection.count()
        except Exception as e:
            logger.error(f"Lỗi khi đếm số lượng items: {e}")
            return 0
    
    def search(self, query: str, age: int = None, content_type: str = None, top_k: int = TOP_K_RESULTS) -> List[Dict[str, Any]]:
        """
        Tìm kiếm chunks liên quan đến truy vấn, độ tuổi và loại nội dung.
        
        Args:
            query: Câu truy vấn cần tìm kiếm
            age: Độ tuổi của người dùng (để lọc kết quả)
            content_type: Loại nội dung cần tìm (text, table, figure)
            top_k: Số lượng kết quả tối đa trả về
            
        Returns:
            Danh sách các chunk phù hợp với truy vấn
        """
        # Tạo embedding cho câu truy vấn
        try:
            query_embedding = self.get_embedding(query)
        except Exception as e:
            logger.error(f"Lỗi khi tạo embedding cho truy vấn: {e}")
            return []
        
        # Tạo bộ lọc dựa trên các tham số
        where_filter = {}
        and_filters = []
        
        # Lọc theo độ tuổi
        if age is not None:
            and_filters.append({"age_min": {"$lte": age}})
            and_filters.append({"age_max": {"$gte": age}})
        
        # Lọc theo loại nội dung
        if content_type is not None:
            and_filters.append({"content_type": content_type})
            
        # Ghép các điều kiện lọc
        if and_filters:
            where_filter = {"$and": and_filters}
        
        # Tìm kiếm trong ChromaDB
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter if where_filter else None
            )
            
            # Chuẩn bị kết quả trả về
            matched_chunks = []
            
            if results and "documents" in results and len(results["documents"]) > 0:
                documents = results["documents"][0]
                metadatas = results["metadatas"][0]
                ids = results["ids"][0]
                distances = results.get("distances", [[]])[0]
                
                for i in range(len(ids)):
                    chunk = {
                        "id": ids[i],
                        "content": documents[i],
                        "metadata": metadatas[i],
                        "relevance_score": 1.0 - (distances[i] if i < len(distances) else 0)
                    }
                    
                    # Xử lý related_chunks từ chuỗi trở lại thành list
                    if "related_chunks" in metadatas[i]:
                        chunk["metadata"]["related_chunks"] = metadatas[i]["related_chunks"].split(",")
                    
                    matched_chunks.append(chunk)
            
            return matched_chunks
        
        except Exception as e:
            logger.error(f"Lỗi khi tìm kiếm: {e}")
            return []
    
    def get_related_chunks(self, chunk_id: str) -> List[Dict[str, Any]]:
        """Lấy danh sách các chunks liên quan đến một chunk cụ thể"""
        try:
            # Lấy thông tin của chunk gốc
            result = self.collection.get(ids=[chunk_id])
            
            if not result or not result["metadatas"]:
                return []
            
            # Lấy danh sách IDs của các chunks liên quan
            related_ids_str = result["metadatas"][0].get("related_chunks", "")
            if not related_ids_str:
                return []
                
            related_ids = related_ids_str.split(",")
            
            # Lấy thông tin chi tiết của các chunks liên quan
            related_results = self.collection.get(ids=related_ids)
            
            related_chunks = []
            if related_results and "documents" in related_results:
                for i in range(len(related_results["ids"])):
                    related_chunk = {
                        "id": related_results["ids"][i],
                        "content": related_results["documents"][i],
                        "metadata": related_results["metadatas"][i]
                    }
                    related_chunks.append(related_chunk)
            
            return related_chunks
            
        except Exception as e:
            logger.error(f"Lỗi khi lấy chunks liên quan: {e}")
            return []
            
    def search_by_content_types(self, query: str, age: int = None, content_types: List[str] = None, top_k: int = TOP_K_RESULTS) -> Dict[str, List[Dict[str, Any]]]:
        """
        Tìm kiếm chunks theo nhiều loại nội dung khác nhau.
        
        Args:
            query: Câu truy vấn
            age: Độ tuổi người dùng
            content_types: Danh sách các loại nội dung cần tìm
            top_k: Số lượng kết quả tối đa cho mỗi loại
            
        Returns:
            Kết quả tìm kiếm theo từng loại nội dung
        """
        if not content_types:
            content_types = ["text", "table", "figure"]
            
        results_by_type = {}
        
        for content_type in content_types:
            results = self.search(
                query=query, 
                age=age, 
                content_type=content_type, 
                top_k=top_k
            )
            results_by_type[content_type] = results
            
        return results_by_type
    
    def rerank_results(self, query: str, results: List[Dict[str, Any]], top_k: int = None) -> List[Dict[str, Any]]:
        """
        Xếp hạng lại kết quả tìm kiếm dựa trên độ tương đồng với truy vấn.
        
        Args:
            query: Câu truy vấn gốc
            results: Danh sách kết quả cần xếp hạng lại
            top_k: Số lượng kết quả tối đa trả về sau khi xếp hạng lại
            
        Returns:
            Danh sách kết quả đã được xếp hạng lại
        """
        if not results or not query:
            return results
        
        if top_k is None:
            top_k = len(results)
        
        # Chỉ xếp hạng lại nếu có nhiều hơn 1 kết quả
        if len(results) <= 1:
            return results
        
        try:
            # Tạo embedding cho query
            query_embedding = self.get_embedding(query)
            
            # Tính toán điểm tương đồng cho mỗi kết quả
            for result in results:
                content = result.get("content", "")
                
                # Tạo embedding cho nội dung và tính toán độ tương đồng
                content_embedding = self.get_embedding(content)
                
                # Tính toán cosine similarity
                similarity = np.dot(query_embedding, content_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(content_embedding)
                )
                
                # Cập nhật điểm tương đồng
                result["similarity_score"] = float(similarity)
            
            # Sắp xếp kết quả theo điểm tương đồng giảm dần
            results.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
            
            # Giới hạn số lượng kết quả
            return results[:top_k]
            
        except Exception as e:
            logger.error(f"Lỗi khi xếp hạng lại kết quả: {e}")
            return results
    
    def fine_tune_embedding(self, queries: List[str], relevant_docs: List[List[str]], irrelevant_docs: List[List[str]] = None):
        """
        Hiện tại là phương thức giả mạo để chuẩn bị cho việc fine-tune embedding trong tương lai.
        Sẽ được triển khai đầy đủ khi cần thiết.
        
        Args:
            queries: Danh sách các câu truy vấn huấn luyện
            relevant_docs: Danh sách các tài liệu liên quan cho mỗi truy vấn
            irrelevant_docs: Danh sách các tài liệu không liên quan cho mỗi truy vấn
        """
        logger.info("Phương thức fine_tune_embedding hiện chưa được triển khai đầy đủ")
        logger.info(f"Đã nhận {len(queries)} truy vấn huấn luyện")
        # Phương thức này sẽ được triển khai đầy đủ trong các phiên bản sau