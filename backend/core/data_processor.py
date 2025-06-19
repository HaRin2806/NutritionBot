import os
import json
import re
import logging
import datetime
from typing import Dict, List, Any, Union, Tuple

# Cấu hình logging
logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.metadata = {}
        self.chunks = []
        self.tables = []
        self.figures = []
        
        logger.info(f"Khởi tạo DataProcessor với data_dir: {data_dir}")
        if not os.path.exists(self.data_dir):
            logger.error(f"Thư mục data không tồn tại: {self.data_dir}")
        else:
            self._load_all_data()
    
    def _load_all_data(self):
        """Tải tất cả dữ liệu từ các thư mục con trong data"""
        logger.info(f"Đang tải dữ liệu từ thư mục: {self.data_dir}")
        
        # Quét qua tất cả thư mục trong data
        for item in os.listdir(self.data_dir):
            folder_path = os.path.join(self.data_dir, item)
            
            # Kiểm tra xem đây có phải là thư mục không
            if os.path.isdir(folder_path):
                metadata_file = os.path.join(folder_path, "metadata.json")
                
                # Nếu có file metadata.json
                if os.path.exists(metadata_file):
                    try:
                        # Tải metadata
                        with open(metadata_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if not content.strip():
                                logger.warning(f"File metadata trống: {metadata_file}")
                                continue
                            folder_metadata = json.loads(content)
                        
                        # Xác định ID của thư mục
                        folder_id = None
                        if "bai_info" in folder_metadata:
                            folder_id = folder_metadata["bai_info"].get("id", item)
                        elif "phuluc_info" in folder_metadata:
                            folder_id = folder_metadata["phuluc_info"].get("id", item)
                        else:
                            folder_id = item
                        
                        # Lưu metadata vào từ điển
                        self.metadata[folder_id] = folder_metadata
                        
                        # Tải tất cả chunks, tables và figures
                        self._load_content_from_metadata(folder_path, folder_metadata)
                        
                        logger.info(f"Đã tải xong thư mục: {item}")
                    except json.JSONDecodeError as e:
                        logger.error(f"Lỗi đọc file JSON {metadata_file}: {e}")
                    except Exception as e:
                        logger.error(f"Lỗi khi tải metadata từ {metadata_file}: {e}")

    def _load_content_from_metadata(self, folder_path: str, folder_metadata: Dict[str, Any]):
        """Tải nội dung chunks, tables và figures từ metadata"""
        # Tải chunks
        for chunk_meta in folder_metadata.get("chunks", []):
            chunk_id = chunk_meta.get("id")
            chunk_path = os.path.join(folder_path, "chunks", f"{chunk_id}.md")
            
            chunk_data = chunk_meta.copy()  # Sao chép metadata của chunk
            
            # Thêm nội dung từ file markdown nếu tồn tại
            if os.path.exists(chunk_path):
                with open(chunk_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                chunk_data["content"] = self._extract_content_from_markdown(content)
            else:
                # Nếu không tìm thấy file, tạo nội dung mẫu và ghi log ở debug level
                chunk_data["content"] = f"Nội dung cho {chunk_id} không tìm thấy."
                logger.debug(f"Không tìm thấy file chunk: {chunk_path}")
            
            self.chunks.append(chunk_data)
        
        # Tải tables
        for table_meta in folder_metadata.get("tables", []):
            table_id = table_meta.get("id")
            table_path = os.path.join(folder_path, "tables", f"{table_id}.md")
            
            table_data = table_meta.copy()
            
            # Thêm nội dung từ file markdown nếu tồn tại
            if os.path.exists(table_path):
                with open(table_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                table_data["content"] = self._extract_content_from_markdown(content)
            else:
                table_data["content"] = f"Bảng {table_id} không tìm thấy."
                logger.debug(f"Không tìm thấy file bảng: {table_path}")
            
            self.tables.append(table_data)
        
        # Tải figures
        for figure_meta in folder_metadata.get("figures", []):
            figure_id = figure_meta.get("id")
            figure_path = os.path.join(folder_path, "figures", f"{figure_id}.md")
            figure_data = figure_meta.copy()
            
            # Thêm nội dung từ file markdown nếu tồn tại
            content_loaded = False
            if os.path.exists(figure_path):
                with open(figure_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                figure_data["content"] = self._extract_content_from_markdown(content)
                content_loaded = True
            
            # Thêm đường dẫn đến file hình ảnh nếu có
            image_path = None
            image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
            for ext in image_extensions:
                img_path = os.path.join(folder_path, "figures", f"{figure_id}{ext}")
                if os.path.exists(img_path):
                    image_path = img_path
                    break
            
            if image_path:
                figure_data["image_path"] = image_path
                # Tạo nội dung mặc định nếu không có file markdown
                if not content_loaded:
                    figure_caption = figure_meta.get("title", f"Hình {figure_id}")
                    figure_data["content"] = f"![{figure_caption}]({image_path})"
            elif not content_loaded:
                # Nếu không có cả file markdown và file hình
                figure_data["content"] = f"Hình {figure_id} không tìm thấy."
                logger.debug(f"Không tìm thấy file hình cho {figure_id}")
            
            self.figures.append(figure_data)
        
        # Tải data_files (trường hợp phụ lục)
        if "data_files" in folder_metadata:
            for data_file_meta in folder_metadata.get("data_files", []):
                data_id = data_file_meta.get("id")
                data_path = os.path.join(folder_path, "data", f"{data_id}.md")
                
                data_file = data_file_meta.copy()
                
                # Thêm nội dung từ file markdown nếu tồn tại
                if os.path.exists(data_path):
                    with open(data_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    data_file["content"] = self._extract_content_from_markdown(content)
                    
                    # Xác định loại nội dung
                    content_type = data_file.get("content_type", "table")
                    
                    # Thêm vào danh sách phù hợp dựa trên loại nội dung
                    if content_type == "table":
                        self.tables.append(data_file)
                    elif content_type == "text":
                        self.chunks.append(data_file)
                    elif content_type == "figure":
                        self.figures.append(data_file)
                    
                    logger.debug(f"Đã tải dữ liệu: {data_id}, loại: {content_type}")
                else:
                    logger.debug(f"Không tìm thấy file dữ liệu: {data_path}")
                    data_file["content"] = f"Dữ liệu {data_id} không tìm thấy."
    
    def _extract_content_from_markdown(self, md_content: str) -> str:
        """Trích xuất nội dung từ markdown, bỏ qua phần frontmatter"""
        # Tách frontmatter (nằm giữa "---")
        if md_content.startswith("---"):
            parts = md_content.split("---", 2)
            if len(parts) >= 3:
                return parts[2].strip()
        return md_content
    
    def get_all_items(self) -> Dict[str, List[Dict[str, Any]]]:
        """Trả về tất cả các items đã tải"""
        return {
            "chunks": self.chunks,
            "tables": self.tables,
            "figures": self.figures
        }
    
    def get_all_metadata(self) -> Dict[str, Any]:
        """Trả về tất cả metadata của các bài học và phụ lục"""
        return self.metadata
    
    def get_chunk_by_id(self, chunk_id: str) -> Union[Dict[str, Any], None]:
        """Tìm và trả về chunk theo ID"""
        for chunk in self.chunks:
            if chunk.get("id") == chunk_id:
                return chunk
        return None
    
    def get_table_by_id(self, table_id: str) -> Union[Dict[str, Any], None]:
        """Tìm và trả về bảng theo ID"""
        for table in self.tables:
            if table.get("id") == table_id:
                return table
        return None
    
    def get_figure_by_id(self, figure_id: str) -> Union[Dict[str, Any], None]:
        """Tìm và trả về hình theo ID"""
        for figure in self.figures:
            if figure.get("id") == figure_id:
                return figure
        return None
    
    def find_items_by_age(self, age: int) -> Dict[str, List[Dict[str, Any]]]:
        """Tìm các items (chunks, tables, figures) liên quan đến độ tuổi của người dùng"""
        relevant_chunks = []
        relevant_tables = []
        relevant_figures = []
        
        # Lọc chunks
        for chunk in self.chunks:
            age_range = chunk.get("age_range", [0, 100])
            if len(age_range) == 2 and age_range[0] <= age <= age_range[1]:
                relevant_chunks.append(chunk)
        
        # Lọc tables
        for table in self.tables:
            age_range = table.get("age_range", [0, 100])
            if len(age_range) == 2 and age_range[0] <= age <= age_range[1]:
                relevant_tables.append(table)
        
        # Lọc figures
        for figure in self.figures:
            age_range = figure.get("age_range", [0, 100])
            if len(age_range) == 2 and age_range[0] <= age <= age_range[1]:
                relevant_figures.append(figure)
        
        return {
            "chunks": relevant_chunks,
            "tables": relevant_tables,
            "figures": relevant_figures
        }
    
    def get_related_items(self, item_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Tìm các items liên quan đến một item cụ thể dựa vào related_chunks"""
        related_chunks = []
        related_tables = []
        related_figures = []
        
        # Tìm item gốc
        source_item = None
        for item in self.chunks + self.tables + self.figures:
            if item.get("id") == item_id:
                source_item = item
                break
        
        if not source_item:
            return {
                "chunks": [],
                "tables": [],
                "figures": []
            }
        
        # Lấy danh sách IDs của các items liên quan
        related_ids = source_item.get("related_chunks", [])
        
        # Tìm các items liên quan
        for related_id in related_ids:
            # Tìm trong chunks
            for chunk in self.chunks:
                if chunk.get("id") == related_id:
                    related_chunks.append(chunk)
                    break
            
            # Tìm trong tables
            for table in self.tables:
                if table.get("id") == related_id:
                    related_tables.append(table)
                    break
            
            # Tìm trong figures
            for figure in self.figures:
                if figure.get("id") == related_id:
                    related_figures.append(figure)
                    break
        
        return {
            "chunks": related_chunks,
            "tables": related_tables,
            "figures": related_figures
        }
    
    def preprocess_query(self, query: str) -> str:
        """Tiền xử lý câu truy vấn"""
        # Loại bỏ ký tự đặc biệt
        query = re.sub(r'[^\w\s\d]', ' ', query)
        # Loại bỏ khoảng trắng thừa
        query = re.sub(r'\s+', ' ', query).strip()
        return query
    
    def format_context_for_rag(self, items: List[Dict[str, Any]]) -> str:
        """Định dạng các items để đưa vào ngữ cảnh cho mô hình RAG"""
        formatted_contexts = []
        
        for i, item in enumerate(items, 1):
            item_id = item.get("id", "")
            title = item.get("title", "")
            content = item.get("content", "")
            content_type = item.get("content_type", "text")
            
            # Nếu là bảng, thêm tiêu đề "Bảng:"
            if content_type == "table":
                title = f"Bảng: {title}"
            # Nếu là hình, thêm tiêu đề "Hình:"
            elif content_type == "figure":
                title = f"Hình: {title}"
            
            formatted_context = f"[{i}] {title}\n\n{content}\n\n"
            formatted_contexts.append(formatted_context)
        
        return "\n".join(formatted_contexts)
    
    def prepare_for_embedding(self) -> List[Dict[str, Any]]:
        """Chuẩn bị dữ liệu cho việc nhúng (embedding)"""
        all_items = []
        
        # Thêm chunks
        for chunk in self.chunks:
            # Tìm chapter từ chunk ID
            chunk_id = chunk.get("id", "")
            chapter = "unknown"
            if chunk_id.startswith("bai1_"):
                chapter = "bai1"
            elif chunk_id.startswith("bai2_"):
                chapter = "bai2"
            elif chunk_id.startswith("bai3_"):
                chapter = "bai3"
            elif chunk_id.startswith("bai4_"):
                chapter = "bai4"
            elif "phuluc" in chunk_id.lower():
                chapter = "phuluc"
            
            content = chunk.get("content", "")
            if chunk.get("title"):
                content = f"Tiêu đề: {chunk.get('title')}\n\nNội dung: {content}"
            
            # Xử lý age_range - convert list thành string và tách thành min/max
            age_range = chunk.get("age_range", [0, 100])
            age_min = age_range[0] if len(age_range) > 0 else 0
            age_max = age_range[1] if len(age_range) > 1 else 100
            age_range_str = f"{age_min}-{age_max}"
            
            # Xử lý related_chunks - convert list thành string
            related_chunks = chunk.get("related_chunks", [])
            related_chunks_str = ",".join(related_chunks) if related_chunks else ""
            
            embedding_item = {
                "content": content,
                "metadata": {
                    "chunk_id": chunk_id,
                    "chapter": chapter,
                    "title": chunk.get("title", ""),
                    "content_type": chunk.get("content_type", "text"),
                    "age_range": age_range_str,
                    "age_min": age_min,
                    "age_max": age_max,
                    "summary": chunk.get("summary", ""),
                    "pages": chunk.get("pages", ""),
                    "related_chunks": related_chunks_str,
                    "word_count": chunk.get("word_count", 0),
                    "token_count": chunk.get("token_count", 0),
                    "contains_table": chunk.get("contains_table", False),
                    "contains_figure": chunk.get("contains_figure", False),
                    "created_at": datetime.datetime.now().isoformat()
                },
                "id": chunk_id
            }
            all_items.append(embedding_item)
        
        # Thêm tables
        for table in self.tables:
            # Tìm chapter từ table ID
            table_id = table.get("id", "")
            chapter = "unknown"
            if table_id.startswith("bai1_"):
                chapter = "bai1"
            elif table_id.startswith("bai2_"):
                chapter = "bai2"
            elif table_id.startswith("bai3_"):
                chapter = "bai3"
            elif table_id.startswith("bai4_"):
                chapter = "bai4"
            elif "phuluc" in table_id.lower():
                chapter = "phuluc"
            
            content = table.get("content", "")
            if table.get("title"):
                content = f"Bảng: {table.get('title')}\n\nNội dung: {content}"
            
            # Xử lý age_range
            age_range = table.get("age_range", [0, 100])
            age_min = age_range[0] if len(age_range) > 0 else 0
            age_max = age_range[1] if len(age_range) > 1 else 100
            age_range_str = f"{age_min}-{age_max}"
            
            # Xử lý related_chunks và table_columns
            related_chunks = table.get("related_chunks", [])
            related_chunks_str = ",".join(related_chunks) if related_chunks else ""
            table_columns = table.get("table_columns", [])
            table_columns_str = ",".join(table_columns) if table_columns else ""
            
            embedding_item = {
                "content": content,
                "metadata": {
                    "chunk_id": table_id,
                    "chapter": chapter,
                    "title": table.get("title", ""),
                    "content_type": "table",
                    "age_range": age_range_str,
                    "age_min": age_min,
                    "age_max": age_max,
                    "summary": table.get("summary", ""),
                    "pages": table.get("pages", ""),
                    "related_chunks": related_chunks_str,
                    "table_columns": table_columns_str,
                    "word_count": table.get("word_count", 0),
                    "token_count": table.get("token_count", 0),
                    "created_at": datetime.datetime.now().isoformat()
                },
                "id": table_id
            }
            all_items.append(embedding_item)
        
        # Thêm figures
        for figure in self.figures:
            # Tìm chapter từ figure ID
            figure_id = figure.get("id", "")
            chapter = "unknown"
            if figure_id.startswith("bai1_"):
                chapter = "bai1"
            elif figure_id.startswith("bai2_"):
                chapter = "bai2"
            elif figure_id.startswith("bai3_"):
                chapter = "bai3"
            elif figure_id.startswith("bai4_"):
                chapter = "bai4"
            elif "phuluc" in figure_id.lower():
                chapter = "phuluc"
            
            content = figure.get("content", "")
            if figure.get("title"):
                content = f"Hình: {figure.get('title')}\n\nMô tả: {content}"
            
            # Xử lý age_range
            age_range = figure.get("age_range", [0, 100])
            age_min = age_range[0] if len(age_range) > 0 else 0
            age_max = age_range[1] if len(age_range) > 1 else 100
            age_range_str = f"{age_min}-{age_max}"
            
            # Xử lý related_chunks
            related_chunks = figure.get("related_chunks", [])
            related_chunks_str = ",".join(related_chunks) if related_chunks else ""
            
            embedding_item = {
                "content": content,
                "metadata": {
                    "chunk_id": figure_id,
                    "chapter": chapter,
                    "title": figure.get("title", ""),
                    "content_type": "figure",
                    "age_range": age_range_str,
                    "age_min": age_min,
                    "age_max": age_max,
                    "summary": figure.get("summary", ""),
                    "pages": figure.get("pages", ""),
                    "related_chunks": related_chunks_str,
                    "image_path": figure.get("image_path", ""),
                    "created_at": datetime.datetime.now().isoformat()
                },
                "id": figure_id
            }
            all_items.append(embedding_item)
        
        return all_items
    
    def count_items_by_prefix(self, prefix: str) -> Dict[str, int]:
        """Đếm số lượng items theo tiền tố ID"""
        chunks_count = sum(1 for chunk in self.chunks if chunk.get("id", "").startswith(prefix))
        tables_count = sum(1 for table in self.tables if table.get("id", "").startswith(prefix))
        figures_count = sum(1 for figure in self.figures if figure.get("id", "").startswith(prefix))
        
        return {
            "chunks": chunks_count,
            "tables": tables_count,
            "figures": figures_count,
            "total": chunks_count + tables_count + figures_count
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê về dữ liệu đã tải"""
        stats = {
            "total_chunks": len(self.chunks),
            "total_tables": len(self.tables),
            "total_figures": len(self.figures),
            "total_items": len(self.chunks) + len(self.tables) + len(self.figures),
            "by_lesson": {},
            "by_age": {}
        }
        
        # Thống kê theo bài
        for item in os.listdir(self.data_dir):
            if os.path.isdir(os.path.join(self.data_dir, item)):
                item_stats = self.count_items_by_prefix(f"{item}_")
                stats["by_lesson"][item] = item_stats
        
        # Thống kê theo độ tuổi
        age_ranges = {}
        for chunk in self.chunks + self.tables + self.figures:
            age_range = chunk.get("age_range", [0, 100])
            if len(age_range) == 2:
                range_key = f"{age_range[0]}-{age_range[1]}"
                if range_key not in age_ranges:
                    age_ranges[range_key] = 0
                age_ranges[range_key] += 1
        
        stats["by_age"] = age_ranges
        
        return stats