import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiMessageSquareDetail, BiRefresh, BiUser, BiData, BiShield,
  BiTrendingUp, BiCalendar, BiBarChart, BiCog
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader } from '../../components/common';
import api from '../../services/baseApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userData, isLoading: isUserLoading, showError } = useApp();
  const { darkMode, currentThemeConfig } = useTheme();

  const [stats, setStats] = useState({
    users: { total: 0, new_today: 0, active: 0 },
    conversations: { total: 0, recent: 0 },
    messages: { total: 0, avg_per_conversation: 0 },
    admins: { total: 0 },
    daily_stats: [],
    age_distribution: []
  });

  const [systemInfo, setSystemInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isUserLoading && (!userData || !userData.is_admin)) {
      navigate('/');
    }
  }, [userData, isUserLoading, navigate]);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!userData?.is_admin) return;

    try {
      setIsLoading(true);

      const [overviewRes, systemRes] = await Promise.all([
        api.get('/admin/stats/overview'),
        api.get('/admin/system-info')
      ]);

      if (overviewRes.success) {
        setStats(overviewRes.stats);
      } else {
        throw new Error(overviewRes.error || 'Không thể tải thống kê');
      }

      if (systemRes.success) {
        setSystemInfo(systemRes.system_info);
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

  const StatCard = ({ title, value, subtitle, icon, color, trend, iconColor }) => (
    <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <BiTrendingUp className={`w-4 h-4 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <div style={{ color: iconColor || currentThemeConfig?.primary }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, data, type = 'bar', showDetails = false }) => (
    <div className={`rounded-xl shadow-sm border p-6 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.count || d.conversations || 1));
          const currentValue = item.count || item.conversations || 0;
          const percentage = maxValue > 0 ? (currentValue / maxValue * 100) : 0;

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.label || item.age_group}
                  {showDetails && item.date && (
                    <span className={`text-xs ml-1 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      ({new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' })})
                    </span>
                  )}
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-24 rounded-full h-2 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(to right, ${currentThemeConfig?.primary}, ${currentThemeConfig?.dark})`
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-8 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentValue}
                  </span>
                </div>
              </div>

              {/* Show breakdown for daily stats */}
              {showDetails && item.created !== undefined && item.updated !== undefined && (
                <div className={`text-xs ml-4 ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Mới: {item.created}, Cập nhật: {item.updated}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const SystemInfoCard = ({ title, icon, children }) => (
    <div className={`rounded-xl shadow-sm border p-6 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        <span style={{ color: currentThemeConfig?.primary }} className="mr-2">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-green-50'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                darkMode 
                  ? 'from-white to-gray-300' 
                  : 'from-gray-900 to-gray-700'
              }`}>
                Dashboard Quản Trị
              </h1>
              <p className={`mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Chào mừng trở lại, {userData?.name} • Hôm nay {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors shadow-sm ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>

              <div className={`border rounded-lg px-4 py-2 shadow-sm ${
                darkMode
                  ? 'bg-gray-800 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Hệ thống hoạt động
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Tổng Người Dùng"
              value={stats.users.total.toLocaleString()}
              subtitle={stats.users.new_today > 0 ? `+${stats.users.new_today} hôm nay` : 'Không có người dùng mới'}
              icon={<BiUser className="w-6 h-6" />}
              color={darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}
              iconColor="#3B82F6"
              trend={stats.users.new_today > 0 ? Math.round((stats.users.new_today / stats.users.total) * 100) : 0}
            />

            <StatCard
              title="Cuộc Hội Thoại"
              value={stats.conversations.total.toLocaleString()}
              subtitle={stats.conversations.recent > 0 ? `${stats.conversations.recent} gần đây` : 'Không có hội thoại mới'}
              icon={<BiMessageSquareDetail className="w-6 h-6" />}
              color={darkMode ? 'bg-green-900/30' : 'bg-green-50'}
              iconColor="#10B981"
              trend={stats.conversations.recent > 0 ? Math.round((stats.conversations.recent / stats.conversations.total) * 100) : 0}
            />

            <StatCard
              title="Tin Nhắn"
              value={stats.messages.total.toLocaleString()}
              subtitle={`TB: ${stats.messages.avg_per_conversation} tin nhắn/cuộc`}
              icon={<BiBarChart className="w-6 h-6" />}
              color={darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}
              iconColor="#8B5CF6"
            />

            <StatCard
              title="Quản Trị Viên"
              value={stats.admins.total.toLocaleString()}
              subtitle="Tài khoản admin"
              icon={<BiShield className="w-6 h-6" />}
              color={darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}
              iconColor="#F59E0B"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Activity Chart */}
          {stats.daily_stats.length > 0 && (
            <ChartCard
              title="Hoạt động 7 ngày qua"
              data={stats.daily_stats}
              showDetails={true}
            />
          )}

          {/* Age Distribution */}
          {stats.age_distribution.length > 0 && (
            <ChartCard
              title="Phân bố theo độ tuổi"
              data={stats.age_distribution}
            />
          )}
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SystemInfoCard title="Cơ sở dữ liệu" icon={<BiData />}>
            {systemInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loại</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.database.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Collections</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.database.collections}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Trạng thái</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                    {systemInfo.database.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
            )}
          </SystemInfoCard>

          <SystemInfoCard title="Vector Database" icon={<BiCog />}>
            {systemInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loại</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.vector_db.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Embeddings</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.vector_db.embeddings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Model</span>
                  <span className={`font-medium text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.vector_db.model}
                  </span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
            )}
          </SystemInfoCard>

          <SystemInfoCard title="AI Models" icon={<BiShield />}>
            {systemInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Generation</span>
                  <span className={`font-medium text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.ai.generation_model}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Embedding</span>
                  <span className={`font-medium text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {systemInfo.ai.embedding_model}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Trạng thái</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                    {systemInfo.ai.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
            )}
          </SystemInfoCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;