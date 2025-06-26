import React, { useState, useEffect } from 'react';
import { 
  BiCog, BiShield, BiServer, BiChart, BiRefresh, BiDownload, 
  BiCheck, BiX, BiTime, BiBrain, BiLock,
  BiMemoryCard, BiHdd, BiWifi, BiSave,
  BiData
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { Loader, Button } from '../../components/common';
import { adminService } from '../../services/index';

const StatusIndicator = ({ status, children }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'active':
      case 'success':
        return 'text-green-500';
      case 'error':
      case 'failed':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'active':
      case 'success':
        return <BiCheck className="w-5 h-5" />;
      case 'error':
      case 'failed':
        return <BiX className="w-5 h-5" />;
      case 'warning':
        return <BiShield className="w-5 h-5" />;
      default:
        return <BiTime className="w-5 h-5" />;
    }
  };

  return (
    <div className={`flex items-center ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="ml-2">{children}</span>
    </div>
  );
};

const MetricCard = ({ icon, title, value, unit, color = "mint" }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">
            {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

const LogEntry = ({ log }) => {
  const getLevelColor = () => {
    switch (log.level?.toLowerCase()) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border-b border-gray-100 py-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor()}`}>
              {log.level}
            </span>
            <span className="text-xs text-gray-500">{log.source}</span>
            <span className="text-xs text-gray-400">
              {new Date(log.timestamp).toLocaleString('vi-VN')}
            </span>
          </div>
          <p className="text-sm text-gray-700 font-mono">{log.message}</p>
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { showSuccess, showError } = useApp();
  
  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    systemConfig: null,
    performance: null,
    logs: [],
    security: null
  });

  const tabs = [
    { id: 'system', label: 'Hệ thống', icon: <BiServer /> },
    { id: 'performance', label: 'Hiệu năng', icon: <BiChart /> },
    { id: 'security', label: 'Bảo mật', icon: <BiShield /> },
    { id: 'logs', label: 'Logs', icon: <BiCog /> }
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [systemConfig, performance, logs, security] = await Promise.all([
        adminService.getSystemConfig(),
        adminService.getPerformanceMetrics(),
        adminService.getSystemLogs(),
        adminService.getSecuritySettings()
      ]);

      setData({
        systemConfig: systemConfig.success ? systemConfig.system_config : null,
        performance: performance.success ? performance.performance : null,
        logs: logs.success ? logs.logs : [],
        security: security.success ? security.security : null
      });

    } catch (error) {
      console.error('Error loading settings data:', error);
      showError('Không thể tải dữ liệu cài đặt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await adminService.createBackup();
      if (response.success) {
        showSuccess(`Backup thành công! File: ${response.backup.filename}`);
      } else {
        showError('Không thể tạo backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showError('Lỗi khi tạo backup');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader type="spinner" color="mint" text="Đang tải cài đặt..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
            <p className="text-gray-600">Quản lý và giám sát hệ thống Nutribot</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={loadData}
              color="gray"
              outline
              icon={<BiRefresh />}
              disabled={isLoading}
            >
              Làm mới
            </Button>
            
            <Button
              onClick={handleBackup}
              color="mint"
              outline
              icon={<BiRefresh />}
            >
              Tạo Backup
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-mint-500 text-mint-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'system' && data.systemConfig && (
        <div className="space-y-6">
          {/* Application Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BiCog className="mr-2" />
              Cấu hình ứng dụng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Debug Mode:</span>
                  <StatusIndicator status={data.systemConfig.application.debug_mode ? 'warning' : 'success'}>
                    {data.systemConfig.application.debug_mode ? 'Bật' : 'Tắt'}
                  </StatusIndicator>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">JWT Secret:</span>
                  <StatusIndicator status={data.systemConfig.application.secret_key_configured ? 'success' : 'error'}>
                    {data.systemConfig.application.secret_key_configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                  </StatusIndicator>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Database:</span>
                  <span className="text-gray-900 font-medium">{data.systemConfig.application.database_name}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Embedding Model:</span>
                  <span className="text-gray-900 font-medium">{data.systemConfig.application.embedding_model}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Gemini API:</span>
                  <StatusIndicator status={data.systemConfig.application.gemini_configured ? 'success' : 'error'}>
                    {data.systemConfig.application.gemini_configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                  </StatusIndicator>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection:</span>
                  <span className="text-gray-900 font-medium">{data.systemConfig.application.collection_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MongoDB */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BiData className="mr-2" />
                MongoDB
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <StatusIndicator status={data.systemConfig.database.mongodb.status}>
                    {data.systemConfig.database.mongodb.status}
                  </StatusIndicator>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Collections ({data.systemConfig.database.mongodb.collections.length}):</p>
                  <div className="space-y-1">
                    {data.systemConfig.database.mongodb.collections.map(collection => (
                      <div key={collection} className="flex justify-between">
                        <span>{collection}</span>
                        <span className="font-medium">
                          {data.systemConfig.database.mongodb.statistics[collection]?.document_count || 0} docs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Vector Database */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BiBrain className="mr-2" />
                Vector Database
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <StatusIndicator status={data.systemConfig.database.vector_db.status}>
                    {data.systemConfig.database.vector_db.status}
                  </StatusIndicator>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents:</span>
                  <span className="text-gray-900 font-medium">
                    {data.systemConfig.database.vector_db.document_count.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="text-gray-900 font-medium">
                    {data.systemConfig.database.vector_db.statistics.embedding_model || 'multilingual-e5-base'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BiServer className="mr-2" />
              Thông tin hệ thống
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{data.systemConfig.system.python_version}</div>
                <div className="text-sm text-gray-600">Python</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{data.systemConfig.system.cpu_count}</div>
                <div className="text-sm text-gray-600">CPU Cores</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{data.systemConfig.system.memory_total}GB</div>
                <div className="text-sm text-gray-600">RAM</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{data.systemConfig.system.disk_usage}%</div>
                <div className="text-sm text-gray-600">Disk Usage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && data.performance && (
        <div className="space-y-6">
          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<BiMemoryCard />}
              title="CPU Usage"
              value={data.performance.system.cpu_usage}
              unit="%"
              color="blue"
            />
            
            <MetricCard
              icon={<BiMemoryCard />}
              title="Memory Usage"
              value={data.performance.system.memory_usage}
              unit="%"
              color="green"
            />
            
            <MetricCard
              icon={<BiHdd />}
              title="Disk Usage"
              value={data.performance.system.disk_usage}
              unit="%"
              color="yellow"
            />
            
            <MetricCard
              icon={<BiWifi />}
              title="Uptime"
              value={data.performance.system.uptime}
              unit=""
              color="purple"
            />
          </div>

          {/* Database Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Documents:</span>
                  <span className="font-medium">{data.performance.database.total_documents?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Query Speed:</span>
                  <span className="font-medium">{data.performance.database.query_speed || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent Activity:</span>
                  <span className="font-medium">{data.performance.database.recent_activity || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vector Search</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Vectors:</span>
                  <span className="font-medium">{data.performance.vector_search.total_vectors?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Search Speed:</span>
                  <span className="font-medium">{data.performance.vector_search.search_speed_ms || 'N/A'}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium">{data.performance.vector_search.retrieval_accuracy || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Generation</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">{data.performance.ai_generation.average_response_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">{data.performance.ai_generation.success_rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Requests:</span>
                  <span className="font-medium">{data.performance.ai_generation.daily_requests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && data.security && (
        <div className="space-y-6">
          {/* Security Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BiLock className="mr-2" />
              Cấu hình bảo mật
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">JWT Token:</span>
                  <StatusIndicator status={data.security.configuration.jwt_configured ? 'success' : 'error'}>
                    {data.security.configuration.jwt_configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                  </StatusIndicator>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">SSL/HTTPS:</span>
                  <StatusIndicator status={data.security.configuration.ssl_enabled ? 'success' : 'warning'}>
                    {data.security.configuration.ssl_enabled ? 'Đã bật' : 'Chưa bật'}
                  </StatusIndicator>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate Limiting:</span>
                  <StatusIndicator status={data.security.configuration.rate_limiting ? 'success' : 'warning'}>
                    {data.security.configuration.rate_limiting ? 'Đã bật' : 'Chưa bật'}
                  </StatusIndicator>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Admin Accounts:</span>
                  <span className="font-medium">{data.security.configuration.admin_accounts}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Timeout:</span>
                  <span className="font-medium">{data.security.configuration.session_timeout}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Password Length:</span>
                  <span className="font-medium">{data.security.configuration.password_policy.min_length} ký tự</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Login Attempts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử đăng nhập gần đây</h3>
            
            <div className="space-y-2">
              {data.security.recent_logins.map((login, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <StatusIndicator status={login.status}>
                      {login.user}
                    </StatusIndicator>
                    <span className="text-sm text-gray-500">từ {login.ip}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(login.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Khuyến nghị bảo mật</h3>
            
            <div className="space-y-3">
              {data.security.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <BiShield className={`w-5 h-5 mt-0.5 ${
                    rec.priority === 'high' ? 'text-red-500' : 
                    rec.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority === 'high' ? 'Cao' : rec.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
              <Button
                onClick={loadData}
                color="gray"
                size="sm"
                icon={<BiRefresh />}
              >
                Refresh
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-1">
              {data.logs.length > 0 ? (
                data.logs.map((log, index) => (
                  <LogEntry key={index} log={log} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BiCog className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Không có logs nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;