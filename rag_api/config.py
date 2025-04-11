import os
from dotenv import load_dotenv

load_dotenv()  # Tải biến môi trường từ file .env

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY_HERE")

# Embedding model
EMBEDDING_MODEL = "intfloat/multilingual-e5-base"

# ChromaDB settings
CHROMA_PERSIST_DIRECTORY = "chroma_db"
COLLECTION_NAME = "nutrition_data"

# RAG settings
TOP_K_RESULTS = 5
TEMPERATURE = 0.2
MAX_OUTPUT_TOKENS = 4096

# Prompt template
SYSTEM_PROMPT = """Bạn là một trợ lý AI thông minh chuyên về dinh dưỡng và an toàn thực phẩm cho học sinh. 
Hãy trả lời dựa trên thông tin được cung cấp trong các tài liệu tham khảo dưới đây.
Nếu câu hỏi không liên quan đến dinh dưỡng hoặc thông tin không có trong tài liệu, hãy lịch sự giải thích rằng bạn không có thông tin về chủ đề đó.
Câu trả lời của bạn phải phù hợp với độ tuổi của người dùng.
"""

HUMAN_PROMPT_TEMPLATE = """
Câu hỏi: {query}

Độ tuổi người dùng: {age} tuổi

Tài liệu tham khảo:
{contexts}

Dựa vào thông tin trong tài liệu tham khảo trên, hãy trả lời câu hỏi một cách chi tiết và dễ hiểu.
"""