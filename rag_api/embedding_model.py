from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Union
import chromadb
from chromadb.config import Settings
import config

class EmbeddingModel:
    def __init__(self, model_name: str = config.EMBEDDING_MODEL):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.chroma_client = chromadb.PersistentClient(
            path=config.CHROMA_PERSIST_DIRECTORY,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Kiểm tra collection đã tồn tại chưa
        try:
            self.collection = self.chroma_client.get_collection(name=config.COLLECTION_NAME)
        except:
            # Nếu chưa tồn tại, tạo mới
            self.collection = self.chroma_client.create_collection(name=config.COLLECTION_NAME)
    
    def get_embedding(self, text: str) -> List[float]:
        """Tính toán embedding vector cho văn bản"""
        embedding = self.model.encode(text)
        return embedding.tolist()
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Tính toán embedding vectors cho danh sách văn bản"""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
    
    def index_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """Lập chỉ mục các chunks vào ChromaDB"""
        if not chunks:
            print("Không có chunks để lập chỉ mục")
            return
        
        ids = []
        documents = []
        metadatas = []
        embeddings = []
        
        for chunk in chunks:
            chunk_id = chunk.get("id")
            content = chunk.get("content", "")
            
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
            chunk_embedding = self.get_embedding(content)
            
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
            print(f"Đã lập chỉ mục thành công {len(ids)} chunks")
        except Exception as e:
            print(f"Lỗi khi lập chỉ mục chunks: {e}")

    def count(self):
        """Đếm số lượng items trong collection"""
        try:
            return self.collection.count()
        except Exception as e:
            print(f"Lỗi khi đếm số lượng items: {e}")
            return 0
    
    def search(self, query: str, age: int = None, content_type: str = None, top_k: int = config.TOP_K_RESULTS) -> List[Dict[str, Any]]:
        """Tìm kiếm chunks liên quan đến truy vấn, độ tuổi và loại nội dung (nếu có)"""
        # Tạo embedding cho câu truy vấn
        query_embedding = self.get_embedding(query)
        
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
            print(f"Lỗi khi tìm kiếm: {e}")
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
            print(f"Lỗi khi lấy chunks liên quan: {e}")
            return []
            
    def search_by_content_types(self, query: str, age: int = None, content_types: List[str] = None, top_k: int = config.TOP_K_RESULTS) -> Dict[str, List[Dict[str, Any]]]:
        """Tìm kiếm chunks theo nhiều loại nội dung khác nhau"""
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