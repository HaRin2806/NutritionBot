import axios from 'axios';
import config from '../config';

// Tạo base API instance
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: config.apiBaseUrl, // Lấy từ config thay vì hardcode
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
  });

  // Request interceptor
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname === '/login';
      
      if (error.response?.status === 401 && !isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Base API service với common methods
class BaseApiService {
  constructor() {
    this.api = createApiInstance();
  }

  // Generic CRUD operations
  async get(endpoint, params = {}) {
    try {
      const response = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(endpoint, data = {}) {
    try {
      const response = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put(endpoint, data = {}) {
    try {
      const response = await this.api.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(endpoint, data = {}) {
    try {
      const response = await this.api.delete(endpoint, { data });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async upload(endpoint, file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await this.api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    return error.response?.data || { error: error.message };
  }
}

export default new BaseApiService();