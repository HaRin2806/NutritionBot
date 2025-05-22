import React, { useState, useEffect } from 'react';
import { BiCalendar, BiSearch, BiTrash, BiMessageRounded, BiTime, BiChevronDown, BiChevronLeft, BiChevronRight, BiSortAlt2, BiUser, BiArrowBack, BiChat, BiX, BiArchiveIn, BiBookmark, BiDotsHorizontalRounded, BiCheck } from 'react-icons/bi';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import useConversation from '../hooks/useConversation';
import useToast from '../hooks/useToast';
import { Header } from '../components/layout';
import { Button, Loader } from '../components/common';
import { formatDate, formatTime, getRelativeDate } from '../utils/dateUtils';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    conversations,
    isLoadingConversations,
    fetchConversations,
    userAge,
    setUserAge,
    updateUserAge,
    deleteConversation,
    bulkDeleteConversations,
    archiveConversation,
    unarchiveConversation,
    renameConversation
  } = useChat();

  const {
    selectedConversations,
    searchTerm,
    dateFilter,
    ageFilter,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
    activeTab,
    setSelectedConversations,
    setSearchTerm,
    setDateFilter,
    setAgeFilter,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setActiveTab,
    filterConversations,
    getPaginationData,
    getAgeOptions,
    handleSelectAll,
    handleSelect,
    handleSortChange,
    clearFilters,
    handleDeleteMultiple,
    handleArchiveMultiple,
    handleUnarchiveMultiple,
    navigateToChat,
    getConversationCounts
  } = useConversation();

  const { showDeleteConfirm, showBulkDeleteConfirm } = useToast();

  // Kiểm tra đăng nhập khi vào trang
  useEffect(() => {
    if (!userData) {
      navigate('/login');
      return;
    }

    // Lấy danh sách cuộc hội thoại
    fetchConversations(true);
  }, [userData, navigate, fetchConversations]);

  // Lấy danh sách lọc theo activeTab
  const filteredConversations = filterConversations(conversations);

  // Tính toán phân trang
  const {
    currentItems,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem
  } = getPaginationData(filteredConversations);

  // Lấy các options tuổi từ cuộc hội thoại
  const ageOptions = getAgeOptions(conversations);

  // Lấy các counts
  const { archivedCount, activeCount } = getConversationCounts(conversations);

  // Xử lý chọn/bỏ chọn tất cả trên trang hiện tại
  const handleSelectAllOnPage = (e) => {
    handleSelectAll(e, currentItems);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-50/30 to-gray-50">
      {/* Header */}
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
        updateConversationAge={updateUserAge}
        extraButton={<BiArrowBack className="text-xl mr-2" />}
      />

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-md rounded-lg transition-all duration-300 hover:shadow-lg">
          {/* Tabs */}
          <div className="px-4 pt-4 sm:p-6 sm:pb-0 flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`mr-4 pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'all'
                ? 'border-mint-500 text-mint-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{ borderColor: activeTab === 'all' ? '#36B37E' : 'transparent', color: activeTab === 'all' ? '#36B37E' : '' }}
            >
              Tất cả ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`mr-4 pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'archived'
                ? 'border-mint-500 text-mint-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{ borderColor: activeTab === 'archived' ? '#36B37E' : 'transparent', color: activeTab === 'archived' ? '#36B37E' : '' }}
            >
              Đã lưu trữ ({archivedCount})
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="focus:ring-mint-500 focus:border-mint-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ boxShadow: searchTerm ? '0 0 0 3px rgba(54, 179, 126, 0.1)' : 'none' }}
                  />
                  {searchTerm && (
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setSearchTerm('')}
                    >
                      <BiX className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lọc theo ngày */}
              <div className="w-full sm:w-48">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="focus:ring-mint-500 focus:border-mint-500 block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md appearance-none transition-all duration-200"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{ boxShadow: dateFilter !== 'all' ? '0 0 0 3px rgba(54, 179, 126, 0.1)' : 'none' }}
                  >
                    <option value="all">Tất cả thời gian</option>
                    <option value="today">Hôm nay</option>
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <BiChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              {/* Lọc theo tuổi */}
              <div className="w-full sm:w-48">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="focus:ring-mint-500 focus:border-mint-500 block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md appearance-none transition-all duration-200"
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    style={{ boxShadow: ageFilter !== 'all' ? '0 0 0 3px rgba(54, 179, 126, 0.1)' : 'none' }}
                  >
                    <option value="all">Tất cả độ tuổi</option>
                    {ageOptions.map(age => (
                      <option key={age} value={age}>{age} tuổi</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <BiChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Thanh công cụ - Chọn tất cả và Xóa */}
            {selectedConversations.length > 0 && (
              <div className="mt-4 p-3 bg-mint-50 rounded-lg flex items-center justify-between animate-fadeIn" style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)' }}>
                <div className="flex items-center">
                  <span className="text-mint-700 font-medium">Đã chọn {selectedConversations.length} cuộc trò chuyện</span>
                </div>
                <div className="flex space-x-2">
                  {activeTab === 'all' ? (
                    <Button
                      onClick={handleArchiveMultiple}
                      color="mint"
                      size="sm"
                      icon={<BiArchiveIn className="mr-1.5" />}
                    >
                      Lưu trữ đã chọn
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUnarchiveMultiple}
                      color="mint"
                      size="sm"
                      icon={<BiCheck className="mr-1.5" />}
                    >
                      Khôi phục đã chọn
                    </Button>
                  )}
                  <Button
                    onClick={() => showBulkDeleteConfirm(selectedConversations.length, handleDeleteMultiple)}
                    color="red"
                    size="sm"
                    icon={<BiTrash className="mr-1.5" />}
                  >
                    Xóa đã chọn
                  </Button>
                </div>
              </div>
            )}

            {/* Hiển thị bộ lọc đang hoạt động */}
            {(searchTerm || dateFilter !== 'all' || ageFilter !== 'all') && (
              <div className="mt-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs flex items-center">
                    <span>Tìm kiếm: {searchTerm}</span>
                    <button onClick={() => setSearchTerm('')} className="ml-1 text-gray-500 hover:text-gray-700">
                      <BiX className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {dateFilter !== 'all' && (
                  <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs flex items-center">
                    <span>
                      Thời gian: {
                        dateFilter === 'today' ? 'Hôm nay' :
                          dateFilter === 'week' ? 'Tuần này' :
                            dateFilter === 'month' ? 'Tháng này' :
                              dateFilter
                      }
                    </span>
                    <button onClick={() => setDateFilter('all')} className="ml-1 text-gray-500 hover:text-gray-700">
                      <BiX className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {ageFilter !== 'all' && (
                  <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs flex items-center">
                    <span>Độ tuổi: {ageFilter} tuổi</span>
                    <button onClick={() => setAgeFilter('all')} className="ml-1 text-gray-500 hover:text-gray-700">
                      <BiX className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={clearFilters}
                  className="text-mint-600 text-xs hover:underline flex items-center"
                  style={{ color: '#36B37E' }}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader type="spinner" size="lg" color="mint" text="Đang tải dữ liệu..." />
            </div>
          ) : currentItems.length > 0 ? (
            <>
              {/* History list */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="sticky top-0 px-3 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-mint-600 focus:ring-mint-500 border-gray-300 rounded transition-all duration-200"
                          checked={currentItems.length > 0 && currentItems.every(item => selectedConversations.includes(item.id))}
                          onChange={handleSelectAllOnPage}
                        />
                      </th>
                      <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiêu đề
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSortChange('date')}
                      >
                        <div className="flex items-center">
                          <span>Thời gian</span>
                          {sortBy === 'date' && (
                            <BiSortAlt2 className={`ml-1 transition-transform duration-200 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSortChange('age')}
                      >
                        <div className="flex items-center">
                          <span>Độ tuổi</span>
                          {sortBy === 'age' && (
                            <BiSortAlt2 className={`ml-1 transition-transform duration-200 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                          )}
                        </div>
                      </th>
                      <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tin nhắn
                      </th>
                      <th scope="col" className="sticky top-0 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((chat) => (
                      <tr
                        key={chat.id}
                        className="group hover:bg-mint-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-mint-600 focus:ring-mint-500 border-gray-300 rounded"
                            checked={selectedConversations.includes(chat.id)}
                            onChange={() => handleSelect(chat.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="text-base font-medium text-gray-900 hover:text-mint-600 cursor-pointer transition-all duration-150 group-hover:scale-[1.01]"
                            onClick={() => navigateToChat(chat.id)}
                          >
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <BiCalendar className="inline-block mr-1 text-gray-400" />
                            {getRelativeDate(chat.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <BiTime className="mr-1.5 text-mint-500" />
                            {formatTime(chat.updated_at)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(chat.updated_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-mint-100 text-mint-800"
                            style={{ backgroundColor: 'rgba(54, 179, 126, 0.2)', color: '#2E7D6B' }}>
                            {chat.age_context || 'N/A'} tuổi
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <BiMessageRounded className="mr-1.5 text-mint-500" />
                            <span className="font-medium">{chat.message_count || 0}</span>
                            <span className="text-xs text-gray-500 ml-1">tin nhắn</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1">
                            <Button
                              onClick={() => navigateToChat(chat.id)}
                              color="mint"
                              size="sm"
                              icon={<BiChat className="mr-1.5" />}
                            >
                              Xem
                            </Button>
                            {chat.is_archived ? (
                              <Button
                                onClick={() => unarchiveConversation(chat.id)}
                                color="gray"
                                size="sm"
                                icon={<BiCheck />}
                                className="px-2"
                              />
                            ) : (
                              <Button
                                onClick={() => archiveConversation(chat.id)}
                                color="gray"
                                size="sm"
                                icon={<BiArchiveIn />}
                                className="px-2"
                              />
                            )}
                            <Button
                              onClick={() => showDeleteConfirm(() => deleteConversation(chat.id))}
                              color="red"
                              size="sm"
                              icon={<BiTrash />}
                              className="px-2"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredConversations.length)}</span> trong <span className="font-medium">{filteredConversations.length}</span> kết quả
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px overflow-hidden" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 first:rounded-l-lg"
                          >
                            <span className="sr-only">Trang trước</span>
                            <BiChevronLeft className="h-5 w-5" />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200
                                ${currentPage === i + 1
                                  ? 'z-10 bg-mint-50 border-mint-500 text-mint-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              style={currentPage === i + 1 ? {
                                backgroundColor: '#E6F7EF',
                                borderColor: '#36B37E',
                                color: '#36B37E',
                                fontWeight: 'bold'
                              } : {}}
                            >
                              {i + 1}
                            </button>
                          ))}

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 last:rounded-r-lg"
                          >
                            <span className="sr-only">Trang sau</span>
                            <BiChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No results
            <div className="py-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-mint-100 rounded-full flex items-center justify-center mb-4">
                  {activeTab === 'archived' ? (
                    <BiBookmark className="h-12 w-12 text-mint-500" />
                  ) : (
                    <BiMessageRounded className="h-12 w-12 text-mint-500" />
                  )}
                </div>
                {searchTerm || dateFilter !== 'all' || ageFilter !== 'all' ? (
                  <>
                    <p className="text-xl font-medium text-gray-700 mb-2">Không tìm thấy cuộc trò chuyện nào phù hợp</p>
                    <p className="text-gray-500 mb-6 max-w-md">Thử thay đổi các bộ lọc hoặc sử dụng từ khóa tìm kiếm khác</p>
                    <Button
                      onClick={clearFilters}
                      color="mint"
                      icon={<BiX className="mr-1.5" />}
                    >
                      Xóa bộ lọc
                    </Button>
                  </>
                ) : (
                  <>
                    {activeTab === 'archived' ? (
                      <>
                        <p className="text-xl font-medium text-gray-700 mb-2">Không có cuộc trò chuyện nào được lưu trữ</p>
                        <p className="text-gray-500 mb-6 max-w-md">Bạn có thể lưu trữ các cuộc trò chuyện để tham khảo sau</p>
                        <Button
                          onClick={() => setActiveTab('all')}
                          color="mint"
                          icon={<BiMessageRounded className="mr-1.5" />}
                        >
                          Xem tất cả cuộc trò chuyện
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-medium text-gray-700 mb-2">Chưa có cuộc trò chuyện nào</p>
                        <p className="text-gray-500 mb-6 max-w-md">Bắt đầu trò chuyện mới với Nutribot để nhận thông tin hữu ích về dinh dưỡng</p>
                        <Link to="/chat">
                          <Button
                            color="mint"
                            icon={<BiChat className="mr-1.5" />}
                          >
                            Bắt đầu trò chuyện
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Back to Chat button on mobile */}
      <div className="sm:hidden fixed bottom-6 right-6">
        <Link
          to="/chat"
          className="p-4 rounded-full bg-mint-600 text-white shadow-lg hover:bg-mint-700 transition-all duration-200 flex items-center justify-center"
          style={{ backgroundColor: '#36B37E' }}
        >
          <BiChat className="text-xl" />
        </Link>
      </div>

      {/* CSS để thêm animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
        
        /* Hover effect for buttons */
        button:hover {
          transform: translateY(-1px);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c5e0d5;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #36B37E;
        }
      `}</style>
    </div>
  );
};

export default HistoryPage;