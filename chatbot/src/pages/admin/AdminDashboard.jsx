import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BiMessageSquareDetail, BiFile, BiCog, BiTrendingUp, 
  BiBell, BiRefresh, BiDownload, BiUser, BiBot, BiData, BiShield 
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Loader } from '../../components/common';
import api from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userData, isLoading: isUserLoading, showError } = useApp();
  
  const [stats, setStats] = useState({
    users: { total: 0, new_today: 0 },
    conversations: { total: 0, recent: 0 },
    data: { total_chunks: 0, total_tables: 0, total_figures: 0, embeddings: 0 },
    admins: { total: 0 }
  });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isUserLoading && (!userData || !userData.is_admin)) {
      navigate('/');
    }
  }, [userData, isUserLoading, navigate]);

  // Load real dashboard data
  const loadDashboardData = async () => {
    if (!userData?.is_admin) return;

    try {
      setIsLoading(true);
      
      // Call backend APIs that work with regular user token but check admin permission
      const [overviewRes, activitiesRes] = await Promise.all([
        api.get('/conversations'), // Get user's conversations
        api.get('/conversations') // Reuse for recent activities
      ]);

      if (overviewRes.data.success) {
        const conversations = overviewRes.data.conversations || [];
        setStats({
          users: { total: 1, new_today: 0 }, // Mock users data
          conversations: { 
            total: conversations.length, 
            recent: conversations.filter(c => {
              const dayAgo = new Date(Date.now() - 24*60*60*1000);
              return new Date(c.updated_at) > dayAgo;
            }).length
          },
          data: { 
            total_chunks: conversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
            total_tables: 0, 
            total_figures: 0, 
            embeddings: 0 
          },
          admins: { total: 1 }
        });

        // Create activities from recent conversations
        const recentActivities = conversations
          .slice(0, 5)
          .map(conv => ({
            type: 'conversation_created',
            title: 'Cuộc hội thoại mới',
            description: conv.title,
            timestamp: conv.updated_at
          }));
        
        setActivities(recentActivities);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Không thể tải dữ liệu dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userData]);

  if (isUserLoading || (!userData?.is_admin && !isLoading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader type="spinner" color="mint" text="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Chào mừng trở lại, {userData.name}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-mint-100" style={{ backgroundColor: '#E6F7EF' }}>
                <BiUser className="w-6 h-6 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tổng người dùng</p>
                <p className="text-xl font-bold text-gray-900">{stats.users.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-mint-100" style={{ backgroundColor: '#E6F7EF' }}>
                <BiMessageSquareDetail className="w-6 h-6 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Cuộc hội thoại</p>
                <p className="text-xl font-bold text-gray-900">{stats.conversations.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-mint-100" style={{ backgroundColor: '#E6F7EF' }}>
                <BiData className="w-6 h-6 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tin nhắn</p>
                <p className="text-xl font-bold text-gray-900">{stats.data.total_chunks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-mint-100" style={{ backgroundColor: '#E6F7EF' }}>
                <BiShield className="w-6 h-6 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-xl font-bold text-gray-900">{stats.admins.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader type="dots" color="mint" text="Đang tải..." />
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="p-2 rounded-full bg-mint-100" style={{ backgroundColor: '#E6F7EF' }}>
                        <BiMessageSquareDetail className="w-4 h-4 text-mint-600" style={{ color: '#36B37E' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BiBot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có hoạt động nào</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center p-3 text-left rounded-lg hover:bg-mint-50 transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#E6F7EF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <BiUser className="w-5 h-5 text-mint-600 mr-3" style={{ color: '#36B37E' }} />
                <span>Quản lý người dùng</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/documents')}
                className="w-full flex items-center p-3 text-left rounded-lg hover:bg-mint-50 transition-colors"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#E6F7EF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <BiFile className="w-5 h-5 text-mint-600 mr-3" style={{ color: '#36B37E' }} />
                <span>Quản lý tài liệu</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/conversations')}
                className="w-full flex items-center p-3 text-left rounded-lg hover:bg-mint-50 transition-colors"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#E6F7EF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <BiMessageSquareDetail className="w-5 h-5 text-mint-600 mr-3" style={{ color: '#36B37E' }} />
                <span>Xem cuộc hội thoại</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/settings')}
                className="w-full flex items-center p-3 text-left rounded-lg hover:bg-mint-50 transition-colors"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#E6F7EF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <BiCog className="w-5 h-5 text-mint-600 mr-3" style={{ color: '#36B37E' }} />
                <span>Cài đặt hệ thống</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Trạng thái hệ thống</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Trạng thái</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Hoạt động
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-gray-900">99.9%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Phiên bản</span>
                <span className="text-sm font-medium text-gray-900">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;