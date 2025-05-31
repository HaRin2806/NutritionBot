import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiCalendar, BiSearch, BiTrash, BiChat, BiX, BiChevronDown, BiUser } from 'react-icons/bi';
import { useApp } from '../hooks/useContext';
import { Header } from '../components/layout';
import { Button, Loader } from '../components/common';
import { formatDate, formatTime, getRelativeDate } from '../utils/dateUtils';

const HistoryPage = () => {
  const navigate = useNavigate();
  const {
    // Auth
    userData, isLoading: isLoadingAuth, requireAuth,
    
    // Chat
    conversations, isLoadingConversations, fetchConversations,
    userAge, setUserAge, filterConversations, updateFilters,
    selectConversations, selectedConversations, bulkDeleteConversations,
    
    // State
    searchTerm, filters, pagination,
    
    // Toast
    showConfirm, showSuccess,
    
    // Combined
    safeOperation
  } = useApp();

  const [localConversations, setLocalConversations] = useState([]);

  // Auth check
  useEffect(() => {
    if (!isLoadingAuth && !userData) {
      requireAuth(() => navigate('/login'));
    }
  }, [userData, isLoadingAuth, requireAuth, navigate]);

  // Load conversations
  useEffect(() => {
    if (userData && !isLoadingAuth) {
      safeOperation(() => fetchConversations(true)).then(result => {
        if (result) setLocalConversations(result);
      });
    }
  }, [userData, isLoadingAuth, fetchConversations, safeOperation]);

  // Apply filters
  const filteredConversations = filterConversations(localConversations);
  
  // Pagination
  const startIndex = (pagination.page - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const currentItems = filteredConversations.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredConversations.length / pagination.itemsPerPage);

  const handleBulkDelete = () => {
    if (selectedConversations.length === 0) return;
    
    showConfirm({
      title: `Xóa ${selectedConversations.length} cuộc trò chuyện?`,
      text: 'Hành động này không thể hoàn tác.',
      icon: 'warning'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const deleteResult = await safeOperation(() => bulkDeleteConversations(selectedConversations));
        if (deleteResult.success) {
          setLocalConversations(prev => prev.filter(c => !selectedConversations.includes(c.id)));
          showSuccess(`Đã xóa ${deleteResult.deletedCount} cuộc trò chuyện`);
        }
      }
    });
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader type="spinner" color="mint" text="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userData={userData} userAge={userAge} setUserAge={setUserAge} />
      
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500"
                  value={searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                />
                {searchTerm && (
                  <button
                    onClick={() => updateFilters({ searchTerm: '' })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <BiX className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Date filter */}
              <div className="relative">
                <BiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 appearance-none"
                  value={filters.date}
                  onChange={(e) => updateFilters({ date: e.target.value })}
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                </select>
                <BiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Age filter */}
              <div className="relative">
                <BiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 appearance-none"
                  value={filters.age}
                  onChange={(e) => updateFilters({ age: e.target.value })}
                >
                  <option value="all">Tất cả độ tuổi</option>
                  {[...Array(19)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} tuổi</option>
                  ))}
                </select>
                <BiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Bulk actions */}
            {selectedConversations.length > 0 && (
              <div className="mt-4 p-3 bg-mint-50 rounded-lg flex items-center justify-between">
                <span className="text-mint-700 font-medium">
                  Đã chọn {selectedConversations.length} cuộc trò chuyện
                </span>
                <Button onClick={handleBulkDelete} color="red" size="sm" icon={<BiTrash />}>
                  Xóa đã chọn
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          {isLoadingConversations ? (
            <div className="p-12 text-center">
              <Loader type="spinner" color="mint" text="Đang tải dữ liệu..." />
            </div>
          ) : currentItems.length > 0 ? (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={currentItems.length > 0 && currentItems.every(item => selectedConversations.includes(item.id))}
                          onChange={(e) => {
                            const allIds = e.target.checked ? currentItems.map(item => item.id) : [];
                            selectConversations(allIds);
                          }}
                          className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ tuổi</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((chat) => (
                      <tr key={chat.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedConversations.includes(chat.id)}
                            onChange={() => {
                              const newSelected = selectedConversations.includes(chat.id)
                                ? selectedConversations.filter(id => id !== chat.id)
                                : [...selectedConversations, chat.id];
                              selectConversations(newSelected);
                            }}
                            className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="text-base font-medium text-gray-900 hover:text-mint-600 cursor-pointer"
                            onClick={() => navigate(`/chat/${chat.id}`)}
                          >
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getRelativeDate(chat.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{formatTime(chat.updated_at)}</div>
                          <div className="text-xs text-gray-400">{formatDate(chat.updated_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-mint-100 text-mint-800 rounded-full">
                            {chat.age_context || 'N/A'} tuổi
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => navigate(`/chat/${chat.id}`)}
                            color="mint"
                            size="sm"
                            icon={<BiChat />}
                          >
                            Xem
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredConversations.length)} 
                    trong {filteredConversations.length} kết quả
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updatePagination({ page: i + 1 })}
                        className={`px-3 py-1 text-sm rounded ${
                          pagination.page === i + 1
                            ? 'bg-mint-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <BiChat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900">Không có cuộc trò chuyện nào</p>
              <p className="text-gray-500 mb-6">Bắt đầu trò chuyện mới với Nutribot</p>
              <Link to="/chat">
                <Button color="mint" icon={<BiChat />}>
                  Bắt đầu trò chuyện
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;