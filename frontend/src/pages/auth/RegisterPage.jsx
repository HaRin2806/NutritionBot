// frontend/src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BiUser, BiLock, BiEnvelope, BiChevronDown, BiLeaf, BiStar, 
  BiHeart, BiShield, BiRocket, BiCheckCircle, BiGift, BiTrendingUp,
  BiGroup, BiBook, BiCoffee
} from 'react-icons/bi';
import { Input, Button } from '../../components/base/index.jsx';
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

  const benefits = [
    {
      icon: <BiRocket className="text-xl" />,
      title: "Tư vấn cá nhân hóa",
      description: "AI phân tích và đưa ra lời khuyên phù hợp với độ tuổi"
    },
    {
      icon: <BiShield className="text-xl" />,
      title: "Thông tin chính xác",
      description: "Dựa trên tài liệu chính thức từ Bộ GD&ĐT"
    },
    {
      icon: <BiHeart className="text-xl" />,
      title: "Hoàn toàn miễn phí",
      description: "Không có phí ẩn, sử dụng mọi tính năng miễn phí"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Background Elements */}
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
      <div className="relative z-10 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Welcome Content */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent text-sm font-semibold tracking-wide uppercase">
                  Tham gia cộng đồng
                </span>
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                  <span className="text-gray-900">Bắt đầu</span>
                  <br />
                  <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    hành trình
                  </span>
                  <br />
                  <span className="text-gray-900">khỏe mạnh</span>
                </h1>
              </div>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Tham gia ngay để được tư vấn dinh dưỡng cá nhân hóa từ AI thông minh, 
                dựa trên khoa học và phù hợp với độ tuổi của bạn.
              </p>

              {/* Benefits */}
              <div className="space-y-5">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      {benefit.icon}
                      <span className="text-white">{benefit.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{benefit.title}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Stories Preview */}
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <BiGift className="text-green-500 mr-2" />
                  Bạn sẽ nhận được:
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <BiCheckCircle className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Tư vấn 24/7</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BiCheckCircle className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Thực đơn cá nhân</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BiCheckCircle className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Theo dõi tiến độ</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BiCheckCircle className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Cộng đồng hỗ trợ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">AI</div>
                <div className="text-sm text-gray-600">Công nghệ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">Miễn phí</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Hỗ trợ</div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10 relative overflow-hidden">
              {/* Gradient Border Effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BiUser className="text-white text-3xl" />
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                  Đăng ký
                </h2>
                <p className="text-gray-600">
                  Tạo tài khoản để bắt đầu hành trình dinh dưỡng
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        errors.fullName
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập họ và tên của bạn"
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BiEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${
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
                    <BiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>

                {/* Password */}
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
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                      required
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-green-500 focus:border-green-500'
                      }`}
                      placeholder="Nhập lại mật khẩu"
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-3">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-700 leading-relaxed">
                    Tôi đồng ý với{' '}
                    <a href="#" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
                      Điều khoản sử dụng
                    </a>{' '}
                    và{' '}
                    <a href="#" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
                      Chính sách bảo mật
                    </a>{' '}
                    của Nutribot
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-sm text-red-600">{errors.agreeTerms}</p>
                )}

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
                      <span>Đang tạo tài khoản...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <BiRocket className="text-xl" />
                      <span>Tạo tài khoản</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Đã có tài khoản?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>

            {/* Mobile Benefits */}
            <div className="lg:hidden mt-8 space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Tham gia cộng đồng dinh dưỡng thông minh
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                    <BiStar className="text-yellow-500 text-xl mx-auto mb-1" />
                    <span className="text-xs text-gray-600">AI thông minh</span>
                  </div>
                  <div className="text-center p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                    <BiShield className="text-green-500 text-xl mx-auto mb-1" />
                    <span className="text-xs text-gray-600">An toàn</span>
                  </div>
                  <div className="text-center p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                    <BiHeart className="text-red-500 text-xl mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Miễn phí</span>
                  </div>
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
      <div className="absolute bottom-1/4 right-1/4 w-8 h-8 bg-green-300 rounded-full flex items-center justify-center animate-bounce delay-700 opacity-60">
        <BiCheckCircle className="text-green-600 text-sm" />
      </div>
    </div>
  );
};

export default RegisterPage;