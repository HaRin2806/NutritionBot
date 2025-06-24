import React, { useState, useEffect } from 'react';
import {
  BiMessageSquareDetail, BiSearch, BiTrash, BiUser, BiCalendar, BiChat,
  BiRefresh, BiDownload, BiArchive, BiEdit, BiX, BiChevronDown
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader, Modal } from '../../components/common';
import { adminService } from '../../services/index';

const ConversationDetailModal = ({ conversation, isOpen, onClose }) => {
  const { darkMode } = useTheme();

  if (!conversation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết cuộc hội thoại" size="xl">
      <div className="space-y-6">
        {/* Conversation Info */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {conversation.title}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Người dùng:</span>
              <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {conversation.user_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Độ tuổi:</span>
              <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {conversation.age_context || 'N/A'} tuổi
              </span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tin nhắn:</span>
              <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {conversation.message_count || 0}
              </span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Trạng thái:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${conversation.is_archived
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                {conversation.is_archived ? 'Đã lưu trữ' : 'Hoạt động'}
              </span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tạo:</span>
              <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {new Date(conversation.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cập nhật:</span>
              <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {new Date(conversation.updated_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div>
          <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Tin nhắn ({conversation.messages?.length || 0})
          </h4>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {conversation.messages && conversation.messages.length > 0 ? (
              conversation.messages.map((message, index) => (
                <div key={index} className={`p-3 rounded-lg ${message.role === 'user'
                  ? darkMode ? 'bg-mint-900 ml-8' : 'bg-mint-100 ml-8'
                  : darkMode ? 'bg-gray-700 mr-8' : 'bg-gray-100 mr-8'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {message.role === 'user' ? '👤 Người dùng' : '🤖 Bot'}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {message.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BiMessageSquareDetail className={`w-12 h-12 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Không có tin nhắn nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const AdminConversations = () => {
  const { showSuccess, showError, showConfirm } = useApp();
  const { darkMode } = useTheme();

  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    age: '',
    archived: 'all'
  });

  const [selectedConversations, setSelectedConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({});

  // Load conversations
  const loadConversations = async (page = 1) => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading conversations from API...');

      const response = await adminService.getAllConversations(page, pagination.per_page, filters);

      if (response.success) {
        setConversations(response.conversations || []);
        setPagination(response.pagination || {
          page: 1,
          per_page: 20,
          total: response.conversations?.length || 0,
          pages: 1
        });

        console.log(`✅ Loaded ${response.conversations?.length || 0} conversations`);

        // Calculate stats
        const totalConversations = response.conversations?.length || 0;
        const activeConversations = response.conversations?.filter(c => !c.is_archived).length || 0;
        const archivedConversations = response.conversations?.filter(c => c.is_archived).length || 0;
        const todayConversations = response.conversations?.filter(c => {
          const today = new Date().toDateString();
          const convDate = new Date(c.created_at).toDateString();
          return today === convDate;
        }).length || 0;

        setStats({
          total: totalConversations,
          active: activeConversations,
          archived: archivedConversations,
          today: todayConversations
        });

      } else {
        console.error('❌ API error:', response.error);
        showError(response.error || 'Có lỗi xảy ra khi tải danh sách cuộc hội thoại');
        setConversations([]);
      }

    } catch (error) {
      console.error('❌ Network error:', error);
      showError('Không thể kết nối đến server');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations(pagination.page);
  }, [filters, pagination.page]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !filters.search ||
      conv.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      conv.user_name?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesAge = !filters.age || conv.age_context?.toString() === filters.age;

    const matchesArchived = filters.archived === 'all' ||
      (filters.archived === 'true' && conv.is_archived) ||
      (filters.archived === 'false' && !conv.is_archived);

    return matchesSearch && matchesAge && matchesArchived;
  });

  // Handle view conversation
  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowDetailModal(true);
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversation) => {
    const result = await showConfirm({
      title: 'Xóa cuộc hội thoại?',
      text: `Bạn có chắc muốn xóa cuộc hội thoại "${conversation.title}"?`,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.deleteAdminConversation(conversation.id);

        if (response.success) {
          await loadConversations(pagination.page);
          showSuccess('Đã xóa cuộc hội thoại thành công');
        } else {
          showError(response.error || 'Không thể xóa cuộc hội thoại');
        }
      } catch (error) {
        showError('Có lỗi xảy ra khi xóa cuộc hội thoại');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedConversations.length === 0) {
      showError('Vui lòng chọn ít nhất một cuộc hội thoại');
      return;
    }

    const result = await showConfirm({
      title: `Xóa ${selectedConversations.length} cuộc hội thoại?`,
      text: 'Hành động này không thể hoàn tác.',
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.bulkDeleteAdminConversations(selectedConversations);

        if (response.success) {
          setSelectedConversations([]);
          await loadConversations(pagination.page);
          showSuccess(`Đã xóa ${response.deleted_count || selectedConversations.length} cuộc hội thoại`);
        } else {
          showError(response.error || 'Không thể xóa các cuộc hội thoại đã chọn');
        }
      } catch (error) {
        showError('Có lỗi xảy ra khi xóa cuộc hội thoại');
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const csvContent = filteredConversations.map(conv =>
        `"${conv.title}","${conv.user_name}","${conv.age_context}","${conv.message_count}","${new Date(conv.created_at).toLocaleDateString()}"`
      ).join('\n');

      const blob = new Blob([`"Tiêu đề","Người dùng","Độ tuổi","Tin nhắn","Ngày tạo"\n${csvContent}`], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess('Đã xuất danh sách cuộc hội thoại');
    } catch (error) {
      showError('Không thể xuất danh sách cuộc hội thoại');
    }
  };

  // Handle select conversation
  const handleSelectConversation = (convId) => {
    setSelectedConversations(prev =>
      prev.includes(convId)
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(filteredConversations.map(conv => conv.id));
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quản lý cuộc hội thoại
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Xem và quản lý các cuộc hội thoại của người dùng
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => loadConversations(pagination.page)}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors shadow-sm ${darkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>

              <button
                onClick={handleExport}
                disabled={filteredConversations.length === 0}
                className="flex items-center px-4 py-2 bg-mint-600 text-mint rounded-lg hover:bg-mint-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiDownload className="mr-2" />
                Xuất Excel
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border transition-colors ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <BiMessageSquareDetail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tổng cuộc hội thoại
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition-colors ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                  <BiMessageSquareDetail className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Đang hoạt động
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.active || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition-colors ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <BiArchive className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Đã lưu trữ
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.archived || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition-colors ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <BiCalendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Hôm nay
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.today || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`p-6 rounded-xl shadow-sm border mb-6 transition-colors ${darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
          }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <BiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề hoặc người dùng..."
                className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500`}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div className="relative">
              <select
                className={`w-full px-3 py-2 pr-8 border rounded-lg appearance-none transition-colors ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500`}
                value={filters.age}
                onChange={(e) => setFilters(prev => ({ ...prev, age: e.target.value }))}
              >
                <option value="">Tất cả độ tuổi</option>
                {[...Array(19)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} tuổi</option>
                ))}
              </select>
              <BiChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>

            <div className="relative">
              <select
                className={`w-full px-3 py-2 pr-8 border rounded-lg appearance-none transition-colors ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500`}
                value={filters.archived}
                onChange={(e) => setFilters(prev => ({ ...prev, archived: e.target.value }))}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="false">Đang hoạt động</option>
                <option value="true">Đã lưu trữ</option>
              </select>
              <BiChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedConversations.length > 0 && (
          <div className={`p-4 rounded-xl border mb-6 transition-colors ${darkMode
            ? 'bg-mint-900 border-mint-700'
            : 'bg-mint-50 border-mint-200'
            }`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${darkMode ? 'text-mint-200' : 'text-mint-700'}`}>
                Đã chọn {selectedConversations.length} cuộc hội thoại
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedConversations([])}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Bỏ chọn
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  <BiTrash className="mr-1" />
                  Xóa đã chọn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-600 mx-auto mb-4"></div>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Đang tải danh sách cuộc hội thoại...</p>
            </div>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className={`rounded-xl shadow-sm border transition-colors ${darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            }`}>
            {/* Select All */}
            <div className={`p-4 border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedConversations.length === filteredConversations.length && filteredConversations.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                />
                <span className={`ml-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Chọn tất cả ({filteredConversations.length} cuộc hội thoại)
                </span>
              </label>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="w-12 px-6 py-4">
                      {/* Checkbox column */}
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Cuộc hội thoại
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Thời gian
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Độ tuổi
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Trạng thái
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredConversations.map((conversation, index) => (
                    <tr key={conversation.id} className={`transition-colors ${darkMode
                      ? 'hover:bg-gray-700'
                      : index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-25 hover:bg-gray-50'
                      }`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedConversations.includes(conversation.id)}
                          onChange={() => handleSelectConversation(conversation.id)}
                          className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="cursor-pointer group"
                          onClick={() => handleViewConversation(conversation)}
                        >
                          <div className={`font-medium group-hover:text-mint-600 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {conversation.title}
                          </div>
                          <div className={`text-xs mt-1 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <BiUser className="mr-1" />
                            {conversation.user_name} • {conversation.message_count || 0} tin nhắn
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(conversation.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(conversation.updated_at).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint-100 text-mint-800 dark:bg-mint-900 dark:text-mint-200">
                          {conversation.age_context || 'N/A'} tuổi
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {conversation.is_archived ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <BiArchive className="mr-1" />
                            Đã lưu trữ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewConversation(conversation)}
                            className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 dark:hover:bg-mint-900 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <BiChat className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteConversation(conversation)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <BiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Trang {pagination.page} / {pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50'
                      : 'border-gray-300 hover:bg-gray-100 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    Trước
                  </button>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.pages}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50'
                      : 'border-gray-300 hover:bg-gray-100 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-center py-12 rounded-xl border transition-colors ${darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            }`}>
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <BiMessageSquareDetail className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Không có cuộc hội thoại nào
            </h3>

            <p className={`mb-6 max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {filters.search || filters.age || filters.archived !== 'all'
                ? 'Không tìm thấy cuộc hội thoại phù hợp với bộ lọc'
                : 'Chưa có cuộc hội thoại nào được tạo'
              }
            </p>

            {(filters.search || filters.age || filters.archived !== 'all') && (
              <button
                onClick={() => {
                  setFilters({ search: '', age: '', archived: 'all' });
                }}
                className="flex items-center mx-auto px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-colors"
              >
                <BiX className="mr-1" />
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Conversation Detail Modal */}
        <ConversationDetailModal
          conversation={selectedConversation}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConversation(null);
          }}
        />
      </div>
    </div>
  );
};

export default AdminConversations;