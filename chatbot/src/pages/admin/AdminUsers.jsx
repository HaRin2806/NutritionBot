import React, { useState, useEffect } from 'react';
import {
  BiUser, BiSearch, BiTrash, BiEdit, BiRefresh, BiInfoCircle,
  BiMessageSquareDetail, BiCheck
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/index';

const UserCard = ({ user, onEdit, onDelete, onView, isSelected, onSelect }) => (
  <div className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${isSelected ? 'border-mint-300 bg-mint-50' : 'border-gray-200'
    }`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user.id)}
          className="mt-1 mr-3 rounded border-gray-300 text-mint-600 focus:ring-mint-500"
        />
        <div className="flex items-center">
          <div className="w-10 h-10 bg-mint-100 rounded-full flex items-center justify-center">
            <span className="text-mint-600 font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView(user)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Xem chi tiết người dùng"
        >
          <BiInfoCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(user)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Chỉnh sửa người dùng"
        >
          <BiEdit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(user)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Xóa người dùng"
        >
          <BiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-500">Giới tính:</span>
        <span className="ml-1 text-gray-900">
          {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : user.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
        </span>
      </div>
      <div>
        <span className="text-gray-500">Vai trò:</span>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {user.role === 'admin' ? 'Admin' : 'Người dùng'}
        </span>
      </div>
      <div>
        <span className="text-gray-500">Cuộc hội thoại:</span>
        <span className="ml-1 text-gray-900 font-medium">{user.conversation_count || 0}</span>
      </div>
      <div>
        <span className="text-gray-500">Ngày tạo:</span>
        <span className="ml-1 text-gray-900">
          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
        </span>
      </div>
    </div>

    {/* Hiển thị hoạt động gần đây */}
    {user.last_activity && (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <BiMessageSquareDetail className="w-4 h-4 mr-1" />
          <span>Hoạt động cuối: {new Date(user.last_activity).toLocaleDateString('vi-VN')}</span>
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
      // Hiển thị thông tin cơ bản nếu API chưa hoạt động
      setUserDetail({
        ...user,
        stats: {
          total_conversations: user.conversation_count || 0,
          total_messages: (user.conversation_count || 0) * 6,
          avg_messages_per_conversation: 6.0,
          most_recent_conversation: user.last_activity
        },
        recent_conversations: []
      });
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
          {/* User Info */}
          <div className="flex items-center">
            <div className="w-16 h-16 bg-mint-100 rounded-full flex items-center justify-center">
              <span className="text-mint-600 font-bold text-xl">
                {userDetail.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">{userDetail.name}</h3>
              <p className="text-gray-600">{userDetail.email}</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${userDetail.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {userDetail.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{userDetail.stats?.total_conversations || 0}</p>
              <p className="text-sm text-blue-800">Cuộc hội thoại</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{userDetail.stats?.total_messages || 0}</p>
              <p className="text-sm text-green-800">Tin nhắn</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {userDetail.stats?.avg_messages_per_conversation?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-purple-800">TB tin nhắn/cuộc</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                <p className="mt-1 text-sm text-gray-900">
                  {userDetail.gender === 'male' ? 'Nam' : userDetail.gender === 'female' ? 'Nữ' : userDetail.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                <p className="mt-1 text-sm text-gray-900">
                  {userDetail.created_at ? new Date(userDetail.created_at).toLocaleString('vi-VN') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hoạt động cuối</label>
                <p className="mt-1 text-sm text-gray-900">
                  {userDetail.stats?.most_recent_conversation ? new Date(userDetail.stats.most_recent_conversation).toLocaleString('vi-VN') : 'Chưa có hoạt động'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Thời gian tham gia</label>
                <p className="mt-1 text-sm text-gray-900">
                  {userDetail.created_at ? Math.floor((new Date() - new Date(userDetail.created_at)) / (1000 * 60 * 60 * 24)) : 0} ngày
                </p>
              </div>
            </div>
          </div>

          {/* Recent Conversations */}
          {userDetail.recent_conversations && userDetail.recent_conversations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Cuộc hội thoại gần đây</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {userDetail.recent_conversations.map((conversation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{conversation.title}</h5>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <span>{conversation.message_count} tin nhắn</span>
                        <span>•</span>
                        <span>{conversation.age_context} tuổi</span>
                        <span>•</span>
                        <span>{new Date(conversation.updated_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <BiMessageSquareDetail className="w-5 h-5 text-gray-400" />
                    </div>
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

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Gọi API update thật
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            color="gray"
            outline
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            color="mint"
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
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load users
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers(1, 50, filters);

      if (response.success) {
        setUsers(response.users);
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

  // Initial load và load khi filters thay đổi
  useEffect(() => {
    loadUsers();
  }, [filters]);

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle view user
  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle delete user
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

  // Handle bulk delete
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

  // Handle select user
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý tài khoản và thông tin người dùng</p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={loadUsers}
              color="mint"
              outline
              icon={<BiRefresh />}
              disabled={isLoading}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiUser className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tổng người dùng</p>
                <p className="text-xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiMessageSquareDetail className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tổng cuộc hội thoại</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.reduce((total, user) => total + (user.conversation_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiCheck className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Người dùng hoạt động</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.filter(user => user.last_activity).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
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
        <div className="bg-mint-50 border border-mint-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-mint-700 font-medium">
              Đã chọn {selectedUsers.length} người dùng
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedUsers([])}
                color="gray"
                size="sm"
                outline
              >
                Bỏ chọn
              </Button>
              <Button
                onClick={handleBulkDelete}
                color="red"
                size="sm"
                icon={<BiTrash />}
              >
                Xóa đã chọn
              </Button>
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
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Chọn tất cả ({users.length} người dùng)
              </span>
            </label>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {filters.search || filters.gender
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
        onSuccess={() => {
          loadUsers();
        }}
      />
    </div>
  );
};

export default AdminUsers;