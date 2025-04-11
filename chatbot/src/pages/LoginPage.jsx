import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { BiUser, BiLock } from 'react-icons/bi';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Giả lập xử lý đăng nhập
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    } catch (error) {
      // Xử lý lỗi nếu có
      Swal.fire({
        icon: 'error',
        title: 'Đăng nhập thất bại',
        text: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
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
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Email hoặc tên đăng nhập
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none 
                  border-gray-300 focus:border-mint-500 focus:ring-mint-200`}
                placeholder="email@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-mint-600 focus:ring-mint-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
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