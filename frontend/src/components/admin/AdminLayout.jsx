import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BiHome, BiUser, BiFile, BiMessageSquareDetail, BiStar,
  BiCog, BiBarChart, BiMenu, BiX, BiLeaf, BiShield, BiLogOut
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader } from '../common';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoading: isUserLoading, logout } = useApp();
  const { darkMode, currentThemeConfig } = useTheme();
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
    { path: '/admin/feedback', name: 'Đóng góp ý kiến', icon: BiStar },
    { path: '/admin/settings', name: 'Cài đặt', icon: BiCog }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`admin-layout min-h-screen flex transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed' : 'relative'} ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'} 
        ${isMobile ? 'z-30' : 'z-10'} w-64 h-full border-r transition-all duration-300 flex flex-col shadow-lg ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                style={{ backgroundColor: currentThemeConfig?.primary }}
              >
                <BiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Admin Panel
                </h1>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Nutribot
                </p>
              </div>
            </div>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)} 
                className={`p-1 rounded transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BiX className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentThemeConfig?.primary }}
            >
              <span className="text-white font-medium">
                {userData.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="ml-3">
              <p className={`font-medium ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {userData.name}
              </p>
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {userData.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                      active
                        ? 'text-white shadow-lg transform scale-105'
                        : darkMode 
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                    }`}
                    style={active ? { 
                      background: `linear-gradient(135deg, ${currentThemeConfig?.primary} 0%, ${currentThemeConfig?.dark} 100%)`,
                      color: 'white'
                    } : {
                      color: darkMode ? '#e5e7eb' : '#4b5563' // gray-200 : gray-600
                    }}
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
        <div className={`p-4 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <Link
            to="/"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors mb-2 ${
              darkMode 
                ? 'text-gray-200 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <BiLeaf className="w-5 h-5 mr-3" />
            Về trang chính
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-200 hover:bg-red-900/20 hover:text-red-300'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <BiLogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`border-b px-4 py-3 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`mr-4 p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BiMenu className="w-6 h-6" />
                </button>
              )}
              <div>
                <h1 className={`text-xl font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Quản trị hệ thống
                </h1>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Nutribot Admin Panel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: currentThemeConfig?.primary }}
              >
                Admin
              </span>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentThemeConfig?.primary }}
              >
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