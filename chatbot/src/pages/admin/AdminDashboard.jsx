import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BiMessageSquareDetail, BiFile, BiCog, 
  BiTrendingUp, BiBell, BiRefresh, BiDownload,
  BiUser, BiBot, BiData, BiShield 
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Header } from '../../components/layout';
import { Loader } from '../../components/common';
import adminService from '../../services/adminService';

const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center">
        <BiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
        <span className="text-sm text-green-600">{trend}</span>
      </div>
    )}
  </div>
);

const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'user_registered':
        return <BiUser className="w-4 h-4" />;
      case 'conversation_created':
        return <BiMessageSquareDetail className="w-4 h-4" />;
      case 'document_uploaded':
        return <BiFile className="w-4 h-4" />;
      default:
        return <BiBell className="w-4 h-4" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'user_registered':
        return 'text-green-600 bg-green-100';
      case 'conversation_created':
        return 'text-blue-600 bg-blue-100';
      case 'document_uploaded':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-full ${getColor(activity.type)}`}>
        {getIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-xs text-gray-500">{activity.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(activity.timestamp).toLocaleString('vi-VN')}
        </p>
      </div>
    </div>
  );
};

const AlertItem = ({ alert }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start">
        <BiBell className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">{alert.title}</p>
          <p className="text-xs mt-1">{alert.message}</p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userData, isLoading, requireAuth, showError } = useApp();
  
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    activities: [],
    alerts: []
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Auth check
  useEffect(() => {
    if (!isLoading && (!userData || !userData.is_admin)) {
      navigate('/');
      return;
    }
  }, [userData, isLoading, navigate]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!userData?.is_admin) return;

      try {
        setIsLoadingData(true);
        
        // Load overview stats
        const statsResponse = await adminService.getOverviewStats();
        
        // Load recent activities
        const activitiesResponse = await adminService.getRecentActivities();
        
        // Load system alerts
        const alertsResponse = await adminService.getSystemAlerts();
        
        setDashboardData({
          stats: statsResponse.success ? statsResponse.stats : {},
          activities: activitiesResponse.success ? activitiesResponse.activities : [],
          alerts: alertsResponse.success ? alertsResponse.alerts : []
        });
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Không thể tải dữ liệu dashboard');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardData();
  }, [userData]);

  const handleRefresh = async () => {
    if (!userData?.is_admin) return;

    try {
      setIsLoadingData(true);
      
      const [statsResponse, activitiesResponse, alertsResponse] = await Promise.all([
        adminService.getOverviewStats(),
        adminService.getRecentActivities(),
        adminService.getSystemAlerts()
      ]);
      
      setDashboardData({
        stats: statsResponse.success ? statsResponse.stats : {},
        activities: activitiesResponse.success ? activitiesResponse.activities : [],
        alerts: alertsResponse.success ? alertsResponse.alerts : []
      });
      
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      showError('Không thể làm mới dữ liệu');
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader type="spinner" color="mint" text="Đang tải..." />
      </div>
    );
  }

  if (!userData?.is_admin) {
    return null;
  }

  const { stats } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userData={userData} />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Chào mừng trở lại, {userData.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isLoadingData}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BiRefresh className={`mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button className="flex items-center px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-colors">
                <BiDownload className="mr-2" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader type="spinner" color="mint" text="Đang tải dữ liệu..." />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Tổng người dùng"
                value={stats.users?.total || 0}
                icon={<BiUser className="w-6 h-6 text-white" />}
                color="bg-blue-500"
                subtitle={`${stats.users?.new_today || 0} mới hôm nay`}
              />
              
              <StatCard
                title="Cuộc hội thoại"
                value={stats.conversations?.total || 0}
                icon={<BiMessageSquareDetail className="w-6 h-6 text-white" />}
                color="bg-green-500"
                subtitle={`${stats.conversations?.recent || 0} gần đây`}
              />
              
              <StatCard
                title="Tài liệu"
                value={stats.data?.total_items || 0}
                icon={<BiFile className="w-6 h-6 text-white" />}
                color="bg-purple-500"
                subtitle={`${stats.data?.embeddings || 0} embeddings`}
              />
              
              <StatCard
                title="Quản trị viên"
                value={stats.admins?.total || 0}
                icon={<BiShield className="w-6 h-6 text-white" />}
                color="bg-orange-500"
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
                  </div>
                  <div className="p-6">
                    {dashboardData.activities.length > 0 ? (
                      <div className="space-y-1">
                        {dashboardData.activities.slice(0, 10).map((activity, index) => (
                          <ActivityItem key={index} activity={activity} />
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

              {/* System Alerts */}
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Cảnh báo hệ thống</h3>
                  </div>
                  <div className="p-6">
                    {dashboardData.alerts.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardData.alerts.map((alert, index) => (
                          <AlertItem key={index} alert={alert} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BiBell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Không có cảnh báo</p>
                        <p className="text-sm text-green-600 mt-1">Hệ thống hoạt động bình thường</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <button
                      onClick={() => navigate('/admin/users')}
                      className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <BiUser className="w-5 h-5 text-blue-500 mr-3" />
                      <span>Quản lý người dùng</span>
                    </button>
                    
                    <button
                      onClick={() => navigate('/admin/documents')}
                      className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <BiFile className="w-5 h-5 text-purple-500 mr-3" />
                      <span>Quản lý tài liệu</span>
                    </button>
                    
                    <button
                      onClick={() => navigate('/admin/conversations')}
                      className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <BiMessageSquareDetail className="w-5 h-5 text-green-500 mr-3" />
                      <span>Xem cuộc hội thoại</span>
                    </button>
                    
                    <button
                      onClick={() => navigate('/admin/settings')}
                      className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <BiCog className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Cài đặt hệ thống</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* System Stats */}
            <div className="mt-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Thống kê hệ thống</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <BiData className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold text-gray-900">{stats.data?.total_chunks || 0}</p>
                      <p className="text-sm text-gray-600">Text Chunks</p>
                    </div>
                    
                    <div className="text-center">
                      <BiFile className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold text-gray-900">{stats.data?.total_tables || 0}</p>
                      <p className="text-sm text-gray-600">Bảng biểu</p>
                    </div>
                    
                    <div className="text-center">
                      <BiBot className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-2xl font-bold text-gray-900">{stats.data?.total_figures || 0}</p>
                      <p className="text-sm text-gray-600">Hình ảnh</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;