import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import storageService from '../services/storageService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    userData: null,
    isLoading: true
  });
  
  const navigate = useNavigate();

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const apiCall = async (method, url, data = null, showSuccessMessage = false) => {
    try {
      const response = await api[method](url, data);
      
      if (response.data.success && showSuccessMessage) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          timer: 1500,
          showConfirmButton: false,
          confirmButtonColor: '#36B37E'
        });
      }
      
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Có lỗi xảy ra';
      
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMsg,
        confirmButtonColor: '#36B37E'
      });
      
      throw new Error(errorMsg);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = storageService.getUserData();
      const token = storageService.getToken();
      
      if (storedUser && token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.post('/auth/verify-token');
          
          if (response.data.success) {
            updateState({ userData: storedUser, isLoading: false });
            return;
          }
        } catch (error) {
          console.error('Token verification failed:', error);
        }
        
        storageService.clearUserData();
        delete api.defaults.headers.common['Authorization'];
      }
      
      updateState({ userData: null, isLoading: false });
    };

    initAuth();
  }, [updateState]);

  const authOperations = {
    login: async (email, password, rememberMe = false) => {
      updateState({ isLoading: true });
      
      try {
        const response = await apiCall('post', '/auth/login', {
          email, password, rememberMe
        });
        
        if (response.success) {
          const storage = rememberMe ? localStorage : sessionStorage;
          storageService.saveUserData(response.user, response.access_token, storage);
          
          api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
          
          updateState({ userData: response.user });
          
          Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công!',
            text: 'Chào mừng bạn đến với Nutribot',
            confirmButtonColor: '#36B37E',
            timer: 1500,
            showConfirmButton: false
          });
          
          return { success: true };
        }
        
        throw new Error(response.error);
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        updateState({ isLoading: false });
      }
    },

    register: async (userData) => {
      updateState({ isLoading: true });
      
      try {
        const response = await apiCall('post', '/auth/register', userData);
        
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công!',
            text: 'Bạn đã tạo tài khoản thành công.',
            confirmButtonText: 'Đăng nhập ngay',
            confirmButtonColor: '#36B37E',
            willClose: () => navigate('/login')
          });
          
          return { success: true };
        }
        
        throw new Error(response.error);
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        updateState({ isLoading: false });
      }
    },

    logout: async () => {
      const result = await Swal.fire({
        title: 'Đăng xuất?',
        text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
        icon: 'question',
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
          updateState({ userData: null });
          storageService.clearUserData();
          delete api.defaults.headers.common['Authorization'];
          navigate('/login');
        }
      }
    },

    updateProfile: async (profileData) => {
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
    },

    changePassword: async (passwordData) => {
      try {
        const response = await apiCall('post', '/auth/change-password', passwordData, true);
        return { success: response.success };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  const isAuthenticated = () => !!state.userData;

  const value = {
    userData: state.userData,
    isLoading: state.isLoading,
    login: authOperations.login,
    register: authOperations.register,
    logout: authOperations.logout,
    updateProfile: authOperations.updateProfile,
    changePassword: authOperations.changePassword,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};