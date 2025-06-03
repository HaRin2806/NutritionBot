import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BiHome, BiUser, BiFile, BiMessageSquareDetail, 
  BiCog, BiBarChart, BiMenu, BiX, BiLeaf, BiShield,
  BiLogOut
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';

const AdminSidebar = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const { userData, logout } = useApp();

  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: BiHome
    },
    {
      path: '/admin/users',
      name: 'Quản lý người dùng',
      icon: BiUser
    },
    {
      path: '/admin/documents',
      name: 'Quản lý tài liệu',
      icon: BiFile
    },
    {
      path: '/admin/conversations',
      name: 'Cuộc hội thoại',
      icon: BiMessageSquareDetail
    },
    {
      path: '/admin/analytics',
      name: 'Phân tích',
      icon: BiBarChart
    },
    {
      path: '/admin/settings',
      name: 'Cài đặt',
      icon: BiCog
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'z-30' : 'z-10'}
        w-64 h-full bg-gray-900 transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-mint-500 to-mint-600 rounded-lg flex items-center justify-center mr-3">
                <BiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Admin Panel</h1>
                <p className="text-gray-400 text-sm">Nutribot</p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <BiX className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-mint-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {userData?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-white font-medium">{userData?.name || 'Admin'}</p>
              <p className="text-gray-400 text-sm">{userData?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={isMobile ? onClose : undefined}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-colors
                      ${isActive(item.path)
                        ? 'bg-mint-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
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
        <div className="p-4 border-t border-gray-700">
          <Link
            to="/"
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mb-2"
          >
            <BiLeaf className="w-5 h-5 mr-3" />
            Về trang chính
          </Link>
          
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors"
          >
            <BiLogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

const AdminHeader = ({ onToggleSidebar, isMobile }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isMobile && (
            <button
              onClick={onToggleSidebar}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100"
            >
              <BiMenu className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Quản lý hệ thống Nutribot</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Chế độ quản trị</p>
            <p className="text-xs text-gray-500">Truy cập đầy đủ</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-mint-500 to-mint-600 rounded-full flex items-center justify-center">
            <BiShield className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { userData, isLoading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not admin
  React.useEffect(() => {
    if (!isLoading && (!userData || !userData.is_admin)) {
      navigate('/');
    }
  }, [userData, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-mint-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!userData?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${isMobile ? '' : 'w-64 flex-shrink-0'}`}>
        <AdminSidebar
          isOpen={!isMobile || sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;