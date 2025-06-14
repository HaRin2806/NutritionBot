import json
import csv

# Đọc dữ liệu JSON từ file
with open('test.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# Mở file CSV để ghi dữ liệu
with open('benchmark.csv', 'w', newline='', encoding='utf-8-sig') as csvfile:
    fieldnames = ['question', 'positive', 'negative', 'age_group']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    # Ghi header vào file CSV
    writer.writeheader()

    # Ghi các dòng dữ liệu vào file CSV
    for item in data:
        # Chuyển cột 'age_group' thành chuỗi để tránh việc Excel tự động chuyển đổi
        item['age_group'] = str(item['age_group'])
        writer.writerow(item)
