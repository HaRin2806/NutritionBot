import React, { useState, useEffect } from 'react';
import { 
  BiUser, BiSearch, BiTrash, BiEdit, BiDownload,
  BiUserCheck, BiUserX, BiFilter, BiRefresh, BiPlus, BiChat
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import adminService from '../../services/adminService';

const UserCard = ({ user, onEdit, onDelete, onView }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
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
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView(user)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Xem chi tiết"
        >
          <BiChat className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(user)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Chỉnh sửa"
        >
          <BiEdit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(user)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Xóa"
        >
          <BiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-500">Giới tính:</span>
        <span className="ml-1 text-gray-900">
          {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
        </span>
      </div>
      <div>
        <span className="text-gray-500">Vai trò:</span>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {user.role === 'admin' ? 'Admin' : 'Người dùng'}
        </span>
      </div>
      <div>
        <span className="text-gray-500">Cuộc hội thoại:</span>
        <span className="ml-1 text-gray-900">{user.conversation_count || 0}</span>
      </div>
      <div>
        <span className="text-gray-500">Ngày tạo:</span>
        <span className="ml-1 text-gray-900">
          {new Date(user.created_at).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </div>
  </div>
);

const UserDetailModal = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết người dùng" size="lg">
      <div className="space-y-6">
        {/* User Info */}
        <div className="flex items-center">
          <div className="w-16 h-16 bg-mint-100 rounded-full flex items-center justify-center">
            <span className="text-mint-600 font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{user.conversation_count || 0}</p>
            <p className="text-sm text-blue-800">Cuộc hội thoại</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {user.last_activity ? 'Có' : 'Chưa'}
            </p>
            <p className="text-sm text-green-800">Hoạt động</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-sm text-purple-800">Ngày tham gia</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giới tính</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : user.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          
          {user.last_activity && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Hoạt động gần nhất</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.last_activity).toLocaleString('vi-VN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const AdminUsers = () => {
  const { showSuccess, showError, showConfirm } = useApp();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load users
  const loadUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers(page, pagination.per_page, filters);
      
      if (response.success) {
        setUsers(response.users);
        setPagination(response.pagination);
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

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [filters]);

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadUsers(newPage);
  };

  // Handle view user
  const handleViewUser = async (user) => {
    try {
      const response = await adminService.getUserDetail(user.id);
      if (response.success) {
        setSelectedUser(response.user);
        setShowDetailModal(true);
      }
    } catch (error) {
      showError('Không thể tải chi tiết người dùng');
    }
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
          loadUsers(pagination.page);
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
          loadUsers(pagination.page);
        } else {
          showError('Không thể xóa người dùng đã chọn');
        }
      } catch (error) {
        showError('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const response = await adminService.exportUsers('csv', true);
      // Tạo file download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Đã xuất danh sách người dùng');
    } catch (error) {
      showError('Không thể xuất danh sách người dùng');
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
              onClick={() => loadUsers(pagination.page)}
              color="gray"
              outline
              icon={<BiRefresh />}
              disabled={isLoading}
            >
              Làm mới
            </Button>
            
            <Button
              onClick={handleExport}
              color="mint"
              outline
              icon={<BiDownload />}
            >
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiUser className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tổng người dùng</p>
                <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiUserCheck className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Đang hiển thị</p>
                <p className="text-xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiUserX className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Đã chọn</p>
                <p className="text-xl font-bold text-gray-900">{selectedUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiFilter className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Trang</p>
                <p className="text-xl font-bold text-gray-900">{pagination.page}/{pagination.pages}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {users.map(user => (
              <div key={user.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                  className="absolute top-4 left-4 rounded border-gray-300 text-mint-600 focus:ring-mint-500 z-10"
                />
                <UserCard
                  user={user}
                  onView={handleViewUser}
                  onEdit={(user) => console.log('Edit user:', user)}
                  onDelete={handleDeleteUser}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  color="gray"
                  outline
                >
                  Trước
                </Button>
                
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  let pageNumber;
                  if (pagination.pages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNumber = pagination.pages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      color={pagination.page === pageNumber ? "mint" : "gray"}
                      outline={pagination.page !== pageNumber}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  color="gray"
                  outline
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
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

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default AdminUsers;