import logging
import google.generativeai as genai
from core.embedding_model import get_embedding_model
from config import GEMINI_API_KEY, HUMAN_PROMPT_TEMPLATE, SYSTEM_PROMPT, TOP_K_RESULTS, TEMPERATURE, MAX_OUTPUT_TOKENS
import os
import re

# Cấu hình logging
logger = logging.getLogger(__name__)

# Cấu hình Gemini
genai.configure(api_key=GEMINI_API_KEY)

class RAGPipeline:
    def __init__(self):
        """Khởi tạo RAG Pipeline chỉ với embedding model"""
        logger.info("Khởi tạo RAG Pipeline")
        
        # SỬA: Chỉ khởi tạo embedding model, không khởi tạo DataProcessor
        self.embedding_model = get_embedding_model()
        
        # Khởi tạo Gemini model
        self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        logger.info("RAG Pipeline đã sẵn sàng")
    
    def generate_response(self, query, age=1):
        """
        Generate response cho user query sử dụng RAG
        
        Args:
            query (str): Câu hỏi của người dùng
            age (int): Tuổi của người dùng (1-19)
        
        Returns:
            dict: Response data with success status
        """
        try:
            logger.info(f"Bắt đầu generate response cho query: {query[:50]}... (age: {age})")
            
            # SỬA: Chỉ search trong ChromaDB, không load lại dữ liệu
            logger.info("Đang tìm kiếm thông tin liên quan...")
            search_results = self.embedding_model.search(query, top_k=TOP_K_RESULTS)
            
            if not search_results or len(search_results) == 0:
                logger.warning("Không tìm thấy thông tin liên quan")
                return {
                    "success": True,
                    "response": "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong tài liệu.",
                    "sources": []
                }
            
            # Chuẩn bị contexts từ kết quả tìm kiếm
            contexts = []
            sources = []
            
            for result in search_results:
                # Lấy thông tin từ metadata
                metadata = result.get('metadata', {})
                content = result.get('document', '')
                
                # Thêm context
                contexts.append({
                    "content": content,
                    "metadata": metadata
                })
                
                # Thêm source reference
                source_info = {
                    "title": metadata.get('title', metadata.get('chapter', 'Tài liệu dinh dưỡng')),
                    "pages": metadata.get('pages'),
                    "content_type": metadata.get('content_type', 'text')
                }
                
                if source_info not in sources:
                    sources.append(source_info)
            
            # Format contexts cho prompt
            formatted_contexts = self._format_contexts(contexts)
            
            # Tạo prompt với age context
            full_prompt = self._create_prompt_with_age_context(query, age, formatted_contexts)
            
            # Generate response với Gemini
            logger.info("Đang tạo phản hồi với Gemini...")
            response = self.gemini_model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=TEMPERATURE,
                    max_output_tokens=MAX_OUTPUT_TOKENS
                )
            )
            
            if not response or not response.text:
                logger.error("Gemini không trả về response")
                return {
                    "success": False,
                    "error": "Không thể tạo phản hồi"
                }
            
            response_text = response.text.strip()
            
            # Post-process response để xử lý hình ảnh
            response_text = self._process_image_links(response_text)
            
            logger.info("Đã tạo phản hồi thành công")
            
            return {
                "success": True,
                "response": response_text,
                "sources": sources[:3]  # Giới hạn 3 sources để không quá dài
            }
            
        except Exception as e:
            logger.error(f"Lỗi generate response: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi tạo phản hồi: {str(e)}"
            }
    
    def _format_contexts(self, contexts):
        """Format contexts thành string cho prompt"""
        formatted = []
        
        for i, context in enumerate(contexts, 1):
            content = context['content']
            metadata = context['metadata']
            
            # Thêm thông tin metadata
            context_str = f"[Tài liệu {i}]"
            if metadata.get('title'):
                context_str += f" - {metadata['title']}"
            if metadata.get('pages'):
                context_str += f" (Trang {metadata['pages']})"
            
            context_str += f"\n{content}\n"
            formatted.append(context_str)
        
        return "\n".join(formatted)
    
    def _create_prompt_with_age_context(self, query, age, contexts):
        """Tạo prompt với age context"""
        # Xác định age group
        if age <= 3:
            age_guidance = "Sử dụng ngôn ngữ đơn giản, dễ hiểu cho phụ huynh có con nhỏ."
        elif age <= 6:
            age_guidance = "Tập trung vào dinh dưỡng cho trẻ mầm non, ngôn ngữ phù hợp với phụ huynh."
        elif age <= 12:
            age_guidance = "Nội dung phù hợp cho trẻ tiểu học, có thể giải thích đơn giản cho trẻ hiểu."
        elif age <= 15:
            age_guidance = "Thông tin chi tiết hơn, phù hợp cho học sinh trung học cơ sở."
        else:
            age_guidance = "Thông tin đầy đủ, chi tiết cho học sinh trung học phổ thông."
        
        # Tạo system prompt với age context
        age_aware_system_prompt = f"""{SYSTEM_PROMPT}

QUAN TRỌNG - Hướng dẫn theo độ tuổi:
Người dùng hiện tại {age} tuổi. {age_guidance}
- Điều chỉnh ngôn ngữ và nội dung cho phù hợp
- Đưa ra lời khuyên cụ thể cho độ tuổi này
- Tránh thông tin quá phức tạp hoặc không phù hợp
"""
        
        # Tạo human prompt
        human_prompt = HUMAN_PROMPT_TEMPLATE.format(
            query=query,
            age=age,
            contexts=contexts
        )
        
        return f"{age_aware_system_prompt}\n\n{human_prompt}"
    
    def _process_image_links(self, response_text):
        """Xử lý các đường dẫn hình ảnh trong response"""
        try:
            # Tìm các pattern như figures/filename hoặc hình X.Y
            image_patterns = [
                r'figures/([^)\s]+)',
                r'hình\s+(\d+\.?\d*)',
                r'Hình\s+(\d+\.?\d*)'
            ]
            
            for pattern in image_patterns:
                matches = re.finditer(pattern, response_text, re.IGNORECASE)
                for match in matches:
                    # Có thể thêm logic xử lý hình ảnh ở đây
                    pass
            
            return response_text
            
        except Exception as e:
            logger.error(f"Lỗi xử lý image links: {e}")
            return response_text
    
    def generate_follow_up_questions(self, query, answer, age=1):
        """
        Tạo câu hỏi gợi ý dựa trên query và answer
        
        Args:
            query (str): Câu hỏi gốc
            answer (str): Câu trả lời đã được tạo
            age (int): Tuổi người dùng
        
        Returns:
            dict: Response data với danh sách câu hỏi gợi ý
        """
        try:
            logger.info("Đang tạo câu hỏi follow-up...")
            
            follow_up_prompt = f"""
Dựa trên cuộc hội thoại sau, hãy tạo 3-5 câu hỏi gợi ý phù hợp cho người dùng {age} tuổi về chủ đề dinh dưỡng:

Câu hỏi gốc: {query}
Câu trả lời: {answer}

Hãy tạo các câu hỏi:
1. Liên quan trực tiếp đến chủ đề
2. Phù hợp với độ tuổi {age}
3. Thực tế và hữu ích
4. Ngắn gọn, dễ hiểu

Trả về danh sách câu hỏi, mỗi câu một dòng, không đánh số.
"""
            
            response = self.gemini_model.generate_content(
                follow_up_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=500
                )
            )
            
            if not response or not response.text:
                return {
                    "success": False,
                    "error": "Không thể tạo câu hỏi gợi ý"
                }
            
            # Parse response thành list câu hỏi
            questions = []
            lines = response.text.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and len(line) > 10:
                    # Loại bỏ số thứ tự nếu có
                    line = re.sub(r'^\d+[\.\)]\s*', '', line)
                    questions.append(line)
            
            # Giới hạn 5 câu hỏi
            questions = questions[:5]
            
            return {
                "success": True,
                "questions": questions
            }
            
        except Exception as e:
            logger.error(f"Lỗi tạo follow-up questions: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi tạo câu hỏi gợi ý: {str(e)}"
            }