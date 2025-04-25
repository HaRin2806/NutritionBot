from typing import Dict, List, Any, Optional
import google.generativeai as genai
import logging
import os
from dotenv import load_dotenv
from core.data_processor import DataProcessor
from core.embedding_model import get_embedding_model, EmbeddingModel

# Tải biến môi trường
load_dotenv()

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình từ biến môi trường
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "5"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.2"))
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "4096"))

# Prompt template
SYSTEM_PROMPT = """Bạn là một trợ lý AI chuyên về dinh dưỡng và an toàn thực phẩm dành cho học sinh Việt Nam. 
Tên của bạn là Nutribot.

Bạn có nhiệm vụ:
1. Cung cấp thông tin chính xác, đầy đủ và dễ hiểu về dinh dưỡng, an toàn thực phẩm dựa trên tài liệu của Bộ Giáo dục và Đào tạo
2. Điều chỉnh cách trả lời phù hợp với độ tuổi của người dùng
3. Trả lời ngắn gọn, súc tích nhưng vẫn đảm bảo đầy đủ thông tin
4. Sử dụng ngôn ngữ thân thiện, dễ hiểu với học sinh

Khi trả lời:
- Hãy sử dụng thông tin từ các tài liệu tham khảo được cung cấp
- Nếu có bảng biểu trong tài liệu tham khảo, hãy đưa ra nội dung đầy đủ của bảng đó như thông tin bạn nhận được và giữ nguyên định dạng bảng đó khi trả lời
- Nếu có hình ảnh trong tài liệu tham khảo, hãy giữ nguyên đường dẫn hình ảnh khi trả lời
- Nếu câu hỏi không liên quan đến dinh dưỡng hoặc không có trong tài liệu, hãy lịch sự giải thích rằng bạn chỉ có thể tư vấn về các vấn đề dinh dưỡng và an toàn thực phẩm
- Luôn trích dẫn nguồn của thông tin khi trả lời

Đối với các câu hỏi không liên quan hoặc nhạy cảm:
- Bạn sẽ không đưa ra lời khuyên y tế cụ thể cho các bệnh lý nặng
- Bạn sẽ không đưa ra thông tin về các chế độ ăn kiêng khắc nghiệt hoặc nguy hiểm
- Bạn sẽ không nhận và xử lý thông tin cá nhân nhạy cảm của người dùng ngoài tuổi tác
"""

HUMAN_PROMPT_TEMPLATE = """
Câu hỏi: {query}

Độ tuổi người dùng: {age} tuổi

Tài liệu tham khảo:
{contexts}

Dựa vào thông tin trong tài liệu tham khảo trên, hãy trả lời câu hỏi một cách chi tiết, dễ hiểu và phù hợp với độ tuổi của người dùng. Nếu trong tài liệu có bảng biểu hoặc hình ảnh, hãy giữ nguyên và đưa vào câu trả lời. Nhớ trích dẫn nguồn thông tin.
"""

# Cấu hình Gemini API
genai.configure(api_key=GEMINI_API_KEY)

class RAGPipeline:
    def __init__(self, data_processor: DataProcessor = None, embedding_model: EmbeddingModel = None):
        """
        Khởi tạo RAG Pipeline
        
        Args:
            data_processor: Đối tượng xử lý dữ liệu
            embedding_model: Đối tượng mô hình embedding
        """
        self.data_processor = data_processor
        self.embedding_model = embedding_model or get_embedding_model()
        
        # Khởi tạo mô hình Gemini
        self.generation_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "temperature": TEMPERATURE,
                "max_output_tokens": MAX_OUTPUT_TOKENS,
                "top_p": 0.95,
            }
        )
        logger.info("Đã khởi tạo RAG Pipeline")
    
    def process_query(self, query: str, age: int = None, top_k: int = TOP_K_RESULTS) -> Dict[str, Any]:
        """
        Xử lý câu hỏi và trả về kết quả
        
        Args:
            query: Câu hỏi của người dùng
            age: Độ tuổi của người dùng
            top_k: Số lượng kết quả tối đa
            
        Returns:
            Kết quả xử lý RAG bao gồm câu trả lời và thông tin bổ sung
        """
        try:
            logger.info(f"Xử lý câu hỏi: '{query}', độ tuổi: {age}")
            
            # Tiền xử lý truy vấn
            if self.data_processor:
                processed_query = self.data_processor.preprocess_query(query)
            else:
                processed_query = query.strip()
                
            logger.info(f"Câu hỏi sau khi xử lý: '{processed_query}'")
            
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
            
            logger.info(f"Tìm thấy {len(relevant_items)} items liên quan")
            
            # Nếu không tìm thấy kết quả nào phù hợp
            if not relevant_items:
                logger.warning("Không tìm thấy thông tin liên quan trong tài liệu")
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
            formatted_contexts = self._format_context_for_rag(
                [{"id": c["id"], 
                  "title": c["metadata"].get("title", ""), 
                  "content": c["content"],
                  "content_type": c["metadata"].get("content_type", "text")
                 } for c in contexts]
            )
            
            # Tạo prompt cho Gemini bằng cách kết hợp system prompt và user prompt
            age_text = f"{age} tuổi" if age is not None else "chưa xác định"
            combined_prompt = f"{SYSTEM_PROMPT}\n\n{HUMAN_PROMPT_TEMPLATE.format(query=query, age=age_text, contexts=formatted_contexts)}"
            
            # Debug log
            logger.debug(f"Prompt tổng hợp: {combined_prompt[:200]}...")
            
            # Gọi Gemini API
            logger.info("Gửi yêu cầu đến Gemini API")
            response = self.generation_model.generate_content(combined_prompt)
            
            logger.info("Đã nhận phản hồi từ Gemini API")
            
            # Định dạng kết quả trả về
            return {
                "answer": response.text,
                "contexts": contexts,
                "sources": sources,
                "query": query,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Lỗi khi xử lý truy vấn: {str(e)}", exc_info=True)
            return {
                "answer": "Rất tiếc, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
                "contexts": [],
                "sources": [],
                "query": query,
                "success": False,
                "error": str(e)
            }
            
    def _format_context_for_rag(self, items: List[Dict[str, Any]]) -> str:
        """Định dạng các items để đưa vào ngữ cảnh cho mô hình RAG"""
        if self.data_processor:
            return self.data_processor.format_context_for_rag(items)
        
        # Fallback nếu không có data_processor
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
    
    def enhance_answer_with_figures(self, answer: str, figures: List[Dict[str, Any]]) -> str:
        """
        Nâng cao câu trả lời bằng cách thêm các hình ảnh liên quan
        
        Args:
            answer: Câu trả lời từ mô hình ngôn ngữ
            figures: Danh sách các hình ảnh liên quan
            
        Returns:
            Câu trả lời được nâng cao với các hình ảnh liên quan
        """
        # Nếu không có hình ảnh nào liên quan, trả về câu trả lời nguyên gốc
        if not figures:
            return answer
            
        # Tạo phần trích dẫn hình ảnh
        figure_references = "\n\n### Hình ảnh liên quan:\n\n"
        
        for i, figure in enumerate(figures, 1):
            figure_id = figure.get("id", "")
            figure_title = figure.get("metadata", {}).get("title", f"Hình {i}")
            figure_path = figure.get("metadata", {}).get("image_path", "")
            
            if not figure_path:
                continue
                
            figure_reference = f"**{figure_title}**\n\n![{figure_title}]({figure_path})\n\n"
            figure_references += figure_reference
            
        # Thêm các hình ảnh vào câu trả lời
        enhanced_answer = f"{answer}\n\n{figure_references}" if figures else answer
        return enhanced_answer
    
    def get_follow_up_questions(self, query: str, answer: str, age: int = None) -> List[str]:
        """
        Tạo các câu hỏi tiếp theo dựa trên câu hỏi và câu trả lời hiện tại
        
        Args:
            query: Câu hỏi hiện tại
            answer: Câu trả lời hiện tại
            age: Độ tuổi của người dùng
            
        Returns:
            Danh sách các câu hỏi tiếp theo gợi ý
        """
        follow_up_prompt = f"""
Dựa trên câu hỏi và câu trả lời dưới đây về dinh dưỡng và an toàn thực phẩm, 
hãy đề xuất 3 câu hỏi tiếp theo mà người dùng có thể quan tâm. 
Các câu hỏi phải liên quan đến chủ đề dinh dưỡng và an toàn thực phẩm.

Câu hỏi: {query}

Câu trả lời: {answer}

Độ tuổi người dùng: {age if age is not None else 'không xác định'} tuổi

Chỉ trả về 3 câu hỏi tiếp theo, mỗi câu một dòng, không đánh số, không có tiền tố hoặc hậu tố.
"""
        
        try:
            # Gọi Gemini API
            response = self.generation_model.generate_content(follow_up_prompt)
            follow_up_text = response.text.strip()
            
            # Tách thành danh sách câu hỏi
            follow_up_questions = [q.strip() for q in follow_up_text.split('\n') if q.strip()]
            
            # Giới hạn số lượng câu hỏi
            return follow_up_questions[:3]
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo câu hỏi tiếp theo: {str(e)}")
            return []