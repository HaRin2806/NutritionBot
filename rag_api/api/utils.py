import logging
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

# Cấu hình logging
logger = logging.getLogger(__name__)

# Cấu hình từ biến môi trường
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def generate_conversation_title(message, max_length=50, max_retry=2):
    """
    Tạo tiêu đề cuộc trò chuyện dựa trên tin nhắn đầu tiên của người dùng
    với tối ưu hóa thời gian và retry
    
    Args:
        message: Tin nhắn đầu tiên của người dùng
        max_length: Độ dài tối đa của tiêu đề (mặc định: 50)
        max_retry: Số lần thử lại tối đa nếu thất bại (mặc định: 2)
        
    Returns:
        Tiêu đề đã được tạo
    """
    try:
        # Khởi tạo mô hình Gemini với cấu hình nhẹ nhàng hơn cho tác vụ đơn giản
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "temperature": 0.1,  # Giảm temperature để tăng tốc độ và độ ổn định
                "max_output_tokens": 20,  # Giảm max_output_tokens vì chúng ta chỉ cần câu ngắn
                "top_p": 0.9,
            }
        )
        
        # Tạo prompt cho việc tạo tiêu đề - ngắn gọn và cụ thể
        prompt = f"Tạo tiêu đề ngắn gọn (4-5 từ) cho cuộc hội thoại bắt đầu với câu: '{message}'. Chỉ trả về tiêu đề, không giải thích."
        
        # Thử gọi Gemini API với số lần thử lại (retry)
        title = None
        for attempt in range(max_retry + 1):
            try:
                # Thêm timeout để tránh chờ quá lâu
                response = model.generate_content(prompt)
                title = response.text.strip()
                break  # Thoát vòng lặp nếu thành công
            except Exception as e:
                logger.warning(f"Lỗi khi tạo tiêu đề (lần {attempt+1}/{max_retry+1}): {str(e)}")
                if attempt == max_retry:
                    # Nếu đã hết số lần thử, sử dụng phương pháp fallback
                    raise
        
        # Nếu tiêu đề quá dài, cắt ngắn
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
            
        logger.info(f"Đã tạo tiêu đề cuộc trò chuyện: {title}")
        return title
    except Exception as e:
        logger.error(f"Lỗi khi tạo tiêu đề cuộc trò chuyện: {str(e)}")
        # Fallback: tạo tiêu đề đơn giản từ tin nhắn người dùng
        words = message.split()
        if len(words) <= 5:
            title = message
        else:
            # Lấy 5 từ đầu tiên hoặc các từ quan trọng
            important_words = [w for w in words if len(w) > 3][:5]
            title = " ".join(important_words) if important_words else " ".join(words[:5])
            
        # Cắt ngắn nếu cần
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
            
        return title

def extract_keywords_from_text(text, max_keywords=5):
    """
    Trích xuất các từ khóa quan trọng từ văn bản
    
    Args:
        text: Văn bản cần trích xuất từ khóa
        max_keywords: Số lượng từ khóa tối đa
    
    Returns:
        Danh sách các từ khóa
    """
    try:
        # Khởi tạo mô hình Gemini với cấu hình nhẹ nhàng
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 50,
                "top_p": 0.9,
            }
        )
        
        # Tạo prompt để trích xuất từ khóa
        prompt = f"""
        Trích xuất {max_keywords} từ khóa quan trọng từ văn bản sau:
        
        "{text}"
        
        Trả về các từ khóa, mỗi từ khóa một dòng, không đánh số, không thêm ký tự đặc biệt.
        """
        
        # Gọi Gemini API
        response = model.generate_content(prompt)
        
        # Xử lý kết quả
        keywords_text = response.text.strip()
        keywords = [kw.strip() for kw in keywords_text.split('\n') if kw.strip()]
        
        # Giới hạn số lượng từ khóa
        keywords = keywords[:max_keywords]
        
        return keywords
    except Exception as e:
        logger.error(f"Lỗi khi trích xuất từ khóa: {str(e)}")
        # Fallback: trích xuất từ khóa đơn giản
        words = text.split()
        # Loại bỏ các từ phổ biến và chỉ giữ lại các từ dài
        important_words = [w for w in words if len(w) > 5]
        # Lấy các từ quan trọng không lặp lại
        unique_words = list(set(important_words))
        # Sắp xếp theo độ dài từ để lấy các từ có nhiều khả năng là từ khóa
        unique_words.sort(key=len, reverse=True)
        
        return unique_words[:max_keywords]

def summarize_text(text, max_length=150):
    """
    Tóm tắt văn bản với độ dài tối đa
    
    Args:
        text: Văn bản cần tóm tắt
        max_length: Độ dài tối đa của bản tóm tắt
    
    Returns:
        Bản tóm tắt văn bản
    """
    try:
        # Nếu văn bản ngắn hơn max_length, trả về ngay
        if len(text) <= max_length:
            return text
            
        # Khởi tạo mô hình Gemini
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": max_length,
                "top_p": 0.9,
            }
        )
        
        # Tạo prompt để tóm tắt
        prompt = f"""
        Tóm tắt văn bản sau đây trong không quá {max_length} ký tự:
        
        "{text}"
        
        Tóm tắt ngắn gọn, súc tích nhưng vẫn đảm bảo đầy đủ ý chính.
        """
        
        # Gọi Gemini API
        response = model.generate_content(prompt)
        
        # Trả về kết quả
        summary = response.text.strip()
        
        # Đảm bảo độ dài tối đa
        if len(summary) > max_length:
            summary = summary[:max_length-3] + "..."
            
        return summary
    except Exception as e:
        logger.error(f"Lỗi khi tóm tắt văn bản: {str(e)}")
        # Fallback: cắt bớt văn bản gốc
        if len(text) > max_length:
            return text[:max_length-3] + "..."
        return text