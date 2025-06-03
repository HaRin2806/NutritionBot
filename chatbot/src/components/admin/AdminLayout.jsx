import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BiHome, BiUser, BiFile, BiMessageSquareDetail, 
  BiCog, BiBarChart, BiMenu, BiX, BiLeaf, BiShield,
  BiLogOut
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Loader } from '../common';
import adminService from '../../services/adminService';

const AdminSidebar = ({ isOpen, onClose, isMobile, adminData }) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      await adminService.adminLogout();
      // Clear admin data from localStorage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      navigate('/');
    } catch (error) {
      console.error('Admin logout error:', error);
      navigate('/');
    }
  };

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
                {adminData?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-white font-medium">{adminData?.name || 'Admin'}</p>
              <p className="text-gray-400 text-sm">{adminData?.email}</p>
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
            onClick={handleLogout}
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

const AdminHeader = ({ onToggleSidebar, isMobile, adminData }) => {
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
  const { userData, showError } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle resize
  useEffect(() => {
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

  // Verify admin auth and load admin data
  useEffect(() => {
    const verifyAdminAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have admin token
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
          // Try to verify current user token for admin
          if (userData?.is_admin) {
            // User is admin, allow access
            setAdminData(userData);
            setIsLoading(false);
            return;
          } else {
            // Not admin, redirect
            navigate('/');
            return;
          }
        }

        // Verify admin token
        const response = await adminService.verifyAdminToken();
        if (response.success) {
          setAdminData(response.admin);
          localStorage.setItem('admin_data', JSON.stringify(response.admin));
        } else {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_data');
          navigate('/');
        }
      } catch (error) {
        console.error('Admin auth verification failed:', error);
        
        // Check if regular user is admin
        if (userData?.is_admin) {
          setAdminData(userData);
        } else {
          showError('Không có quyền truy cập admin');
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAuth();
  }, [userData, navigate, showError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader type="spinner" color="mint" text="Đang xác thực..." />
        </div>
      </div>
    );
  }

  if (!adminData) {
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
          adminData={adminData}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
          adminData={adminData}
        />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;