import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import {
  BiUser,
  BiLock,
  BiEnvelope,
  BiCalendar,
  BiChevronDown
} from 'react-icons/bi';

const API_BASE_URL = 'http://localhost:5000/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
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
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.age) {
      newErrors.age = 'Vui lòng chọn tuổi';
    }

    if (!formData.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // Gọi API đăng ký
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        age: formData.age,
        gender: formData.gender
      });

      if (response.data.success) {
        // Hiển thị thông báo đăng ký thành công
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
      } else {
        // Xử lý lỗi từ API
        Swal.fire({
          icon: 'error',
          title: 'Đăng ký thất bại',
          text: response.data.error || 'Có lỗi xảy ra khi đăng ký',
          confirmButtonText: 'Thử lại',
          confirmButtonColor: '#36B37E'
        });
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);

      // Xử lý lỗi từ API
      Swal.fire({
        icon: 'error',
        title: 'Đăng ký thất bại',
        text: error.response?.data?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        confirmButtonText: 'Thử lại',
        confirmButtonColor: '#36B37E'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 19 },
    (_, index) => index + 1
  );

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
          {/* Họ và tên */}
          <div>
            <div className="relative">
              <BiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Họ và tên"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  ${errors.fullName
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:border-mint-500 focus:ring-mint-200'
                  }`}
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <BiEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  ${errors.email
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:border-mint-500 focus:ring-mint-200'
                  }`}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Tuổi và Giới tính */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Mật khẩu */}
          <div>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Mật khẩu"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  ${errors.password
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:border-mint-500 focus:ring-mint-200'
                  }`}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  ${errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:border-mint-500 focus:ring-mint-200'
                  }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

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
                <a href="#" className="text-mint-600 hover:text-mint-500">
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="text-mint-600 hover:text-mint-500">
                  Chính sách bảo mật
                </a>
              </label>
              {errors.agreeTerms && (
                <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>
              )}
            </div>
          </div>

          {/* Nút đăng ký */}
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
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </div>
        </form>

        {/* Link đăng nhập */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-medium text-mint-600 hover:text-mint-500"
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