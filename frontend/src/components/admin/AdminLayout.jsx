import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BiHome, BiUser, BiFile, BiMessageSquareDetail, 
  BiCog, BiBarChart, BiMenu, BiX, BiLeaf, BiShield, BiLogOut
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { Loader } from '../common';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoading: isUserLoading, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth check
  useEffect(() => {
    if (!isUserLoading && (!userData || !userData.is_admin)) {
      navigate('/');
    }
  }, [userData, isUserLoading, navigate]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader type="spinner" color="mint" text="Đang xác thực..." />
      </div>
    );
  }

  if (!userData?.is_admin) return null;

  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: BiHome },
    { path: '/admin/users', name: 'Người dùng', icon: BiUser },
    { path: '/admin/documents', name: 'Tài liệu', icon: BiFile },
    { path: '/admin/conversations', name: 'Hội thoại', icon: BiMessageSquareDetail },
    { path: '/admin/analytics', name: 'Phân tích', icon: BiBarChart },
    { path: '/admin/settings', name: 'Cài đặt', icon: BiCog }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed' : 'relative'} ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'} 
        ${isMobile ? 'z-30' : 'z-10'} w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col shadow-lg`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-mint-600 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: '#36B37E' }}>
                <BiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Nutribot</p>
              </div>
            </div>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <BiX className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-mint-600 rounded-full flex items-center justify-center" style={{ backgroundColor: '#36B37E' }}>
              <span className="text-white font-medium">{userData.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">{userData.name}</p>
              <p className="text-sm text-gray-500">{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-mint-100 text-mint-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    style={isActive(item.path) ? { backgroundColor: '#E6F7EF', color: '#36B37E' } : {}}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/"
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors mb-2"
          >
            <BiLeaf className="w-5 h-5 mr-3" />
            Về trang chính
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <BiLogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mr-4 p-2 rounded-lg hover:bg-gray-100"
                >
                  <BiMenu className="w-6 h-6" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Quản trị hệ thống</h1>
                <p className="text-sm text-gray-500">Nutribot Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-mint-100 text-mint-700 rounded-full text-sm font-medium" 
                style={{ backgroundColor: '#E6F7EF', color: '#36B37E' }}>
                Admin
              </span>
              <div className="w-8 h-8 bg-mint-600 rounded-full flex items-center justify-center" style={{ backgroundColor: '#36B37E' }}>
                <BiShield className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;