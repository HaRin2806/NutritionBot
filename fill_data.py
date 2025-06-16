import os
import json

base_dir = './data'  # Thư mục chính chứa các thư mục bai1, bai2, bai3,...
benchmark_file = './test2.json'

# Đọc file benchmark
with open(benchmark_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Hàm để xác định thư mục chứa chunk dựa trên chunk_id
def get_chunk_file_path(chunk_id):
    # Xác định thư mục chính (bai1, bai2, etc.)
    if chunk_id.startswith('bai1'):
        main_dir = 'bai1'
    elif chunk_id.startswith('bai2'):
        main_dir = 'bai2'
    elif chunk_id.startswith('bai3'):
        main_dir = 'bai3'
    elif chunk_id.startswith('bai4'):
        main_dir = 'bai4'
    elif chunk_id.startswith('phuluc'):
        main_dir = 'phuluc'
    else:
        return None
    
    # Xác định thư mục con (chunks hoặc tables)
    if '_bang' in chunk_id:
        sub_dir = 'tables'
    else:
        sub_dir = 'chunks'
    
    # Đường dẫn đầy đủ đến file
    return os.path.join(base_dir, main_dir, sub_dir, f"{chunk_id}.md")

# Hàm để đọc nội dung từ file chunk tương ứng với chunk_id
def read_chunk_file(chunk_id):
    chunk_file_path = get_chunk_file_path(chunk_id)
    
    if chunk_file_path and os.path.exists(chunk_file_path):
        with open(chunk_file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        print(f"Warning: File for chunk_id {chunk_id} not found.")
        return f"[Content for {chunk_id} not found]"

# Duyệt qua các mục trong data và thay thế chunk_id trong các trường 'positive' và 'negative'
for item in data:
    for key in ['positive', 'negative']:
        chunk_id = item.get(key)
        
        if chunk_id:
            # Đọc nội dung từ file chunk và thay thế chunk_id
            content = read_chunk_file(chunk_id)
            item[key] = content

# Lưu kết quả vào file mới
output_file = './modified_test2.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"Modified data saved to {output_file}")