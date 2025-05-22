import api from './api';
import storageService from './storageService';

const authService = {
  login: async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        rememberMe
      });
      
      if (response.data.success) {
        // Lưu thông tin user và token
        const storage = rememberMe ? localStorage : sessionStorage;
        storageService.saveUserData(response.data.user, response.data.access_token, storage);
        
        // Cập nhật header mặc định
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
      
      // Xóa thông tin người dùng
      storageService.clearUserData();
      
      // Xóa header
      delete api.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      // Vẫn xóa dữ liệu người dùng ngay cả khi API lỗi
      storageService.clearUserData();
      delete api.defaults.headers.common['Authorization'];
      
      throw error.response?.data || error;
    }
  },
  
  verifyToken: async () => {
    try {
      const token = storageService.getToken();
      
      if (!token) {
        return { success: false, error: 'No token found' };
      }
      
      // Đảm bảo header Authorization được thiết lập
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.post('/auth/verify-token');
      return { success: true, ...response.data };
    } catch (error) {
      // Nếu token hết hạn hoặc không hợp lệ, xóa khỏi storage
      storageService.clearUserData();
      delete api.defaults.headers.common['Authorization'];
      
      return { success: false, error: error.response?.data?.error || 'Token verification failed' };
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default authService;