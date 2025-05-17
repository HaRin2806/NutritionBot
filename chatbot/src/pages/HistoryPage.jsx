import React, { useState, useEffect, useRef } from 'react';
import { BiCalendar, BiSearch, BiTrash, BiMessageRounded, BiTime, BiChevronDown, BiChevronLeft, BiChevronRight, BiSortAlt2, BiUser, BiArrowBack, BiChat, BiX, BiArchiveIn, BiBookmark, BiDotsHorizontalRounded, BiCheck } from 'react-icons/bi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';

const API_BASE_URL = 'http://localhost:5000/api';

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' hoặc 'age'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' hoặc 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'archived'
  const [userAge, setUserAge] = useState(null);
  const navigate = useNavigate();

  // Lấy dữ liệu cuộc trò chuyện từ API
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (user && user.id) {
      setUserData(user);
      fetchConversationHistory(user.id);
    } else {
      Swal.fire({
        title: 'Bạn chưa đăng nhập',
        text: 'Bạn cần đăng nhập để xem lịch sử trò chuyện',
        icon: 'warning',
        confirmButtonText: 'Đăng nhập ngay',
        confirmButtonColor: '#36B37E',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    }
  }, [navigate]);

  const fetchConversationHistory = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        params: {
          include_archived: true,
          per_page: 1000 // Đặt giá trị đủ lớn để lấy tất cả cuộc trò chuyện
        },
        withCredentials: true
      });

      if (response.data.success) {
        // Thêm các thuộc tính cần thiết vào mỗi cuộc trò chuyện
        const enhancedHistory = response.data.conversations.map(conversation => {
          // Tạo danh sách tin nhắn giả nếu API không trả về tin nhắn
          const messageCount = conversation.message_count ||
            (conversation.messages ? conversation.messages.length :
              Math.floor(Math.random() * 15) + 5); // Random từ 5-20 tin nhắn

          // Lấy age_context cho userAge nếu chưa có
          if (!userAge && conversation.age_context) {
            setUserAge(conversation.age_context);
          }

          return {
            ...conversation,
            messageCount,
            startTime: conversation.created_at,
            endTime: conversation.updated_at,
          };
        });

        setHistory(enhancedHistory);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử trò chuyện:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể lấy lịch sử trò chuyện',
        confirmButtonColor: '#36B37E'
      });
    } finally {
      setLoading(false);
    }
  };

  // Lọc và sắp xếp dữ liệu lịch sử
  const filteredAndSortedHistory = React.useMemo(() => {
    // Bước 1: Lọc theo tab active (tất cả hoặc lưu trữ)
    let filteredData = history.filter((chat) => {
      if (activeTab === 'all') return !chat.is_archived;
      if (activeTab === 'archived') return chat.is_archived;
      return true;
    });

    // Bước 2: Lọc theo tìm kiếm
    if (searchTerm) {
      filteredData = filteredData.filter((chat) => {
        return chat.title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Bước 3: Lọc theo ngày
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filteredData = filteredData.filter(chat => new Date(chat.updated_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filteredData = filteredData.filter(chat => new Date(chat.updated_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filteredData = filteredData.filter(chat => new Date(chat.updated_at) >= filterDate);
          break;
        default:
          break;
      }
    }

    // Bước 4: Lọc theo tuổi nếu không phải 'all'
    if (ageFilter !== 'all') {
      const ageValue = parseInt(ageFilter, 10);
      if (!isNaN(ageValue)) {
        filteredData = filteredData.filter(chat => chat.age_context === ageValue);
      }
    }

    // Bước 5: Sắp xếp
    const sortedData = [...filteredData].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'age') {
        const ageA = a.age_context || 0;
        const ageB = b.age_context || 0;
        return sortOrder === 'asc' ? ageA - ageB : ageB - ageA;
      }
      return 0;
    });

    return sortedData;
  }, [history, searchTerm, dateFilter, ageFilter, sortBy, sortOrder, activeTab]);

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lấy ngày tương đối
  const getRelativeDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `Hôm nay, ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} tuần trước`;
    } else {
      return formatDate(dateString);
    }
  };

  // Xử lý xóa cuộc trò chuyện
  const handleDelete = (id) => {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`${API_BASE_URL}/conversations/${id}`, {
            withCredentials: true
          });

          if (response.data.success) {
            setHistory(history.filter(chat => chat.id !== id));
            Swal.fire({
              icon: 'success',
              title: 'Đã xóa',
              text: 'Cuộc trò chuyện đã được xóa thành công',
              confirmButtonColor: '#36B37E',
              timer: 1500,
              showConfirmButton: false
            });
          }
        } catch (error) {
          console.error("Lỗi khi xóa cuộc trò chuyện:", error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể xóa cuộc trò chuyện',
            confirmButtonColor: '#36B37E'
          });
        }
      }
    });
  };

  // Xử lý xóa nhiều cuộc trò chuyện
  const handleDeleteMultiple = () => {
    if (selectedConversations.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Chưa chọn cuộc trò chuyện',
        text: 'Vui lòng chọn ít nhất một cuộc trò chuyện để xóa',
        confirmButtonColor: '#36B37E'
      });
      return;
    }

    Swal.fire({
      title: `Xác nhận xóa ${selectedConversations.length} cuộc trò chuyện`,
      text: 'Bạn có chắc chắn muốn xóa các cuộc trò chuyện đã chọn?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(`${API_BASE_URL}/conversations/bulk-delete`, {
            conversation_ids: selectedConversations
          }, {
            withCredentials: true
          });

          if (response.data.success) {
            setHistory(history.filter(chat => !selectedConversations.includes(chat.id)));
            setSelectedConversations([]);

            Swal.fire({
              icon: 'success',
              title: 'Đã xóa',
              text: `Đã xóa ${response.data.deleted_count} cuộc trò chuyện thành công`,
              confirmButtonColor: '#36B37E',
              timer: 1500,
              showConfirmButton: false
            });
          }
        } catch (error) {
          console.error("Lỗi khi xóa nhiều cuộc trò chuyện:", error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể xóa các cuộc trò chuyện',
            confirmButtonColor: '#36B37E'
          });
        }
      }
    });
  };

  // Xử lý lưu trữ cuộc trò chuyện
  const handleArchive = async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/conversations/${id}/archive`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        // Cập nhật trạng thái lưu trữ trong danh sách
        setHistory(history.map(chat =>
          chat.id === id ? { ...chat, is_archived: true } : chat
        ));

        Swal.fire({
          icon: 'success',
          title: 'Đã lưu trữ',
          text: 'Cuộc trò chuyện đã được lưu trữ',
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Lỗi khi lưu trữ cuộc trò chuyện:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể lưu trữ cuộc trò chuyện',
        confirmButtonColor: '#36B37E'
      });
    }
  };

  // Xử lý hủy lưu trữ cuộc trò chuyện
  const handleUnarchive = async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/conversations/${id}/unarchive`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        // Cập nhật trạng thái lưu trữ trong danh sách
        setHistory(history.map(chat =>
          chat.id === id ? { ...chat, is_archived: false } : chat
        ));

        Swal.fire({
          icon: 'success',
          title: 'Đã hủy lưu trữ',
          text: 'Cuộc trò chuyện đã được khôi phục',
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Lỗi khi hủy lưu trữ cuộc trò chuyện:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể hủy lưu trữ cuộc trò chuyện',
        confirmButtonColor: '#36B37E'
      });
    }
  };

  // Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentItems.map(item => item.id);
      setSelectedConversations(allIds);
    } else {
      setSelectedConversations([]);
    }
  };

  // Xử lý chọn/bỏ chọn một cuộc trò chuyện
  const handleSelect = (id) => {
    if (selectedConversations.includes(id)) {
      setSelectedConversations(selectedConversations.filter(chatId => chatId !== id));
    } else {
      setSelectedConversations([...selectedConversations, id]);
    }
  };

  // Xử lý thay đổi sắp xếp
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Nếu đang sắp xếp theo cùng một cột, đảo ngược thứ tự
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nếu chuyển sang cột khác, đặt lại thứ tự là desc (mới nhất trước)
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Gọi API đăng xuất
          await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            withCredentials: true
          });

          // Xóa thông tin người dùng
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('access_token');

          // Xóa config header
          delete axios.defaults.headers.common['Authorization'];

          // Chuyển hướng về trang đăng nhập
          navigate('/login');
        } catch (error) {
          console.error("Lỗi khi đăng xuất:", error);
          // Vẫn xóa dữ liệu người dùng và chuyển hướng
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('access_token');
          navigate('/login');
        }
      }
    });
  };

  // Chuyển đến chat với conversation ID cụ thể
  const navigateToChat = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  // Tạo danh sách lọc theo tuổi từ các cuộc hội thoại hiện có
  const ageOptions = React.useMemo(() => {
    const ages = [...new Set(history.map(chat => chat.age_context).filter(Boolean))];
    return ages.sort((a, b) => a - b);
  }, [history]);

  // Đếm số lượng cuộc trò chuyện đã lưu trữ
  const archivedCount = React.useMemo(() => {
    return history.filter(chat => chat.is_archived).length;
  }, [history]);

  // Đếm số lượng cuộc trò chuyện chưa lưu trữ
  const activeCount = React.useMemo(() => {
    return history.filter(chat => !chat.is_archived).length;
  }, [history]);

  // Hàm cập nhật độ tuổi - chỉ là placeholder, sẽ không được sử dụng trong HistoryPage
  const updateConversationAge = () => { };

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-50/30 to-gray-50">
      {/* Header */}
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
        handleLogout={handleLogout}
        activeConversation={null}
        updateConversationAge={updateConversationAge}
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
              style={{ borderColor: activeTab === 'all' ? '#36B37E' : 'transparent' }}
            >
              Tất cả ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`mr-4 pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'archived'
                ? 'border-mint-500 text-mint-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{ borderColor: activeTab === 'archived' ? '#36B37E' : 'transparent' }}
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
                    <button
                      onClick={() => {
                        // Archive all selected conversations
                        const promises = selectedConversations.map(id =>
                          axios.post(`${API_BASE_URL}/conversations/${id}/archive`, {
                            user_id: userData.id
                          })
                        );

                        Promise.all(promises)
                          .then(() => {
                            setHistory(history.map(chat =>
                              selectedConversations.includes(chat.id)
                                ? { ...chat, is_archived: true }
                                : chat
                            ));
                            setSelectedConversations([]);

                            Swal.fire({
                              icon: 'success',
                              title: 'Đã lưu trữ',
                              text: `Đã lưu trữ ${selectedConversations.length} cuộc trò chuyện`,
                              confirmButtonColor: '#36B37E',
                              timer: 1500,
                              showConfirmButton: false
                            });
                          })
                          .catch(error => {
                            console.error("Lỗi khi lưu trữ nhiều cuộc trò chuyện:", error);
                          });
                      }}
                      className="bg-mint-600 text-white px-4 py-1.5 rounded-md hover:bg-mint-700 flex items-center text-sm shadow-sm hover:shadow transition-all duration-200"
                    >
                      <BiArchiveIn className="mr-1.5" />
                      Lưu trữ đã chọn
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Unarchive all selected conversations
                        const promises = selectedConversations.map(id =>
                          axios.post(`${API_BASE_URL}/conversations/${id}/unarchive`, {
                            user_id: userData.id
                          })
                        );

                        Promise.all(promises)
                          .then(() => {
                            setHistory(history.map(chat =>
                              selectedConversations.includes(chat.id)
                                ? { ...chat, is_archived: false }
                                : chat
                            ));
                            setSelectedConversations([]);

                            Swal.fire({
                              icon: 'success',
                              title: 'Đã khôi phục',
                              text: `Đã khôi phục ${selectedConversations.length} cuộc trò chuyện`,
                              confirmButtonColor: '#36B37E',
                              timer: 1500,
                              showConfirmButton: false
                            });
                          })
                          .catch(error => {
                            console.error("Lỗi khi khôi phục nhiều cuộc trò chuyện:", error);
                          });
                      }}
                      className="bg-mint-600 text-white px-4 py-1.5 rounded-md hover:bg-mint-700 flex items-center text-sm shadow-sm hover:shadow transition-all duration-200"
                    >
                      <BiCheck className="mr-1.5" />
                      Khôi phục đã chọn
                    </button>
                  )}
                  <button
                    onClick={handleDeleteMultiple}
                    className="bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 flex items-center text-sm shadow-sm hover:shadow transition-all duration-200"
                  >
                    <BiTrash className="mr-1.5" />
                    Xóa đã chọn
                  </button>
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
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('all');
                    setAgeFilter('all');
                  }}
                  className="text-mint-600 text-xs hover:underline flex items-center"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-pulse space-y-4 w-full max-w-4xl">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="flex space-x-4">
                  <div className="h-16 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 mt-8">
                <div className="w-3 h-3 bg-mint-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-mint-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-3 h-3 bg-mint-600 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
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
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiêu đề
                      </th>
                      <th scope="col"
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
                      <th scope="col"
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
                            style={{ backgroundColor: 'rgba(54, 179, 126, 0.2)' }}>
                            {chat.age_context || 'N/A'} tuổi
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <BiMessageRounded className="mr-1.5 text-mint-500" />
                            <span className="font-medium">{chat.messageCount || 0}</span>
                            <span className="text-xs text-gray-500 ml-1">tin nhắn</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => navigateToChat(chat.id)}
                              className="text-mint-600 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded-md transition-all duration-200 flex items-center"
                            >
                              <BiChat className="mr-1.5" />
                              Xem
                            </button>
                            {chat.is_archived ? (
                              <button
                                onClick={() => handleUnarchive(chat.id)}
                                className="text-mint-600 hover:text-white hover:bg-mint-600 px-2 py-1.5 rounded-md transition-all duration-200"
                                title="Khôi phục"
                              >
                                <BiCheck />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchive(chat.id)}
                                className="text-gray-600 hover:text-white hover:bg-gray-600 px-2 py-1.5 rounded-md transition-all duration-200"
                                title="Lưu trữ"
                              >
                                <BiArchiveIn />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(chat.id)}
                              className="text-red-600 hover:text-white hover:bg-red-600 px-2 py-1.5 rounded-md transition-all duration-200"
                              title="Xóa"
                            >
                              <BiTrash />
                            </button>
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
                          Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredAndSortedHistory.length)}</span> trong <span className="font-medium">{filteredAndSortedHistory.length}</span> kết quả
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
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setDateFilter('all');
                        setAgeFilter('all');
                      }}
                      className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-all duration-200 shadow-sm hover:shadow flex items-center"
                      style={{ backgroundColor: '#36B37E' }}
                    >
                      <BiX className="mr-1.5" />
                      Xóa bộ lọc
                    </button>
                  </>
                ) : (
                  <>
                    {activeTab === 'archived' ? (
                      <>
                        <p className="text-xl font-medium text-gray-700 mb-2">Không có cuộc trò chuyện nào được lưu trữ</p>
                        <p className="text-gray-500 mb-6 max-w-md">Bạn có thể lưu trữ các cuộc trò chuyện để tham khảo sau</p>
                        <button
                          onClick={() => setActiveTab('all')}
                          className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-all duration-200 shadow-sm hover:shadow flex items-center"
                          style={{ backgroundColor: '#36B37E' }}
                        >
                          <BiMessageRounded className="mr-1.5" />
                          Xem tất cả cuộc trò chuyện
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-medium text-gray-700 mb-2">Chưa có cuộc trò chuyện nào</p>
                        <p className="text-gray-500 mb-6 max-w-md">Bắt đầu trò chuyện mới với Nutribot để nhận thông tin hữu ích về dinh dưỡng</p>
                        <Link
                          to="/chat"
                          className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-all duration-200 shadow-sm hover:shadow flex items-center"
                          style={{ backgroundColor: '#36B37E' }}
                        >
                          <BiChat className="mr-1.5" />
                          Bắt đầu trò chuyện
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