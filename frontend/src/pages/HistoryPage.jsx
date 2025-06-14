import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiCalendar, BiSearch, BiTrash, BiChat, BiX, BiChevronDown, BiUser, BiArchive, BiEdit, BiRefresh } from 'react-icons/bi';
import { useApp } from '../contexts/AppContext';
import { Header } from '../components/layout';
import { Loader } from '../components/common';  
import { Button, Input, Modal } from '../components/base/index.jsx';
import { formatDate, formatTime, getRelativeDate } from '../utils/index';
import { chatService, adminService } from '../services';

const HistoryPage = () => {
  const navigate = useNavigate();
  const {
    userData, isLoading: isLoadingAuth, requireAuth,
    userAge, setUserAge,
    showConfirm, showSuccess, showError
  } = useApp();

  const [localConversations, setLocalConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Auth check
  useEffect(() => {
    if (!isLoadingAuth && !userData) {
      requireAuth(() => navigate('/login'));
    }
  }, [userData, isLoadingAuth, requireAuth, navigate]);

  // Load ALL conversations
  useEffect(() => {
    const loadAllConversations = async () => {
      if (userData && !isLoadingAuth) {
        try {
          setIsLoading(true);
          const result = await chatService.getAllConversations(true); // Load cả archived
          if (result.success) {
            setLocalConversations(result.conversations);
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
          showError('Không thể tải lịch sử trò chuyện');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAllConversations();
  }, [userData, isLoadingAuth]);

  // Filter conversations
  const filteredConversations = localConversations.filter(conv => {
    // Filter by archive status
    if (!showArchived && conv.is_archived) return false;
    if (showArchived && !conv.is_archived) return false;

    // Filter by search term
    if (searchTerm && !conv.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const convDate = new Date(conv.updated_at);
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          if (convDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (convDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (convDate < monthAgo) return false;
          break;
      }
    }

    // Filter by age
    if (ageFilter !== 'all' && conv.age_context !== parseInt(ageFilter)) {
      return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredConversations.slice(startIndex, endIndex);

  // Handle individual conversation actions
  const handleDeleteConversation = async (conversationId) => {
    const result = await showConfirm({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Hành động này không thể hoàn tác.'
    });

    if (result.isConfirmed) {
      try {
        await chatService.deleteConversation(conversationId);
        setLocalConversations(prev => prev.filter(c => c.id !== conversationId));
        showSuccess('Đã xóa cuộc trò chuyện');
      } catch (error) {
        console.error('Error deleting conversation:', error);
        showError('Không thể xóa cuộc trò chuyện');
      }
    }
  };

  const handleRenameConversation = async (conversationId, currentTitle) => {
    const result = await showConfirm({
      title: 'Đổi tên cuộc trò chuyện',
      input: 'text',
      inputValue: currentTitle,
      showCancelButton: true
    });

    if (result.isConfirmed && result.value) {
      try {
        await chatService.updateConversation(conversationId, { title: result.value });
        setLocalConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? { ...conv, title: result.value }
              : conv
          )
        );
        showSuccess('Đã đổi tên cuộc trò chuyện');
      } catch (error) {
        console.error('Error renaming conversation:', error);
        showError('Không thể đổi tên cuộc trò chuyện');
      }
    }
  };

  const handleArchiveConversation = async (conversationId, isCurrentlyArchived) => {
    try {
      if (isCurrentlyArchived) {
        await chatService.unarchiveConversation(conversationId);
        showSuccess('Đã hủy lưu trữ cuộc trò chuyện');
      } else {
        await chatService.archiveConversation(conversationId);
        showSuccess('Đã lưu trữ cuộc trò chuyện');
      }

      setLocalConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_archived: !isCurrentlyArchived }
            : conv
        )
      );
    } catch (error) {
      console.error('Error archiving conversation:', error);
      showError('Không thể thực hiện thao tác này');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedConversations.length === 0) return;

    const result = await showConfirm({
      title: `Xóa ${selectedConversations.length} cuộc trò chuyện?`,
      text: 'Hành động này không thể hoàn tác.'
    });

    if (result.isConfirmed) {
      try {
        const deleteResult = await chatService.bulkDeleteConversations(selectedConversations);
        if (deleteResult.success) {
          setLocalConversations(prev => prev.filter(c => !selectedConversations.includes(c.id)));
          setSelectedConversations([]);
          showSuccess(`Đã xóa ${deleteResult.deleted_count} cuộc trò chuyện`);
        }
      } catch (error) {
        console.error('Error bulk deleting:', error);
        showError('Không thể xóa các cuộc trò chuyện đã chọn');
      }
    }
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header với thiết kế đẹp hơn */}
          <div className="bg-gradient-to-r from-mint-50 to-mint-100 p-6 border-b border-mint-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lịch sử trò chuyện</h1>
                <p className="text-gray-600 mt-1">Quản lý và tìm kiếm các cuộc trò chuyện của bạn</p>
              </div>

              {/* Archive toggle với thiết kế đẹp */}
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-lg p-2 shadow-sm border">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => {
                        setShowArchived(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="rounded border-gray-300 text-mint-600 focus:ring-mint-500 mr-3"
                    />
                    <BiArchive className="mr-2 text-mint-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {showArchived ? 'Đã lưu trữ' : 'Đang hoạt động'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Filters với thiết kế card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tiêu đề..."
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <BiX />
                    </button>
                  )}
                </div>
              </div>

              {/* Date filter */}
              <div className="relative">
                <BiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 bg-white shadow-sm appearance-none"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 bg-white shadow-sm appearance-none"
                  value={ageFilter}
                  onChange={(e) => {
                    setAgeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
              <div className="mt-4 p-4 bg-white rounded-lg border border-mint-200 flex items-center justify-between">
                <span className="text-mint-700 font-medium flex items-center">
                  <BiChat className="mr-2" />
                  Đã chọn {selectedConversations.length} cuộc trò chuyện
                </span>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setSelectedConversations([])}
                    color="gray"
                    size="sm"
                    outline
                  >
                    Bỏ chọn
                  </Button>
                  <Button onClick={handleBulkDelete} color="red" size="sm">
                    <BiTrash className="mr-1" />
                    Xóa đã chọn
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredConversations.length)} trong tổng số {filteredConversations.length} cuộc trò chuyện
              </span>
              <span>
                Tổng cộng: {localConversations.length} cuộc trò chuyện
              </span>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader type="spinner" color="mint" text="Đang tải dữ liệu..." />
            </div>
          ) : currentItems.length > 0 ? (
            <>
              {/* Table với thiết kế đẹp hơn */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={currentItems.length > 0 && currentItems.every(item => selectedConversations.includes(item.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedConversations([...selectedConversations, ...currentItems.map(item => item.id)]);
                            } else {
                              setSelectedConversations(selectedConversations.filter(id => !currentItems.map(item => item.id).includes(id)));
                            }
                          }}
                          className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cuộc trò chuyện</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Độ tuổi</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((chat, index) => (
                      <tr key={chat.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedConversations.includes(chat.id)}
                            onChange={() => {
                              if (selectedConversations.includes(chat.id)) {
                                setSelectedConversations(selectedConversations.filter(id => id !== chat.id));
                              } else {
                                setSelectedConversations([...selectedConversations, chat.id]);
                              }
                            }}
                            className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="cursor-pointer group"
                            onClick={() => navigate(`/chat/${chat.id}`)}
                          >
                            <div className="font-medium text-gray-900 group-hover:text-mint-600 transition-colors">
                              {chat.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <BiChat className="mr-1" />
                              {chat.message_count || 0} tin nhắn • {getRelativeDate(chat.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatTime(chat.updated_at)}</div>
                          <div className="text-xs text-gray-500">{formatDate(chat.updated_at)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint-100 text-mint-800">
                            {chat.age_context || 'N/A'} tuổi
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {chat.is_archived ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <BiArchive className="mr-1" />
                              Đã lưu trữ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => navigate(`/chat/${chat.id}`)}
                              className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-lg transition-colors"
                              title="Mở cuộc trò chuyện"
                            >
                              <BiChat className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleRenameConversation(chat.id, chat.title)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Đổi tên"
                            >
                              <BiEdit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleArchiveConversation(chat.id, chat.is_archived)}
                              className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                              title={chat.is_archived ? 'Hủy lưu trữ' : 'Lưu trữ'}
                            >
                              {chat.is_archived ? <BiRefresh className="w-4 h-4" /> : <BiArchive className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDeleteConversation(chat.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

              {/* Pagination đẹp hơn */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>

                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-3 py-2 text-sm rounded-lg transition-colors ${currentPage === pageNumber
                                  ? 'bg-mint-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty state đẹp hơn
            <div className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                {showArchived ? (
                  <BiArchive className="w-12 h-12 text-gray-400" />
                ) : (
                  <BiChat className="w-12 h-12 text-gray-400" />
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived
                  ? 'Không có cuộc trò chuyện đã lưu trữ'
                  : searchTerm || dateFilter !== 'all' || ageFilter !== 'all'
                    ? 'Không tìm thấy kết quả phù hợp'
                    : 'Chưa có cuộc trò chuyện nào'
                }
              </h3>

              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {showArchived
                  ? 'Bạn chưa lưu trữ cuộc trò chuyện nào. Hãy lưu trữ các cuộc trò chuyện quan trọng để dễ dàng quản lý.'
                  : searchTerm || dateFilter !== 'all' || ageFilter !== 'all'
                    ? 'Thử thay đổi bộ lọc tìm kiếm hoặc tạo cuộc trò chuyện mới.'
                    : 'Bắt đầu cuộc trò chuyện đầu tiên với Nutribot để khám phá thông tin dinh dưỡng.'
                }
              </p>

              <div className="flex justify-center space-x-3">
                {(searchTerm || dateFilter !== 'all' || ageFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter('all');
                      setAgeFilter('all');
                      setCurrentPage(1);
                    }}
                    color="gray"
                    outline
                  >
                    <BiX className="mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}

                {!showArchived && (
                  <Link to="/chat">
                    <Button color="mint">
                      <BiChat className="mr-1" />
                      Bắt đầu trò chuyện
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;