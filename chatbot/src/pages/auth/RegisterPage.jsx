import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BiUser,
  BiLock,
  BiEnvelope,
  BiChevronDown
} from 'react-icons/bi';
import { Input, Button } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { validateRegisterForm } from '../../utils/validators';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showRegisterSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    agreeTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateRegisterForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      
      if (result.success) {
        showRegisterSuccess(() => {
          navigate('/login');
        });
      } else {
        showError(result.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      showError(error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
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
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-10 transform transition-all duration-300 hover:shadow-3xl">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Đăng Ký
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bắt đầu hành trình khám phá dinh dưỡng của bạn
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Họ và tên"
            icon={<BiUser className="h-5 w-5 text-gray-400" />}
            error={errors.fullName}
            required
          />

          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            icon={<BiEnvelope className="h-5 w-5 text-gray-400" />}
            error={errors.email}
            required
          />

          <div>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none appearance-none
                ${errors.gender
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:border-mint-500 focus:ring-mint-200'
                  }`}
              >
                <option value="">Giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
              <BiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>

          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mật khẩu"
            icon={<BiLock className="h-5 w-5 text-gray-400" />}
            error={errors.password}
            helpText="Mật khẩu phải có ít nhất 6 ký tự"
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Xác nhận mật khẩu"
            icon={<BiLock className="h-5 w-5 text-gray-400" />}
            error={errors.confirmPassword}
            required
          />

          {/* Điều khoản */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                className="h-4 w-4 text-mint-600 border-gray-300 rounded focus:ring-mint-500"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                Tôi đồng ý với{' '}
                <a href="#" className="text-mint-600 hover:text-mint-500" style={{ color: '#36B37E' }}>
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="text-mint-600 hover:text-mint-500" style={{ color: '#36B37E' }}>
                  Chính sách bảo mật
                </a>
              </label>
              {errors.agreeTerms && (
                <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            color="mint"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </Button>
        </form>

        {/* Link đăng nhập */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-medium text-mint-600 hover:text-mint-500"
              style={{ color: '#36B37E' }}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;