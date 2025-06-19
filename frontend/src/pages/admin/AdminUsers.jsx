import React, { useState, useEffect } from 'react';
import {
  BiUser, BiSearch, BiTrash, BiEdit, BiRefresh, BiInfoCircle,
  BiCheck, BiCalendar, BiMessageSquareDetail, BiShield, BiGroup
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/index';

const UserCard = ({ user, onEdit, onDelete, onView, isSelected, onSelect }) => (
  <div className={`bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-300 ${
    isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
  }`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start space-x-3 flex-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user.id)}
          className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role === 'admin' ? 'Admin' : 'Người dùng'}
              </span>
              {user.gender && (
                <span className="text-xs text-gray-500">
                  {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 ml-2">
        <button
          onClick={() => onView(user)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Xem chi tiết"
        >
          <BiInfoCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(user)}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Chỉnh sửa"
        >
          <BiEdit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(user)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Xóa"
        >
          <BiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Hội thoại:</span>
          <span className="font-semibold text-blue-600">{user.conversation_count || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Tin nhắn:</span>
          <span className="font-semibold text-green-600">{user.message_count || 0}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">TB tin nhắn:</span>
          <span className="font-semibold text-purple-600">{user.avg_messages_per_conversation || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Ngày tạo:</span>
          <span className="text-gray-900">
            {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
          </span>
        </div>
      </div>
    </div>

    {user.last_activity && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <BiMessageSquareDetail className="w-4 h-4 mr-1" />
          <span>Hoạt động cuối: {new Date(user.last_activity).toLocaleString('vi-VN')}</span>
        </div>
      </div>
    )}
  </div>
);

const UserDetailModal = ({ user, isOpen, onClose }) => {
  const [userDetail, setUserDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useApp();

  useEffect(() => {
    if (user && isOpen) {
      loadUserDetail();
    }
  }, [user, isOpen]);

  const loadUserDetail = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await adminService.getUserDetail(user.id);
      if (response.success) {
        setUserDetail(response.user);
      } else {
        showError('Không thể tải chi tiết người dùng');
      }
    } catch (error) {
      console.error('Error loading user detail:', error);
      showError('Có lỗi xảy ra khi tải chi tiết người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết người dùng" size="lg">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader type="spinner" color="mint" text="Đang tải..." />
        </div>
      ) : userDetail ? (
        <div className="space-y-6">
          {/* User Info Header */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {userDetail.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{userDetail.name}</h3>
              <p className="text-gray-600">{userDetail.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  userDetail.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {userDetail.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </span>
                {userDetail.gender && (
                  <span className="text-sm text-gray-500">
                    {userDetail.gender === 'male' ? 'Nam' : userDetail.gender === 'female' ? 'Nữ' : 'Khác'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{userDetail.stats?.total_conversations || 0}</p>
              <p className="text-sm text-blue-800">Cuộc hội thoại</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{userDetail.stats?.total_messages || 0}</p>
              <p className="text-sm text-green-800">Tin nhắn</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">
                {userDetail.stats?.avg_messages_per_conversation?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-purple-800">TB tin nhắn/cuộc</p>
            </div>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày tạo tài khoản</label>
                <p className="text-sm text-gray-900">
                  {userDetail.created_at ? new Date(userDetail.created_at).toLocaleString('vi-VN') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đăng nhập cuối</label>
                <p className="text-sm text-gray-900">
                  {userDetail.last_login ? new Date(userDetail.last_login).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hoạt động cuối</label>
                <p className="text-sm text-gray-900">
                  {userDetail.stats?.most_recent_conversation 
                    ? new Date(userDetail.stats.most_recent_conversation).toLocaleString('vi-VN') 
                    : 'Chưa có hoạt động'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Thời gian sử dụng</label>
                <p className="text-sm text-gray-900">
                  {userDetail.created_at 
                    ? Math.floor((new Date() - new Date(userDetail.created_at)) / (1000 * 60 * 60 * 24)) 
                    : 0} ngày
                </p>
              </div>
            </div>
          </div>

          {/* Age Usage Stats */}
          {userDetail.age_usage && Object.keys(userDetail.age_usage).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Sử dụng theo độ tuổi</h4>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(userDetail.age_usage).map(([age, count]) => (
                  <div key={age} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{age} tuổi</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Conversations */}
          {userDetail.recent_conversations && userDetail.recent_conversations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Cuộc hội thoại gần đây</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userDetail.recent_conversations.slice(0, 5).map((conversation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">{conversation.title}</h5>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{conversation.message_count} tin nhắn</span>
                        {conversation.age_context && (
                          <>
                            <span>•</span>
                            <span>{conversation.age_context} tuổi</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(conversation.updated_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <BiMessageSquareDetail className="w-5 h-5 text-gray-400 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Không thể tải chi tiết người dùng</p>
        </div>
      )}
    </Modal>
  );
};

const UserEditModal = ({ user, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useApp();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        gender: user.gender || '',
        role: user.role || 'user'
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await adminService.updateUser(user.id, {
        name: formData.name,
        gender: formData.gender,
        role: formData.role
      });

      if (response.success) {
        showSuccess('Cập nhật người dùng thành công');
        onSuccess();
        onClose();
      } else {
        showError(response.error || 'Không thể cập nhật người dùng');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Có lỗi xảy ra khi cập nhật người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa người dùng" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          error={errors.name}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Chọn giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const AdminUsers = () => {
  const { showSuccess, showError, showConfirm } = useApp();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_admins: 0,
    total_regular_users: 0,
    active_users: 0,
    gender_stats: { male: 0, female: 0, other: 0, unknown: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    role: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers(1, 50, filters);

      if (response.success) {
        setUsers(response.users);
        setStats(response.stats);
      } else {
        showError('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Có lỗi xảy ra khi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user) => {
    const result = await showConfirm({
      title: 'Xóa người dùng?',
      text: `Bạn có chắc muốn xóa người dùng "${user.name}"? Hành động này sẽ xóa tất cả dữ liệu liên quan.`,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.deleteUser(user.id);
        if (response.success) {
          showSuccess('Đã xóa người dùng thành công');
          loadUsers();
        } else {
          showError(response.error || 'Không thể xóa người dùng');
        }
      } catch (error) {
        showError('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      showError('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    const result = await showConfirm({
      title: `Xóa ${selectedUsers.length} người dùng?`,
      text: 'Hành động này sẽ xóa tất cả dữ liệu liên quan và không thể hoàn tác.',
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.bulkDeleteUsers(selectedUsers);
        if (response.success) {
          showSuccess(`Đã xóa ${response.deleted_count} người dùng`);
          setSelectedUsers([]);
          loadUsers();
        } else {
          showError('Không thể xóa người dùng đã chọn');
        }
      } catch (error) {
        showError('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Quản lý người dùng
              </h1>
              <p className="text-gray-600 mt-1">Quản lý tài khoản và thông tin người dùng</p>
            </div>

            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <button
                onClick={loadUsers}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Tổng Người Dùng"
              value={stats.total_users.toLocaleString()}
              subtitle="Tất cả tài khoản"
              icon={<BiUser className="w-6 h-6 text-blue-600" />}
              color="bg-blue-50"
            />
            
            <StatCard
              title="Quản Trị Viên"
              value={stats.total_admins.toLocaleString()}
              subtitle="Tài khoản admin"
              icon={<BiShield className="w-6 h-6 text-purple-600" />}
              color="bg-purple-50"
            />
            
            <StatCard
              title="Người Dùng Thường"
              value={stats.total_regular_users.toLocaleString()}
              subtitle="Tài khoản thường"
              icon={<BiGroup className="w-6 h-6 text-green-600" />}
              color="bg-green-50"
            />
            
            <StatCard
              title="Đã Hoạt Động"
              value={stats.active_users.toLocaleString()}
              subtitle="Đã đăng nhập"
              icon={<BiCheck className="w-6 h-6 text-orange-600" />}
              color="bg-orange-50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                icon={<BiSearch />}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">Tất cả giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">Tất cả vai trò</option>
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={`${filters.sort_by}_${filters.sort_order}`}
                onChange={(e) => {
                  const [sort_by, sort_order] = e.target.value.split('_');
                  handleFilterChange('sort_by', sort_by);
                  handleFilterChange('sort_order', sort_order);
                }}
              >
                <option value="created_at_desc">Mới nhất</option>
                <option value="created_at_asc">Cũ nhất</option>
                <option value="name_asc">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">
                Đã chọn {selectedUsers.length} người dùng
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bỏ chọn
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <BiTrash className="w-4 h-4 mr-1" />
                  Xóa đã chọn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader type="spinner" color="mint" text="Đang tải danh sách người dùng..." />
          </div>
        ) : users.length > 0 ? (
          <>
            {/* Select All */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Chọn tất cả ({users.length} người dùng)
                </span>
              </label>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {users.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onView={handleViewUser}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={handleSelectUser}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có người dùng nào</h3>
            <p className="text-gray-500">
              {filters.search || filters.gender || filters.role
                ? 'Không tìm thấy người dùng phù hợp với bộ lọc'
                : 'Chưa có người dùng nào đăng ký'
              }
            </p>
          </div>
        )}

        {/* Modals */}
        <UserDetailModal
          user={selectedUser}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />

        <UserEditModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={loadUsers}
        />
      </div>
    </div>
  );
};

export default AdminUsers;