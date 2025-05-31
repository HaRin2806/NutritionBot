import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiUser, BiLock } from 'react-icons/bi';
import { Input, Button } from '../../components/common';
import { useApp } from '../../hooks/useContext';
import { validateLoginForm } from '../../utils/validators';

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
        // Success message đã được hiển thị trong AuthContext
        navigate('/chat');
      }
    } catch (error) {
      console.error('Login error:', error);
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
          <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Chào mừng trở lại!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Đăng nhập để tiếp tục cuộc trò chuyện
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            label="Email"
            icon={<BiUser className="h-5 w-5 text-gray-400" />}
            error={errors.email}
            required
          />

          <div>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mật khẩu"
              label="Mật khẩu"
              icon={<BiLock className="h-5 w-5 text-gray-400" />}
              error={errors.password}
              required
            />
            
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
                style={{ color: '#36B37E' }}
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            color="mint"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-medium text-mint-600 hover:text-mint-500"
              style={{ color: '#36B37E' }}
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