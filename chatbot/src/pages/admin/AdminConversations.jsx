import React, { useState, useEffect } from 'react';
import { 
  BiMessageSquareDetail, BiSearch, BiTrash, BiUser,
  BiFilter, BiRefresh, BiDownload, BiCalendar, BiChat
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import adminService from '../../services/adminService';

const ConversationCard = ({ conversation, onView, onDelete, isSelected, onSelect }) => (
  <div className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${
    isSelected ? 'border-mint-300 bg-mint-50' : 'border-gray-200'
  }`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(conversation.id)}
          className="mt-1 mr-3 rounded border-gray-300 text-mint-600 focus:ring-mint-500"
        />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
            {conversation.title}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <BiUser className="w-4 h-4" />
            <span>{conversation.user_name || 'N/A'}</span>
            <span>•</span>
            <span>{conversation.message_count || 0} tin nhắn</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {conversation.age_context || 'N/A'} tuổi
            </span>
            {conversation.is_archived && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Đã lưu trữ
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="text-xs text-gray-500 mb-3">
      <div>Tạo: {new Date(conversation.created_at).toLocaleString('vi-VN')}</div>
      <div>Cập nhật: {new Date(conversation.updated_at).toLocaleString('vi-VN')}</div>
    </div>

    <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">
        ID: {conversation.id.slice(-8)}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView(conversation)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Xem chi tiết"
        >
          <BiChat className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(conversation)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Xóa"
        >
          <BiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const ConversationDetailModal = ({ conversation, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (conversation && isOpen) {
      // Load conversation messages
      // This would typically fetch from an API
      setMessages(conversation.messages || []);
    }
  }, [conversation, isOpen]);

  if (!conversation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết cuộc hội thoại" size="xl">
      <div className="space-y-6">
        {/* Conversation Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{conversation.title}</h3>
          <div className ="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Người dùng:</span>
              <span className="ml-2 font-medium">{conversation.user_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Độ tuổi:</span>
              <span className="ml-2 font-medium">{conversation.age_context || 'N/A'} tuổi</span>
            </div>
            <div>
              <span className="text-gray-600">Tin nhắn:</span>
              <span className="ml-2 font-medium">{conversation.message_count || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Trạng thái:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                conversation.is_archived ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {conversation.is_archived ? 'Đã lưu trữ' : 'Hoạt động'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Tạo:</span>
              <span className="ml-2">{new Date(conversation.created_at).toLocaleString('vi-VN')}</span>
            </div>
            <div>
              <span className="text-gray-600">Cập nhật:</span>
              <span className="ml-2">{new Date(conversation.updated_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div>
          <h4 className="font-semibold mb-3">Tin nhắn ({messages.length})</h4>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-mint-100 ml-8' 
                    : 'bg-gray-100 mr-8'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {message.role === 'user' ? '👤 Người dùng' : '🤖 Bot'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BiMessageSquareDetail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Không có tin nhắn nào</p>
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
    archived: 'all',
    date_from: '',
    date_to: ''
  });
  
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({});

  // Load conversations (mock implementation)
  const loadConversations = async (page = 1) => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual service
      const mockResponse = {
        success: true,
        conversations: [
          {
            id: '1',
            title: 'Tư vấn dinh dưỡng cho trẻ 3 tuổi',
            user_name: 'Nguyễn Thị A',
            age_context: 3,
            message_count: 8,
            is_archived: false,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            messages: [
              {
                role: 'user',
                content: 'Con tôi 3 tuổi nên ăn gì để phát triển tốt?',
                timestamp: new Date(Date.now() - 86400000).toISOString()
              },
              {
                role: 'bot',
                content: 'Trẻ 3 tuổi nên có chế độ ăn đa dạng bao gồm protein, rau củ, trái cây và ngũ cốc.',
                timestamp: new Date(Date.now() - 86300000).toISOString()
              }
            ]
          },
          {
            id: '2',
            title: 'Hỏi về vitamin cho trẻ em',
            user_name: 'Trần Văn B',
            age_context: 5,
            message_count: 12,
            is_archived: true,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString(),
            messages: []
          }
        ],
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          pages: 1
        }
      };

      setConversations(mockResponse.conversations);
      setPagination(mockResponse.pagination);
      
      // Mock stats
      setStats({
        total: 2,
        active: 1,
        archived: 1,
        today: 1
      });
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      showError('Có lỗi xảy ra khi tải danh sách cuộc hội thoại');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [filters]);

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
        // Mock delete - replace with actual service
        setConversations(prev => prev.filter(c => c.id !== conversation.id));
        showSuccess('Đã xóa cuộc hội thoại thành công');
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
        // Mock bulk delete
        setConversations(prev => prev.filter(c => !selectedConversations.includes(c.id)));
        setSelectedConversations([]);
        showSuccess(`Đã xóa ${selectedConversations.length} cuộc hội thoại`);
      } catch (error) {
        showError('Có lỗi xảy ra khi xóa cuộc hội thoại');
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Mock export
      const csvContent = conversations.map(conv => 
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý cuộc hội thoại</h1>
            <p className="text-gray-600">Xem và quản lý các cuộc hội thoại của người dùng</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => loadConversations(pagination.page)}
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
              <BiMessageSquareDetail className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tổng cuộc hội thoại</p>
                <p className="text-xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiMessageSquareDetail className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-xl font-bold text-gray-900">{stats.active || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiMessageSquareDetail className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Đã lưu trữ</p>
                <p className="text-xl font-bold text-gray-900">{stats.archived || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BiCalendar className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Hôm nay</p>
                <p className="text-xl font-bold text-gray-900">{stats.today || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc người dùng..."
              icon={<BiSearch />}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              value={filters.age}
              onChange={(e) => setFilters(prev => ({ ...prev, age: e.target.value }))}
            >
              <option value="">Tất cả độ tuổi</option>
              {[...Array(19)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} tuổi</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              value={filters.archived}
              onChange={(e) => setFilters(prev => ({ ...prev, archived: e.target.value }))}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="false">Đang hoạt động</option>
              <option value="true">Đã lưu trữ</option>
            </select>
          </div>
          
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              placeholder="Từ ngày"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedConversations.length > 0 && (
        <div className="bg-mint-50 border border-mint-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-mint-700 font-medium">
              Đã chọn {selectedConversations.length} cuộc hội thoại
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedConversations([])}
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

      {/* Conversations List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader type="spinner" color="mint" text="Đang tải danh sách cuộc hội thoại..." />
        </div>
      ) : filteredConversations.length > 0 ? (
        <>
          {/* Select All */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedConversations.length === filteredConversations.length && filteredConversations.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Chọn tất cả ({filteredConversations.length} cuộc hội thoại)
              </span>
            </label>
          </div>

          {/* Conversations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map(conversation => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onView={handleViewConversation}
                onDelete={handleDeleteConversation}
                isSelected={selectedConversations.includes(conversation.id)}
                onSelect={handleSelectConversation}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <BiMessageSquareDetail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có cuộc hội thoại nào</h3>
          <p className="text-gray-500">
            {filters.search || filters.age || filters.archived !== 'all'
              ? 'Không tìm thấy cuộc hội thoại phù hợp với bộ lọc'
              : 'Chưa có cuộc hội thoại nào được tạo'
            }
          </p>
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
  );
};

export default AdminConversations;