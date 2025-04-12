from typing import Dict, List, Any, Optional
import google.generativeai as genai
from config import GEMINI_API_KEY, SYSTEM_PROMPT, HUMAN_PROMPT_TEMPLATE, TOP_K_RESULTS, TEMPERATURE, MAX_OUTPUT_TOKENS
from data_processor import DataProcessor
from embedding_model import EmbeddingModel

# Cấu hình Gemini API
genai.configure(api_key=GEMINI_API_KEY)

class RAGPipeline:
    def __init__(self, data_processor: DataProcessor = None, embedding_model: EmbeddingModel = None):
        """Khởi tạo RAG Pipeline"""
        self.data_processor = data_processor or DataProcessor()
        self.embedding_model = embedding_model or EmbeddingModel()
        
        # Không cần embedding tự động ở đây vì đã được thực hiện trong app.py
        # self._check_and_index_chunks()
        
        # Khởi tạo mô hình Gemini
        self.generation_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "temperature": TEMPERATURE,
                "max_output_tokens": MAX_OUTPUT_TOKENS,
                "top_p": 0.95,
            }
        )
    
    def process_query(self, query: str, age: int = None, top_k: int = TOP_K_RESULTS) -> Dict[str, Any]:
        """Xử lý câu hỏi và trả về kết quả"""
        try:
            # Tiền xử lý truy vấn
            processed_query = self.data_processor.preprocess_query(query)
            
            # Tìm kiếm các items liên quan (văn bản, bảng, hình ảnh)
            results_by_type = self.embedding_model.search_by_content_types(
                processed_query, 
                age=age, 
                content_types=["text", "table", "figure"], 
                top_k=top_k
            )
            
            # Gộp các kết quả
            relevant_items = []
            relevant_items.extend(results_by_type.get("text", []))
            relevant_items.extend(results_by_type.get("table", []))
            relevant_items.extend(results_by_type.get("figure", []))
            
            # Sắp xếp theo độ liên quan
            relevant_items.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            # Giới hạn số lượng kết quả
            relevant_items = relevant_items[:top_k]
            
            # Nếu không tìm thấy kết quả nào phù hợp
            if not relevant_items:
                return {
                    "answer": "Tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong tài liệu. "
                            "Xin vui lòng hỏi câu hỏi khác về dinh dưỡng và an toàn thực phẩm.",
                    "contexts": [],
                    "sources": [],
                    "query": query,
                    "success": True
                }
            
            # Định dạng ngữ cảnh từ các items
            contexts = []
            sources = []
            
            for item in relevant_items:
                context_item = {
                    "id": item["id"],
                    "content": item["content"],
                    "metadata": item["metadata"],
                    "relevance_score": item["relevance_score"]
                }
                contexts.append(context_item)
                
                # Thêm nguồn dữ liệu
                source_item = {
                    "id": item["id"],
                    "title": item["metadata"].get("title", ""),
                    "content_type": item["metadata"].get("content_type", "text"),
                    "pages": item["metadata"].get("pages", "")
                }
                sources.append(source_item)
            
            # Định dạng ngữ cảnh cho RAG
            formatted_contexts = self.data_processor.format_context_for_rag(
                [{"id": c["id"], 
                  "title": c["metadata"].get("title", ""), 
                  "content": c["content"],
                  "content_type": c["metadata"].get("content_type", "text")
                 } for c in contexts]
            )
            
            # Tạo prompt cho Gemini bằng cách kết hợp system prompt và user prompt
            age_text = f"{age} tuổi" if age is not None else "chưa xác định"
            combined_prompt = f"{SYSTEM_PROMPT}\n\n{HUMAN_PROMPT_TEMPLATE.format(query=query, age=age_text, contexts=formatted_contexts)}"
            # print("Combined Prompt:", combined_prompt)  # Debugging line
            # Gọi Gemini API
            response = self.generation_model.generate_content(
                combined_prompt
            )
            # print("Gemini Response:", response)  # Debugging line
            # print("="*20)
            # Định dạng kết quả trả về
            return {
                "answer": response.text,
                "contexts": contexts,
                "sources": sources,
                "query": query,
                "success": True
            }
            
        except Exception as e:
            print(f"Lỗi khi xử lý truy vấn: {e}")
            return {
                "answer": "Rất tiếc, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
                "contexts": [],
                "sources": [],
                "query": query,
                "success": False,
                "error": str(e)
            }