import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiUser, BiLock, BiLeaf } from 'react-icons/bi';
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="p-4">
        <Link to="/" className="flex items-center space-x-2 w-fit hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <BiLeaf className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-emerald-900">Nutribot</h1>
            <p className="text-xs text-gray-600">Dinh dưỡng thông minh</p>
          </div>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Simplified Content */}
          <div className="hidden lg:block space-y-6">
            <div className="space-y-4">
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent text-sm font-medium">
                Chào mừng trở lại
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                Tiếp tục hành trình dinh dưỡng
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                Đăng nhập để tiếp tục nhận tư vấn dinh dưỡng cá nhân hóa từ Nutribot AI.
              </p>
            </div>

            {/* Simple Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg border border-white/20">
                <div className="text-lg font-bold text-gray-900">AI</div>
                <div className="text-xs text-gray-600">Công nghệ</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg border border-white/20">
                <div className="text-lg font-bold text-gray-900">24/7</div>
                <div className="text-xs text-gray-600">Hỗ trợ</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg border border-white/20">
                <div className="text-lg font-bold text-gray-900">Free</div>
                <div className="text-xs text-gray-600">Miễn phí</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
                <p className="text-gray-600 text-sm">Chào mừng bạn quay lại với Nutribot</p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BiUser className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BiLock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
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
                    <span className="ml-2 text-xs text-gray-700">Ghi nhớ đăng nhập</span>
                  </label>
                  
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                  } text-white shadow-lg`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang đăng nhập...</span>
                    </div>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="text-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-xs">
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>

            {/* Mobile Info */}
            <div className="lg:hidden mt-6 text-center">
              <p className="text-gray-600 text-sm mb-2">
                Tư vấn dinh dưỡng thông minh với AI
              </p>
              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <span>AI thông minh</span>
                <span>•</span>
                <span>An toàn</span>
                <span>•</span>
                <span>Miễn phí</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;