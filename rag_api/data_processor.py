import os
import json
import re
from typing import Dict, List, Any, Union, Tuple

class DataProcessor:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.metadata = {}
        self.chunks = []
        self.tables = []
        self.figures = []
        self._load_all_data()
    
    def _load_all_data(self):
        """Tải tất cả dữ liệu từ các thư mục con trong data"""
        print(f"Thư mục data: {self.data_dir}")
        print(f"Các items trong thư mục data: {os.listdir(self.data_dir)}")
        
        # Kiểm tra thư mục data có tồn tại không
        if not os.path.exists(self.data_dir):
            print(f"Thư mục data không tồn tại: {self.data_dir}")
            return

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
                                print(f"File metadata trống: {metadata_file}")
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
                        
                        print(f"Đã tải xong thư mục: {item}")
                    except json.JSONDecodeError as e:
                        print(f"Lỗi đọc file JSON {metadata_file}: {e}")
                    except Exception as e:
                        print(f"Lỗi khi tải metadata từ {metadata_file}: {e}")

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
                # Nếu không tìm thấy file, tạo nội dung mẫu
                chunk_data["content"] = f"Nội dung cho {chunk_id} không tìm thấy."
                print(f"Không tìm thấy file chunk: {chunk_path}")
            
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
                print(f"Không tìm thấy file bảng: {table_path}")
            
            self.tables.append(table_data)
        
        # Tải figures
        for figure_meta in folder_metadata.get("figures", []):
            figure_id = figure_meta.get("id")
            figure_path = os.path.join(folder_path, "figures", f"{figure_id}.md")
            
            figure_data = figure_meta.copy()
            
            # Thêm nội dung từ file markdown nếu tồn tại
            if os.path.exists(figure_path):
                with open(figure_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                figure_data["content"] = self._extract_content_from_markdown(content)
            else:
                figure_data["content"] = f"Hình {figure_id} không tìm thấy."
                print(f"Không tìm thấy file hình: {figure_path}")
            
            # Thêm đường dẫn đến file hình ảnh nếu có
            image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
            for ext in image_extensions:
                image_path = os.path.join(folder_path, "figures", f"{figure_id}{ext}")
                if os.path.exists(image_path):
                    figure_data["image_path"] = image_path
                    break
            
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
                    
                    print(f"Đã tải dữ liệu: {data_id}, loại: {content_type}")
                else:
                    print(f"Không tìm thấy file dữ liệu: {data_path}")
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
            embedding_item = {
                "id": chunk.get("id"),
                "title": chunk.get("title", ""),
                "content": chunk.get("content", ""),
                "content_type": chunk.get("content_type", "text"),
                "age_range": chunk.get("age_range", [0, 100]),
                "summary": chunk.get("summary", ""),
                "pages": chunk.get("pages", ""),
                "related_chunks": chunk.get("related_chunks", []),
                "word_count": chunk.get("word_count", 0),
                "token_count": chunk.get("token_count", 0),
                "contains_table": chunk.get("contains_table", False),
                "contains_figure": chunk.get("contains_figure", False)
            }
            all_items.append(embedding_item)
        
        # Thêm tables
        for table in self.tables:
            embedding_item = {
                "id": table.get("id"),
                "title": table.get("title", ""),
                "content": table.get("content", ""),
                "content_type": "table",
                "age_range": table.get("age_range", [0, 100]),
                "summary": table.get("summary", ""),
                "pages": table.get("pages", ""),
                "related_chunks": table.get("related_chunks", []),
                "table_columns": table.get("table_columns", []),
                "word_count": table.get("word_count", 0),
                "token_count": table.get("token_count", 0)
            }
            all_items.append(embedding_item)
        
        # Thêm figures
        for figure in self.figures:
            embedding_item = {
                "id": figure.get("id"),
                "title": figure.get("title", ""),
                "content": figure.get("content", ""),
                "content_type": "figure",
                "age_range": figure.get("age_range", [0, 100]),
                "summary": figure.get("summary", ""),
                "pages": figure.get("pages", ""),
                "related_chunks": figure.get("related_chunks", []),
                "image_path": figure.get("image_path", "")
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