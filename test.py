import google.generativeai as genai

# Khởi tạo client với API key của bạn
client = genai.Client(api_key="AIzaSyBW0gv3-bwuKE05MP8y0N0lA2Y2KpyTvCs")

# Lấy danh sách các mô hình
models = client.models.list()

# In ra tên của từng mô hình
for model in models:
    print(model.name)
