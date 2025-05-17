import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { BiUser, BiLock } from 'react-icons/bi';

const API_BASE_URL = 'http://localhost:5000/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gọi API đăng nhập với credentials
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      }, {
        withCredentials: true // Quan trọng để nhận và lưu cookie
      });

      if (response.data.success) {
        // Lưu thông tin người dùng vào localStorage hoặc sessionStorage
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(response.data.user));

        // Lưu token cho các request không sử dụng cookie
        storage.setItem('access_token', response.data.access_token);

        // Cấu hình axios mặc định với token cho tất cả requests sau này
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        axios.defaults.withCredentials = true; // Luôn gửi cookie với request

        // Hiển thị thông báo đăng nhập thành công
        Swal.fire({
          icon: 'success',
          title: 'Đăng nhập thành công!',
          text: 'Chào mừng bạn đến với Nutribot',
          confirmButtonText: 'Bắt đầu trò chuyện',
          confirmButtonColor: '#36B37E',
          willClose: () => {
            navigate('/chat');
          }
        });
      } else {
        // Xử lý lỗi từ API
        Swal.fire({
          icon: 'error',
          title: 'Đăng nhập thất bại',
          text: response.data.error || 'Có lỗi xảy ra khi đăng nhập',
          confirmButtonText: 'Thử lại',
          confirmButtonColor: '#36B37E'
        });
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      // Xử lý lỗi nếu có
      Swal.fire({
        icon: 'error',
        title: 'Đăng nhập thất bại',
        text: error.response?.data?.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.',
        confirmButtonText: 'Thử lại',
        confirmButtonColor: '#36B37E'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: 'linear-gradient(135deg, rgba(54, 179, 126, 0.1) 0%, rgba(78, 204, 163, 0.05) 100%)',
        backgroundSize: 'cover'
      }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Chào mừng trở lại!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Đăng nhập để tiếp tục cuộc trò chuyện
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  border-gray-300 focus:border-mint-500 focus:ring-mint-200`}
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  border-gray-300 focus:border-mint-500 focus:ring-mint-200`}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-mint-600 focus:ring-mint-500 border-gray-300 rounded"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-mint-600 hover:text-mint-500"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-300 
                ${loading
                  ? 'bg-mint-400 cursor-not-allowed'
                  : 'bg-mint-600 hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2'
                }`}
              style={{
                backgroundColor: loading ? '#A0D9C1' : '#36B37E',
                backgroundImage: loading
                  ? 'linear-gradient(135deg, #A0D9C1 0%, #A0D9C1 100%)'
                  : 'linear-gradient(135deg, #36B37E 0%, #4ECCA3 100%)'
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-medium text-mint-600 hover:text-mint-500"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;