import axios from 'axios';

// Lấy cấu hình từ config
const API_BASE_URL = 'http://localhost:5000/api';

// Tạo instance axios với cấu hình chung
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor cho request
api.interceptors.request.use((config) => {
  // Lấy token từ localStorage hoặc sessionStorage
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  // Thêm Authorization header nếu có token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// SỬA: Thêm interceptor cho response với xử lý đặc biệt cho login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // QUAN TRỌNG: Chỉ xử lý 401 khi KHÔNG phải đang login
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';
    
    if (error.response && error.response.status === 401 && !isLoginRequest && !isOnLoginPage) {
      // Xóa token và thông tin người dùng
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      
      // Chuyển hướng đến trang đăng nhập
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;