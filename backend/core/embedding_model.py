import logging
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import uuid
from config import EMBEDDING_MODEL, CHROMA_PERSIST_DIRECTORY, COLLECTION_NAME

# Cấu hình logging
logger = logging.getLogger(__name__)

# Global instance để implement singleton pattern
_embedding_model_instance = None

def get_embedding_model():
    """
    Singleton pattern để đảm bảo chỉ có một instance của EmbeddingModel
    """
    global _embedding_model_instance
    if _embedding_model_instance is None:
        logger.info("Khởi tạo EmbeddingModel instance lần đầu")
        _embedding_model_instance = EmbeddingModel()
    else:
        logger.debug("Sử dụng EmbeddingModel instance đã có")
    return _embedding_model_instance

class EmbeddingModel:
    def __init__(self):
        """Khởi tạo embedding model và ChromaDB client"""
        logger.info(f"Đang khởi tạo embedding model: {EMBEDDING_MODEL}")
        
        # Khởi tạo sentence transformer
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        logger.info("Đã tải sentence transformer model")
        
        # Khởi tạo ChromaDB client với persistent storage
        self.chroma_client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIRECTORY,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        logger.info(f"Đã kết nối ChromaDB tại: {CHROMA_PERSIST_DIRECTORY}")
        
        # Lấy hoặc tạo collection
        try:
            self.collection = self.chroma_client.get_collection(name=COLLECTION_NAME)
            logger.info(f"Đã kết nối collection '{COLLECTION_NAME}' với {self.collection.count()} items")
        except Exception:
            logger.warning(f"Collection '{COLLECTION_NAME}' không tồn tại, tạo mới...")
            self.collection = self.chroma_client.create_collection(name=COLLECTION_NAME)
            logger.info(f"Đã tạo collection mới: {COLLECTION_NAME}")
    
    def encode(self, texts):
        """
        Encode văn bản thành embeddings
        
        Args:
            texts (str or list): Văn bản hoặc danh sách văn bản cần encode
            
        Returns:
            list: Embeddings vector
        """
        try:
            if isinstance(texts, str):
                texts = [texts]
            
            logger.debug(f"Đang encode {len(texts)} văn bản")
            embeddings = self.model.encode(texts, show_progress_bar=False)
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Lỗi encode văn bản: {e}")
            raise
    
    def search(self, query, top_k=5, age_filter=None):
        """
        Tìm kiếm văn bản tương tự trong ChromaDB
        
        Args:
            query (str): Câu hỏi cần tìm kiếm
            top_k (int): Số lượng kết quả trả về
            age_filter (int): Lọc theo độ tuổi (optional)
            
        Returns:
            list: Danh sách kết quả tìm kiếm
        """
        try:
            logger.debug(f"Dang tim kiem cho query: {query[:50]}...")
            
            # Encode query thành embedding
            query_embedding = self.encode(query)[0]
            
            # Tạo where clause cho age filter
            where_clause = None
            if age_filter:
                where_clause = {
                    "$and": [
                        {"age_min": {"$lte": age_filter}},
                        {"age_max": {"$gte": age_filter}}
                    ]
                }
            
            # Thực hiện search trong ChromaDB
            search_results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_clause,
                include=['documents', 'metadatas', 'distances']
            )
            
            if not search_results or not search_results['documents']:
                logger.warning("Khong tim thay ket qua nao")
                return []
            
            # Format kết quả
            results = []
            documents = search_results['documents'][0]
            metadatas = search_results['metadatas'][0]
            distances = search_results['distances'][0]
            
            for i, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
                results.append({
                    'document': doc,
                    'metadata': metadata or {},
                    'distance': distance,
                    'similarity': 1 - distance,  # Chuyển distance thành similarity
                    'rank': i + 1
                })
            
            logger.info(f"Tim thay {len(results)} ket qua cho query")
            return results
            
        except Exception as e:
            logger.error(f"Loi tim kiem: {e}")
            return []
    
    def add_documents(self, documents, metadatas=None, ids=None):
        """
        Thêm documents vào ChromaDB
        
        Args:
            documents (list): Danh sách văn bản
            metadatas (list): Danh sách metadata tương ứng
            ids (list): Danh sách ID tương ứng (optional)
            
        Returns:
            bool: True nếu thành công
        """
        try:
            if not documents:
                logger.warning("Không có documents để thêm")
                return False
            
            # Tạo IDs nếu không được cung cấp
            if not ids:
                ids = [str(uuid.uuid4()) for _ in documents]
            
            # Tạo metadatas rỗng nếu không được cung cấp
            if not metadatas:
                metadatas = [{} for _ in documents]
            
            logger.info(f"Đang thêm {len(documents)} documents vào ChromaDB")
            
            # Encode documents thành embeddings
            embeddings = self.encode(documents)
            
            # Thêm vào collection
            self.collection.add(
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Đã thêm thành công {len(documents)} documents")
            return True
            
        except Exception as e:
            logger.error(f"Lỗi thêm documents: {e}")
            return False
    
    def index_chunks(self, chunks):
        """
        Index các chunks dữ liệu vào ChromaDB
        
        Args:
            chunks (list): Danh sách chunks với format:
                [
                    {
                        "content": "nội dung văn bản",
                        "metadata": {"chapter": "bai1", "age_group": "1-3", ...},
                        "id": "unique_id" (optional)
                    }
                ]
        
        Returns:
            bool: True nếu thành công
        """
        try:
            if not chunks:
                logger.warning("Không có chunks để index")
                return False
            
            documents = []
            metadatas = []
            ids = []
            
            for chunk in chunks:
                if not chunk.get('content'):
                    logger.warning(f"Chunk thiếu content: {chunk}")
                    continue
                
                documents.append(chunk['content'])
                
                # Lấy metadata đã được chuẩn bị sẵn
                metadata = chunk.get('metadata', {})
                metadatas.append(metadata)
                
                # Sử dụng ID có sẵn hoặc tạo mới
                chunk_id = chunk.get('id') or str(uuid.uuid4())
                ids.append(chunk_id)
            
            if not documents:
                logger.warning("Không có documents hợp lệ để index")
                return False
            
            # Batch processing để tránh overload
            batch_size = 100
            total_batches = (len(documents) + batch_size - 1) // batch_size
            
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i + batch_size]
                batch_metas = metadatas[i:i + batch_size]
                batch_ids = ids[i:i + batch_size]
                
                batch_num = (i // batch_size) + 1
                logger.info(f"Đang xử lý batch {batch_num}/{total_batches} ({len(batch_docs)} items)")
                
                success = self.add_documents(batch_docs, batch_metas, batch_ids)
                if not success:
                    logger.error(f"Lỗi xử lý batch {batch_num}")
                    return False
            
            logger.info(f"Đã index thành công {len(documents)} chunks")
            return True
            
        except Exception as e:
            logger.error(f"Lỗi index chunks: {e}")
            return False
    
    def count(self):
        """
        Đếm số lượng documents trong collection
        
        Returns:
            int: Số lượng documents
        """
        try:
            return self.collection.count()
        except Exception as e:
            logger.error(f"Lỗi đếm documents: {e}")
            return 0
    
    def delete_collection(self):
        """
        Xóa collection hiện tại
        
        Returns:
            bool: True nếu thành công
        """
        try:
            logger.warning(f"Đang xóa collection: {COLLECTION_NAME}")
            self.chroma_client.delete_collection(name=COLLECTION_NAME)
            
            # Tạo lại collection mới
            self.collection = self.chroma_client.create_collection(name=COLLECTION_NAME)
            logger.info("Đã tạo lại collection mới")
            
            return True
            
        except Exception as e:
            logger.error(f"Lỗi xóa collection: {e}")
            return False
    
    def get_stats(self):
        """
        Lấy thống kê về collection
        
        Returns:
            dict: Thông tin thống kê
        """
        try:
            total_count = self.count()
            
            # Lấy sample để phân tích metadata
            sample_results = self.collection.get(limit=min(100, total_count))
            
            # Thống kê content types
            content_types = {}
            chapters = {}
            age_groups = {}
            
            if sample_results and sample_results.get('metadatas'):
                for metadata in sample_results['metadatas']:
                    if not metadata:
                        continue
                    
                    # Content type stats
                    content_type = metadata.get('content_type', 'unknown')
                    content_types[content_type] = content_types.get(content_type, 0) + 1
                    
                    # Chapter stats
                    chapter = metadata.get('chapter', 'unknown')
                    chapters[chapter] = chapters.get(chapter, 0) + 1
                    
                    # Age group stats
                    age_group = metadata.get('age_group', 'unknown')
                    age_groups[age_group] = age_groups.get(age_group, 0) + 1
            
            return {
                'total_documents': total_count,
                'content_types': content_types,
                'chapters': chapters,
                'age_groups': age_groups,
                'collection_name': COLLECTION_NAME,
                'embedding_model': EMBEDDING_MODEL
            }
            
        except Exception as e:
            logger.error(f"Lỗi lấy stats: {e}")
            return {
                'total_documents': 0,
                'error': str(e)
            }