// frontend/src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiUser, BiLock, BiLeaf, BiStar, BiHeart, BiShield, BiRocket } from 'react-icons/bi';
import { Input, Button } from '../../components/base/index.jsx';
import { useApp } from '../../contexts/AppContext';
import { validateLoginForm } from '../../utils/index';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useApp();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateLoginForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const result = await login(formData.email, formData.password, formData.rememberMe);
      
      if (result.success) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Background Elements - Similar to LandingPage */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200 rounded-full opacity-10 animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-20 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-pink-400 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-1/3 right-20 w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <Link to="/" className="flex items-center space-x-3 w-fit hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <BiLeaf className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Nutribot</h1>
            <p className="text-sm text-gray-600">Dinh dưỡng thông minh</p>
          </div>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Welcome Content */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent text-sm font-semibold tracking-wide uppercase">
                  Chào mừng trở lại
                </span>
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                  <span className="text-gray-900">Tiếp tục</span>
                  <br />
                  <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    hành trình
                  </span>
                  <br />
                  <span className="text-gray-900">dinh dưỡng</span>
                </h1>
              </div>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Khám phá thêm nhiều thông tin hữu ích về dinh dưỡng và sức khỏe 
                cùng với Nutribot AI thông minh.
              </p>

              {/* Feature highlights */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                    <BiRocket className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Tư vấn cá nhân hóa</p>
                    <p className="text-gray-600 text-sm">Theo độ tuổi và nhu cầu riêng</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <BiShield className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Thông tin chính xác</p>
                    <p className="text-gray-600 text-sm">Dựa trên tài liệu Bộ GD&ĐT</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                    <BiHeart className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">An toàn & tin cậy</p>
                    <p className="text-gray-600 text-sm">Bảo mật thông tin người dùng</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="text-2xl font-bold text-gray-900">AI</div>
                <div className="text-sm text-gray-600">Công nghệ</div>
              </div>
              <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Hỗ trợ</div>
              </div>
              <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">Miễn phí</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Glass Morphism Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10 relative overflow-hidden">
              {/* Gradient Border Effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BiUser className="text-white text-3xl" />
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                  Đăng nhập
                </h2>
                <p className="text-gray-600">
                  Chào mừng bạn quay lại với Nutribot
                </p>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <span className="ml-2 text-sm text-gray-700">Ghi nhớ đăng nhập</span>
                  </label>
                  
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:-translate-y-1 active:scale-95'
                  } text-white shadow-lg`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang đăng nhập...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <BiRocket className="text-xl" />
                      <span>Đăng nhập</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="text-center mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                  >
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>

            {/* Additional Info for Mobile */}
            <div className="lg:hidden mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Tư vấn dinh dưỡng thông minh với AI
              </p>
              <div className="flex justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <BiStar className="text-yellow-500" />
                  <span className="text-sm text-gray-600">AI thông minh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BiShield className="text-green-500" />
                  <span className="text-sm text-gray-600">An toàn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BiHeart className="text-red-500" />
                  <span className="text-sm text-gray-600">Miễn phí</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce opacity-60">
        <BiStar className="text-yellow-600 text-2xl" />
      </div>
      <div className="absolute bottom-32 left-16 w-12 h-12 bg-pink-300 rounded-full flex items-center justify-center animate-bounce delay-1000 opacity-60">
        <BiHeart className="text-pink-600 text-xl" />
      </div>
      <div className="absolute top-1/2 right-8 w-10 h-10 bg-indigo-300 rounded-full flex items-center justify-center animate-bounce delay-500 opacity-60">
        <BiShield className="text-indigo-600 text-lg" />
      </div>
    </div>
  );
};

export default LoginPage;