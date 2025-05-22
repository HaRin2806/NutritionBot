import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../contexts/AuthContext';
import authService from '../services/authService';
import storageService from '../services/storageService';

/**
 * Hook quản lý xác thực người dùng
 * @returns {Object} Các hàm và state quản lý xác thực
 */
const useAuth = () => {
    const context = useContext(AuthContext);

    if (context) {
        return context;
    }

    // Fallback nếu không sử dụng trong context
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Khởi tạo dữ liệu từ storage
    useEffect(() => {
        const storedUser = storageService.getUserData();
        if (storedUser) {
            setUserData(storedUser);
        }
    }, []);

    /**
     * Đăng nhập người dùng
     * @param {string} email - Email
     * @param {string} password - Mật khẩu
     * @param {boolean} rememberMe - Lưu đăng nhập
     * @returns {Promise<Object>} Kết quả đăng nhập
     */
    const login = async (email, password, rememberMe = false) => {
        try {
            setIsLoading(true);
            const response = await authService.login(email, password, rememberMe);

            if (response.success) {
                // Lưu thông tin người dùng vào state
                setUserData(response.user);

                // Hiển thị thông báo thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công!',
                    text: 'Chào mừng bạn đến với Nutribot',
                    confirmButtonText: 'Bắt đầu trò chuyện',
                    confirmButtonColor: '#36B37E',
                    timer: 1500,
                    showConfirmButton: false
                });

                return { success: true };
            }

            return { success: false, error: response.error || 'Đăng nhập thất bại' };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Đăng ký người dùng mới
     * @param {Object} formData - Dữ liệu đăng ký
     * @returns {Promise<Object>} Kết quả đăng ký
     */
    const register = async (formData) => {
        try {
            setIsLoading(true);
            const response = await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                gender: formData.gender
            });

            if (response.success) {
                // Hiển thị thông báo thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng ký thành công!',
                    text: 'Bạn đã tạo tài khoản thành công.',
                    confirmButtonText: 'Đăng nhập ngay',
                    confirmButtonColor: '#36B37E',
                    willClose: () => {
                        navigate('/login');
                    }
                });

                return { success: true };
            }

            return { success: false, error: response.error || 'Đăng ký thất bại' };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Đăng xuất người dùng
     * @returns {Promise<void>}
     */
    const logout = async () => {
        try {
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
                // Gọi API đăng xuất
                await authService.logout();

                // Xóa thông tin người dùng
                setUserData(null);

                // Chuyển hướng về trang đăng nhập
                navigate('/login');
            }
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            // Vẫn xóa dữ liệu người dùng và chuyển hướng
            setUserData(null);
            navigate('/login');
        }
    };

    /**
     * Cập nhật thông tin người dùng
     * @param {Object} newData - Dữ liệu cần cập nhật
     * @returns {Promise<Object>} Kết quả cập nhật
     */
    const updateProfile = async (newData) => {
        try {
            setIsLoading(true);
            const response = await authService.updateProfile(newData);

            if (response.success) {
                // Cập nhật userData trong state
                setUserData(prev => ({
                    ...prev,
                    ...newData
                }));

                // Hiển thị thông báo thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Cập nhật thành công',
                    text: 'Thông tin cá nhân đã được cập nhật',
                    confirmButtonColor: '#36B37E',
                    timer: 1500,
                    showConfirmButton: false
                });

                return { success: true };
            }

            return { success: false, error: response.error || 'Cập nhật thất bại' };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Không thể cập nhật thông tin cá nhân'
            };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Đổi mật khẩu người dùng
     * @param {Object} passwordData - Dữ liệu mật khẩu
     * @returns {Promise<Object>} Kết quả đổi mật khẩu
     */
    const changePassword = async (passwordData) => {
        try {
            setIsLoading(true);
            const response = await authService.changePassword(passwordData);

            if (response.success) {
                // Hiển thị thông báo thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Mật khẩu đã được cập nhật',
                    confirmButtonColor: '#36B37E',
                    timer: 1500,
                    showConfirmButton: false
                });

                return { success: true };
            }

            return { success: false, error: response.error || 'Đổi mật khẩu thất bại' };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Không thể cập nhật mật khẩu'
            };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Kiểm tra trạng thái đăng nhập
     * @returns {boolean} Trạng thái đăng nhập
     */
    const isAuthenticated = () => {
        return !!userData;
    };

    /**
     * Lấy thông tin profile người dùng
     * @returns {Promise<Object>} Thông tin profile
     */
    const getProfile = async () => {
        try {
            setIsLoading(true);
            const response = await authService.getProfile();

            if (response.success) {
                // Cập nhật userData trong state
                setUserData(response.user);
                return { success: true, user: response.user };
            }

            return { success: false, error: response.error || 'Không thể lấy thông tin người dùng' };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Không thể lấy thông tin người dùng'
            };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        userData,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        isAuthenticated,
        getProfile
    };
};

export default useAuth;