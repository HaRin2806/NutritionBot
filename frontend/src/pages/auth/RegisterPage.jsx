import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BiUser, BiLock, BiEnvelope, BiChevronDown, BiLeaf
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext.jsx';
import { validateRegisterForm } from '../../utils/index';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useApp();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    agreeTerms: false
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

    const formErrors = validateRegisterForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const result = await register(formData);
      
      if (result.success) {
        // Success handling is done in context
      }
    } catch (error) {
      console.error('Register error:', error);
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
                Tham gia cộng đồng
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                Bắt đầu hành trình khỏe mạnh
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                Tạo tài khoản để nhận tư vấn dinh dưỡng cá nhân hóa từ AI thông minh.
              </p>
            </div>

            {/* Simple Benefits */}
            <div className="bg-white/50 rounded-lg p-4 border border-white/20">
              <h3 className="font-medium text-gray-900 mb-3">Bạn sẽ nhận được:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Tư vấn dinh dưỡng 24/7</div>
                <div>• Thực đơn cá nhân hóa</div>
                <div>• Theo dõi tiến độ sức khỏe</div>
                <div>• Hoàn toàn miễn phí</div>
              </div>
            </div>

            {/* Simple Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-lg border border-white/20">
                <div className="text-lg font-bold text-gray-900">AI</div>
                <div className="text-xs text-gray-600">Công nghệ</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg border border-white/20">
                <div className="text-lg font-bold text-gray-900">100%</div>
                <div className="text-xs text-gray-600">Miễn phí</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg border border-white/20">
                <div className="text-lg font-bold text-gray-900">24/7</div>
                <div className="text-xs text-gray-600">Hỗ trợ</div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              {/* Header - Bỏ logo */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký</h2>
                <p className="text-gray-600 text-sm">Tạo tài khoản để bắt đầu hành trình dinh dưỡng</p>
              </div>

              {/* Form */}
              <form className="space-y-3" onSubmit={handleSubmit}>
                {/* Full Name & Email - Same Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <BiUser className="h-3 w-3 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`w-full pl-7 pr-2 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                          errors.fullName
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                        }`}
                        placeholder="Họ tên"
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <BiEnvelope className="h-3 w-3 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-7 pr-2 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                          errors.email
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                        }`}
                        placeholder="Email"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Gender - Full Width */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giới tính</label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none text-sm ${
                        errors.gender
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    <BiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
                  )}
                </div>

                {/* Password & Confirm Password - Same Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <BiLock className="h-3 w-3 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-7 pr-2 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                          errors.password
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                        }`}
                        placeholder="Mật khẩu"
                        required
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Xác nhận</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <BiLock className="h-3 w-3 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-7 pr-2 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                          errors.confirmPassword
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                        }`}
                        placeholder="Nhập lại"
                        required
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-2">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    className="mt-1 h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-gray-700 leading-relaxed">
                    Tôi đồng ý với{' '}
                    <a href="#" className="font-medium text-green-600 hover:text-green-700 transition-colors">
                      Điều khoản sử dụng
                    </a>{' '}
                    và{' '}
                    <a href="#" className="font-medium text-green-600 hover:text-green-700 transition-colors">
                      Chính sách bảo mật
                    </a>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-xs text-red-600">{errors.agreeTerms}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                  } text-white shadow-lg`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tạo tài khoản...</span>
                    </div>
                  ) : (
                    'Tạo tài khoản'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-4 pt-3 border-t border-gray-200">
                <p className="text-gray-600 text-xs">
                  Đã có tài khoản?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>

            {/* Mobile Benefits */}
            <div className="lg:hidden mt-4 text-center">
              <p className="text-gray-600 text-sm mb-2">
                Tham gia cộng đồng dinh dưỡng thông minh
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

export default RegisterPage;