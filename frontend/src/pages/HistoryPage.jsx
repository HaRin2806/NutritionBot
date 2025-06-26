import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiCalendar, BiSearch, BiTrash, BiChat, BiX, BiChevronDown, BiUser, BiArchive, BiEdit, BiRefresh, BiArrowBack } from 'react-icons/bi';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Header } from '../components/layout';
import { Loader } from '../components/common';
import { Button, Input, Modal } from '../components/common';
import { formatDate, formatTime, getRelativeDate } from '../utils/index';
import { chatService, adminService } from '../services';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { darkMode, currentThemeConfig } = useTheme();
  const {
    userData, isLoading: isLoadingAuth, requireAuth,
    userAge, setUserAge,
    // ✅ SỬA: Chỉ lấy state, không dùng functions
    conversations, isLoadingConversations,
    deleteConversation, renameConversation,
    showConfirm, showSuccess, showError
  } = useApp();

  const [showArchived, setShowArchived] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // ✅ SỬA: Sử dụng local state để track loading
  const [localConversations, setLocalConversations] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const loadedRef = useRef(false);

  // Auth check
  useEffect(() => {
    if (!isLoadingAuth && !userData) {
      requireAuth(() => navigate('/login'));
    }
  }, [userData, isLoadingAuth, requireAuth, navigate]);

  // ✅ SỬA: Gọi trực tiếp API service thay vì qua context
  useEffect(() => {
    const loadConversations = async () => {
      if (userData && !isLoadingAuth && !loadedRef.current) {
        try {
          loadedRef.current = true;
          setLocalLoading(true);

          console.log('🔄 HistoryPage: Loading all conversations directly from API...');

          // ✅ Gọi trực tiếp chatService thay vì qua context
          const response = await chatService.getAllConversations(true);

          if (response.success) {
            setLocalConversations(response.conversations || []);
            console.log('✅ Loaded conversations:', response.conversations?.length || 0);
          } else {
            setLocalConversations([]);
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
          showError('Không thể tải lịch sử trò chuyện');
          setLocalConversations([]);
          loadedRef.current = false; // Reset on error
        } finally {
          setLocalLoading(false);
        }
      }
    };

    loadConversations();
  }, [userData, isLoadingAuth, showError]); // ✅ Không có function dependencies

  // ✅ SỬA: Dùng localConversations thay vì conversations từ context
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

  // ✅ SỬA: Helper function để reload conversations
  const reloadConversations = async () => {
    try {
      setLocalLoading(true);
      const response = await chatService.getAllConversations(true);
      if (response.success) {
        setLocalConversations(response.conversations || []);
      }
    } catch (error) {
      console.error('Error reloading conversations:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle individual conversation actions
  const handleDeleteConversation = async (conversationId) => {
    const result = await showConfirm({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Hành động này không thể hoàn tác.'
    });

    if (result.isConfirmed) {
      try {
        await deleteConversation(conversationId);
        // ✅ SỬA: Reload local conversations
        await reloadConversations();
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
      inputPlaceholder: 'Nhập tên mới cho cuộc trò chuyện...',
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      showCancelButton: true
    });

    if (result.isConfirmed && result.value) {
      try {
        await renameConversation(conversationId, result.value);
        // Update local state
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

      // ✅ SỬA: Reload conversations
      await reloadConversations();
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
          setSelectedConversations([]);
          // ✅ SỬA: Reload conversations
          await reloadConversations();
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
      <div className={`flex items-center justify-center h-screen transition-all duration-500 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg"
            style={{
              borderColor: currentThemeConfig?.primary || '#36B37E',
              borderTopColor: 'transparent'
            }}
          />
          <p className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  console.log('📊 HistoryPage render:', {
    localConversationsLength: localConversations?.length || 0,
    filteredLength: filteredConversations?.length || 0,
    localLoading,
    showArchived,
    loadedRef: loadedRef.current
  });

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
    }`}>
      {/* Header với backdrop blur */}
      <div className="relative z-10">
        <Header userData={userData} userAge={userAge} setUserAge={setUserAge} />
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Back button với glass effect */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center mb-6 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
            darkMode 
              ? 'text-gray-300 hover:bg-white/10 backdrop-blur-sm border border-white/20' 
              : 'text-gray-600 hover:bg-white/40 backdrop-blur-sm border border-white/50'
          }`}
        >
          <BiArrowBack className="mr-2" />
          Quay lại
        </button>

        {/* Main container với glassmorphism */}
        <div className={`${
          darkMode 
            ? 'bg-black/20 backdrop-blur-xl border-white/10' 
            : 'bg-white/30 backdrop-blur-xl border-white/50'
        } rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300`}>
          
          {/* Header với gradient glassmorphism */}
          <div className={`p-6 border-b transition-all duration-300 ${
            darkMode 
              ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-white/10' 
              : 'bg-gradient-to-r from-white/60 to-blue-50/60 border-white/30'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Lịch sử trò chuyện
                </h1>
                <p className={`mt-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Quản lý và tìm kiếm các cuộc trò chuyện của bạn
                </p>
              </div>

              {/* Archive toggle với glass effect */}
              <div className="flex items-center space-x-4">
                <div className={`${
                  darkMode 
                    ? 'bg-white/10 backdrop-blur-sm border-white/20' 
                    : 'bg-white/80 backdrop-blur-sm border-white/50'
                } rounded-lg p-2 shadow-lg border transition-all duration-300`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => {
                        setShowArchived(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="rounded border-gray-300 focus:ring-2 mr-3 transition-all"
                      style={{
                        accentColor: currentThemeConfig?.primary,
                        '--tw-ring-color': `${currentThemeConfig?.primary}40`
                      }}
                    />
                    <BiArchive className="mr-2" style={{ color: currentThemeConfig?.primary }} />
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {showArchived ? 'Đã lưu trữ' : 'Đang hoạt động'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Filters với glass effect */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <BiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tiêu đề..."
                    className={`w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      darkMode 
                        ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400' 
                        : 'bg-white/80 backdrop-blur-sm border-white/50 text-gray-900 placeholder-gray-500'
                    } border shadow-lg`}
                    style={{
                      '--tw-ring-color': `${currentThemeConfig?.primary}40`
                    }}
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
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <BiX />
                    </button>
                  )}
                </div>
              </div>

              {/* Date filter */}
              <div className="relative">
                <BiCalendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <select
                  className={`w-full pl-10 pr-8 py-3 rounded-lg focus:outline-none focus:ring-2 appearance-none transition-all duration-300 ${
                    darkMode 
                      ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white' 
                      : 'bg-white/80 backdrop-blur-sm border-white/50 text-gray-900'
                  } border shadow-lg`}
                  style={{
                    '--tw-ring-color': `${currentThemeConfig?.primary}40`
                  }}
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
                <BiChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>

              {/* Age filter */}
              <div className="relative">
                <BiUser className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <select
                  className={`w-full pl-10 pr-8 py-3 rounded-lg focus:outline-none focus:ring-2 appearance-none transition-all duration-300 ${
                    darkMode 
                      ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white' 
                      : 'bg-white/80 backdrop-blur-sm border-white/50 text-gray-900'
                  } border shadow-lg`}
                  style={{
                    '--tw-ring-color': `${currentThemeConfig?.primary}40`
                  }}
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
                <BiChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </div>

            {/* Bulk actions với glass effect */}
            {selectedConversations.length > 0 && (
              <div className={`mt-4 p-4 rounded-lg border flex items-center justify-between transition-all duration-300 ${
                darkMode 
                  ? 'bg-white/10 backdrop-blur-sm border-white/20' 
                  : 'bg-white/80 backdrop-blur-sm border-white/50'
              } shadow-lg`}>
                <span className="font-medium flex items-center" style={{ color: currentThemeConfig?.primary }}>
                  <BiChat className="mr-2" />
                  Đã chọn {selectedConversations.length} cuộc trò chuyện
                </span>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setSelectedConversations([])}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/50 border border-gray-500/50' 
                        : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 border border-gray-300/50'
                    }`}
                  >
                    Bỏ chọn
                  </Button>
                  <Button 
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:bg-red-600 shadow-lg"
                  >
                    <BiTrash className="mr-1" />
                    Xóa đã chọn
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stats với glass effect */}
          <div className={`px-6 py-4 border-b transition-all duration-300 ${
            darkMode 
              ? 'bg-white/5 backdrop-blur-sm border-white/10' 
              : 'bg-white/40 backdrop-blur-sm border-white/30'
          }`}>
            <div className={`flex justify-between items-center text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <span>
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredConversations.length)} trong tổng số {filteredConversations.length} cuộc trò chuyện
              </span>
              <span>
                Tổng cộng: {localConversations.length} cuộc trò chuyện
              </span>
            </div>
          </div>

          {/* Content */}
          {localLoading ? (
            <div className="p-12 text-center">
              <Loader 
                type="dots" 
                color={currentThemeConfig?.primary || '#36B37E'} 
                text="Đang tải dữ liệu..." 
              />
            </div>
          ) : currentItems.length > 0 ? (
            <>
              {/* Table với glass effect */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={`transition-all duration-300 ${
                    darkMode 
                      ? 'bg-white/5 backdrop-blur-sm' 
                      : 'bg-white/60 backdrop-blur-sm'
                  }`}>
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
                          className="rounded border-gray-300 focus:ring-2 transition-all"
                          style={{
                            accentColor: currentThemeConfig?.primary,
                            '--tw-ring-color': `${currentThemeConfig?.primary}40`
                          }}
                        />
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Cuộc trò chuyện
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Thời gian
                      </th>
                      <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Độ tuổi
                      </th>
                      <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Trạng thái
                      </th>
                      <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-all duration-300 ${
                    darkMode ? 'divide-white/10' : 'divide-gray-200/50'
                  }`}>
                    {currentItems.map((chat, index) => (
                      <tr key={chat.id} className={`transition-all duration-300 hover:scale-[1.01] ${
                        index % 2 === 0 
                          ? (darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white/60 hover:bg-white/80')
                          : (darkMode ? 'bg-white/3 hover:bg-white/8' : 'bg-white/40 hover:bg-white/60')
                      } backdrop-blur-sm`}>
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
                            className="rounded border-gray-300 focus:ring-2 transition-all"
                            style={{
                              accentColor: currentThemeConfig?.primary,
                              '--tw-ring-color': `${currentThemeConfig?.primary}40`
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="cursor-pointer group"
                            onClick={() => navigate(`/chat/${chat.id}`)}
                          >
                            <div className={`font-medium transition-all duration-300 group-hover:scale-105 ${
                              darkMode ? 'text-white group-hover:text-gray-200' : 'text-gray-900'
                            }`}
                            style={{
                              color: darkMode ? undefined : 'inherit',
                              '--hover-color': currentThemeConfig?.primary
                            }}
                            onMouseEnter={(e) => {
                              if (!darkMode) {
                                e.target.style.color = currentThemeConfig?.primary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!darkMode) {
                                e.target.style.color = 'inherit';
                              }
                            }}
                            >
                              {chat.title}
                            </div>
                            <div className={`text-xs mt-1 flex items-center transition-colors duration-300 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <BiChat className="mr-1" />
                              {chat.message_count || 0} tin nhắn • {getRelativeDate(chat.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {formatTime(chat.updated_at)}
                          </div>
                          <div className={`text-xs transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatDate(chat.updated_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-lg"
                            style={{ backgroundColor: currentThemeConfig?.primary }}
                          >
                            {chat.age_context || 'N/A'} tuổi
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {chat.is_archived ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-lg ${
                              darkMode ? 'bg-gray-600/80 text-gray-200' : 'bg-gray-100 text-gray-800'
                            }`}>
                              <BiArchive className="mr-1" />
                              Đã lưu trữ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-lg">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => navigate(`/chat/${chat.id}`)}
                              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 shadow-lg ${
                                darkMode 
                                  ? 'hover:bg-white/10 border border-white/20' 
                                  : 'hover:bg-white/80 border border-white/50'
                              } backdrop-blur-sm`}
                              style={{ color: currentThemeConfig?.primary }}
                              title="Mở cuộc trò chuyện"
                            >
                              <BiChat className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleRenameConversation(chat.id, chat.title)}
                              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 shadow-lg ${
                                darkMode 
                                  ? 'text-blue-400 hover:bg-blue-900/20 border border-blue-500/20' 
                                  : 'text-blue-600 hover:bg-blue-50/80 border border-blue-200/50'
                              } backdrop-blur-sm`}
                              title="Đổi tên"
                            >
                              <BiEdit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleArchiveConversation(chat.id, chat.is_archived)}
                              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 shadow-lg ${
                                darkMode 
                                  ? 'text-yellow-400 hover:bg-yellow-900/20 border border-yellow-500/20' 
                                  : 'text-yellow-600 hover:bg-yellow-50/80 border border-yellow-200/50'
                              } backdrop-blur-sm`}
                              title={chat.is_archived ? 'Hủy lưu trữ' : 'Lưu trữ'}
                            >
                              {chat.is_archived ? <BiRefresh className="w-4 h-4" /> : <BiArchive className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDeleteConversation(chat.id)}
                              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 shadow-lg ${
                                darkMode 
                                  ? 'text-red-400 hover:bg-red-900/20 border border-red-500/20' 
                                  : 'text-red-600 hover:bg-red-50/80 border border-red-200/50'
                              } backdrop-blur-sm`}
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

              {/* Pagination với glass effect */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 border-t transition-all duration-300 ${
                  darkMode 
                    ? 'border-white/10 bg-white/5 backdrop-blur-sm' 
                    : 'border-white/30 bg-white/40 backdrop-blur-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Trang {currentPage} / {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                          darkMode 
                            ? 'border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-sm' 
                            : 'border border-white/50 bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
                        } shadow-lg`}
                      >
                        Trước
                      </button>

                      {/* Page numbers với glass effect */}
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
                              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 hover:scale-105 shadow-lg ${
                                currentPage === pageNumber
                                  ? 'text-white'
                                  : darkMode 
                                    ? 'border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-sm'
                                    : 'border border-white/50 bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
                              }`}
                              style={{
                                backgroundColor: currentPage === pageNumber ? currentThemeConfig?.primary : undefined
                              }}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                          darkMode 
                            ? 'border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-sm' 
                            : 'border border-white/50 bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
                        } shadow-lg`}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty state với glass effect
            <div className="py-16 text-center">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${
                darkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
              }`}>
                {showArchived ? (
                  <BiArchive className={`w-12 h-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <BiChat className={`w-12 h-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </div>

              <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {showArchived
                  ? 'Không có cuộc trò chuyện đã lưu trữ'
                  : searchTerm || dateFilter !== 'all' || ageFilter !== 'all'
                    ? 'Không tìm thấy kết quả phù hợp'
                    : 'Chưa có cuộc trò chuyện nào'
                }
              </h3>

              <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
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
                    className={`px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg ${
                      darkMode 
                        ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/50 border border-gray-500/50 backdrop-blur-sm' 
                        : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 border border-gray-300/50 backdrop-blur-sm'
                    }`}
                  >
                    <BiX className="mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}

                {!showArchived && (
                  <Link to="/chat">
                    <Button 
                      className="px-4 py-2 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                      style={{ backgroundColor: currentThemeConfig?.primary }}
                    >
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