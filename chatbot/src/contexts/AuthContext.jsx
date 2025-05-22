import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import storageService from '../services/storageService';
import Swal from 'sweetalert2';

// Tạo context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Kiểm tra trạng thái xác thực khi khởi động
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const storedUser = storageService.getUserData();
      const token = storageService.getToken();
      
      if (storedUser && token) {
        try {
          // Xác thực token
          const response = await authService.verifyToken();
          if (response.success) {
            setUserData(storedUser);
          } else {
            console.error('Token hết hạn hoặc không hợp lệ');
            storageService.clearUserData();
            setUserData(null);
          }
        } catch (error) {
          console.error('Lỗi xác thực token:', error);
          storageService.clearUserData();
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Hàm đăng nhập
  const login = async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password, rememberMe);
      
      if (response.success) {
        setUserData(response.user);
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Đăng nhập thất bại' };
    } catch (error) {
      return { success: false, error: error.error || 'Đăng nhập thất bại' };
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng ký
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return { success: false, error: error.error || 'Đăng ký thất bại' };
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      await Swal.fire({
        title: 'Đăng xuất?',
        text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#36B37E',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await authService.logout();
          setUserData(null);
          storageService.clearUserData();
          navigate('/login');
        }
      });
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      // Vẫn xóa dữ liệu người dùng và chuyển hướng
      setUserData(null);
      storageService.clearUserData();
      navigate('/login');
    }
  };

  // Cập nhật thông tin người dùng
  const updateUserData = async (newData) => {
    try {
      const response = await authService.updateProfile(newData);
      
      if (response.success) {
        // Cập nhật userData trong state
        const updatedUser = {
          ...userData,
          ...newData
        };
        setUserData(updatedUser);
        
        // Cập nhật trong storage
        const currentUser = storageService.getUserData();
        if (currentUser) {
          const newUserData = {
            ...currentUser,
            ...newData
          };
          
          // Lưu lại vào storage
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(newUserData));
          } else if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(newUserData));
          }
        }
        
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Cập nhật thất bại' };
    } catch (error) {
      return { success: false, error: error.error || 'Cập nhật thất bại' };
    }
  };

  // Làm mới thông tin người dùng từ server
  const refreshUserData = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        setUserData(response.user);
        // Cập nhật storage
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(response.user));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: error.error || 'Không thể tải thông tin người dùng' };
    }
  };

  // Kiểm tra đã đăng nhập chưa
  const isAuthenticated = () => {
    return !!userData;
  };

  // Giá trị cho context
  const value = {
    userData,
    isLoading,
    login,
    register,
    logout,
    updateUserData,
    refreshUserData,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};