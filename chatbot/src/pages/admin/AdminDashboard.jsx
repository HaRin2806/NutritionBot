import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BiMessageSquareDetail, BiRefresh, BiUser, BiData, BiShield 
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
    data: { total_chunks: 0, total_items: 0 },
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
      
      // Gọi API admin để lấy thống kê chính xác
      const [overviewRes, activitiesRes] = await Promise.all([
        api.get('/admin/stats/overview'),
        api.get('/admin/recent-activities?limit=10')
      ]);

      if (overviewRes.data.success) {
        setStats(overviewRes.data.stats);
      }

      if (activitiesRes.data.success) {
        setActivities(activitiesRes.data.activities);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Không thể tải dữ liệu dashboard');
      
      // Fallback với dữ liệu cơ bản nếu API admin chưa hoạt động
      setStats({
        users: { total: 1, new_today: 0 },
        conversations: { total: 0, recent: 0 },
        data: { total_chunks: 0, total_items: 0 },
        admins: { total: 1 }
      });
      setActivities([]);
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
                {stats.users.new_today > 0 && (
                  <p className="text-xs text-green-600">+{stats.users.new_today} hôm nay</p>
                )}
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
                {stats.conversations.recent > 0 && (
                  <p className="text-xs text-green-600">+{stats.conversations.recent} gần đây</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-mint-100" style={{ backgroundColor: '#E6F7EF' }}>
                <BiData className="w-6 h-6 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Dữ liệu RAG</p>
                <p className="text-xl font-bold text-gray-900">{stats.data?.total_items || 0}</p>
                <p className="text-xs text-gray-500">{stats.data?.total_chunks || 0} chunks</p>
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
                        {activity.type === 'conversation_created' ? (
                          <BiMessageSquareDetail className="w-4 h-4 text-mint-600" style={{ color: '#36B37E' }} />
                        ) : activity.type === 'user_registered' ? (
                          <BiUser className="w-4 h-4 text-mint-600" style={{ color: '#36B37E' }} />
                        ) : (
                          <BiData className="w-4 h-4 text-mint-600" style={{ color: '#36B37E' }} />
                        )}
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
                  <BiData className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có hoạt động nào</p>
                  <p className="text-sm text-gray-400 mt-1">Các hoạt động của người dùng sẽ xuất hiện ở đây</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin hệ thống</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trạng thái</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Hoạt động
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phiên bản</span>
                <span className="text-sm font-medium text-gray-900">v1.0.0</span>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">RAG System</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Embedding Model</span>
                    <span className="font-medium text-xs">multilingual-e5-base</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Generation Model</span>
                    <span className="font-medium text-xs">Gemini 2.0 Flash</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vector Database</span>
                    <span className="font-medium text-xs">ChromaDB</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Database</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">MongoDB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Collections</span>
                    <span className="font-medium">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thống kê nhanh</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hôm nay</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stats.conversations.recent} cuộc hội thoại
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.users.new_today} người dùng mới
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cộng</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stats.conversations.total} cuộc hội thoại
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.users.total} người dùng
                    </div>
                  </div>
                </div>

                {stats.data?.total_items > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Dữ liệu RAG</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {stats.data.total_items} items
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.data.total_chunks} chunks
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;