import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import storageService from '../services/storageService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Khởi tạo state với dữ liệu từ storage ngay lập tức (synchronous)
  const [state, setState] = useState(() => {
    const storedUser = storageService.getUserData();
    const token = storageService.getToken();
    
    // Nếu có cả user và token, coi như authenticated
    if (storedUser && token) {
      // Set token cho axios ngay lập tức
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return {
        userData: storedUser,
        isLoading: false,
        isVerified: false // Chưa verify với server
      };
    }
    
    return {
      userData: null,
      isLoading: false,
      isVerified: true // Không có gì để verify
    };
  });
  
  const navigate = useNavigate();

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Verify token với server (background task)
  useEffect(() => {
    const verifyToken = async () => {
      // Chỉ verify nếu có userData nhưng chưa verified
      if (state.userData && !state.isVerified) {
        try {
          const response = await api.post('/auth/verify-token');
          
          if (response.data.success) {
            updateState({ isVerified: true });
          } else {
            // Token invalid, clear everything
            storageService.clearUserData();
            delete api.defaults.headers.common['Authorization'];
            updateState({
              userData: null,
              isVerified: true
            });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token invalid, clear everything
          storageService.clearUserData();
          delete api.defaults.headers.common['Authorization'];
          updateState({
            userData: null,
            isVerified: true
          });
        }
      }
    };

    verifyToken();
  }, [state.userData, state.isVerified, updateState]);

  // API call helper - SỬA: Không hiển thị SweetAlert ở đây
  const apiCall = async (method, url, data = null, showSuccessMessage = false) => {
    try {
      const response = await api[method](url, data);
      
      if (response.data.success && showSuccessMessage) {
        Swal.fire({
          title: 'Thành công',
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Có lỗi xảy ra';
      throw new Error(errorMsg);
    }
  };

  // SỬA: Login function với xử lý lỗi rõ ràng
  const login = async (email, password, rememberMe = false) => {
    updateState({ isLoading: true });
    
    try {
      const response = await api.post('/auth/login', {
        email, password, rememberMe
      });
      
      if (response.data.success) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storageService.saveUserData(response.data.user, response.data.access_token, storage);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        updateState({
          userData: response.data.user,
          isLoading: false,
          isVerified: true
        });
        
        // Success message
        Swal.fire({
          title: 'Đăng nhập thành công!',
          text: 'Chào mừng bạn đến với Nutribot',
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });
        
        return { success: true };
      }
      
      throw new Error(response.data.error);
    } catch (error) {
      updateState({ isLoading: false });
      
      // SỬA: Xử lý lỗi login với message cụ thể
      let errorMessage = 'Đăng nhập thất bại';
      
      if (error.response) {
        // API response error
        errorMessage = error.response.data?.error || 'Email hoặc mật khẩu không chính xác';
      } else if (error.request) {
        // Network error
        errorMessage = 'Không thể kết nối đến máy chủ';
      } else {
        // Other error
        errorMessage = error.message || 'Có lỗi xảy ra';
      }
      
      // QUAN TRỌNG: Đảm bảo SweetAlert không bị override
      setTimeout(() => {
        Swal.fire({
          title: 'Đăng nhập thất bại',
          text: errorMessage,
          confirmButtonColor: '#36B37E',
          confirmButtonText: 'Thử lại',
          allowOutsideClick: true,
          allowEscapeKey: true,
          showConfirmButton: true,
          // Đảm bảo không có timer
          timer: null,
          timerProgressBar: false
        });
      }, 100);
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    updateState({ isLoading: true });
    
    try {
      const response = await apiCall('post', '/auth/register', userData);
      
      if (response.success) {
        updateState({ isLoading: false });
        
        Swal.fire({
          title: 'Đăng ký thành công!',
          text: 'Bạn đã tạo tài khoản thành công.',
          confirmButtonText: 'Đăng nhập ngay',
          confirmButtonColor: '#36B37E',
          allowOutsideClick: false
        }).then(() => {
          navigate('/login');
        });
        
        return { success: true };
      }
      
      throw new Error(response.error);
    } catch (error) {
      updateState({ isLoading: false });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    const result = await Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await apiCall('post', '/auth/logout');
      } catch (error) {
        console.error('Logout API error:', error);
      } finally {
        updateState({
          userData: null,
          isLoading: false,
          isVerified: true
        });
        storageService.clearUserData();
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
      }
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiCall('put', '/auth/profile', profileData, true);
      
      if (response.success) {
        const updatedUser = { ...state.userData, ...profileData };
        updateState({ userData: updatedUser });
        
        const currentUser = storageService.getUserData();
        if (currentUser) {
          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return { success: true };
      }
      
      throw new Error(response.error);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await apiCall('post', '/auth/change-password', passwordData, true);
      return { success: response.success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper functions
  const isAuthenticated = () => !!state.userData;

  const requireAuth = (callback) => {
    if (!isAuthenticated()) {
      Swal.fire({
        title: 'Cần đăng nhập',
        text: 'Vui lòng đăng nhập để tiếp tục',
        confirmButtonColor: '#36B37E',
        confirmButtonText: 'Đăng nhập'
      }).then(() => {
        if (callback) callback();
        else navigate('/login');
      });
      return false;
    }
    return true;
  };

  const value = {
    userData: state.userData,
    isLoading: state.isLoading,
    isVerified: state.isVerified,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated,
    requireAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};