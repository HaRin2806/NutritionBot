import React, { useState } from 'react';
import { BiCalendar, BiSearch, BiTrash, BiMessageRounded, BiTime, BiChevronDown, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { Link } from 'react-router-dom';

// Dữ liệu mẫu lịch sử trò chuyện
const dummyHistory = [
  {
    id: 1,
    title: 'Hỏi về dinh dưỡng trẻ em',
    startTime: '2023-03-25T10:28:00',
    endTime: '2023-03-25T10:45:00',
    messageCount: 12,
    keywords: ['dinh dưỡng', 'trẻ em', 'thực phẩm'],
  },
  {
    id: 2,
    title: 'Thông tin về thực phẩm an toàn',
    startTime: '2023-03-24T15:10:00',
    endTime: '2023-03-24T15:30:00',
    messageCount: 8,
    keywords: ['thực phẩm', 'an toàn', 'vệ sinh'],
  },
  {
    id: 3,
    title: 'Cách chế biến thức ăn cho trẻ',
    startTime: '2023-03-22T09:05:00',
    endTime: '2023-03-22T09:25:00',
    messageCount: 15,
    keywords: ['chế biến', 'thức ăn', 'trẻ em'],
  },
  {
    id: 4,
    title: 'Hỏi về bữa ăn học đường',
    startTime: '2023-03-21T14:20:00',
    endTime: '2023-03-21T14:45:00',
    messageCount: 18,
    keywords: ['bữa ăn', 'học đường', 'trường học'],
  },
  {
    id: 5,
    title: 'Cách lưu trữ thực phẩm',
    startTime: '2023-03-20T11:15:00',
    endTime: '2023-03-20T11:30:00',
    messageCount: 10,
    keywords: ['lưu trữ', 'bảo quản', 'thực phẩm'],
  },
  {
    id: 6,
    title: 'Hỏi về dinh dưỡng trẻ 5 tuổi',
    startTime: '2023-03-19T16:40:00',
    endTime: '2023-03-19T17:00:00',
    messageCount: 14,
    keywords: ['dinh dưỡng', 'trẻ em', '5 tuổi'],
  },
];

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [history, setHistory] = useState(dummyHistory);

  // Lọc lịch sử trò chuyện
  const filteredHistory = history.filter((chat) => {
    // Lọc theo tìm kiếm
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Lọc theo ngày
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const chatDate = new Date(chat.startTime);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = 
            chatDate.getDate() === today.getDate() &&
            chatDate.getMonth() === today.getMonth() &&
            chatDate.getFullYear() === today.getFullYear();
          break;
        case 'week':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          matchesDate = chatDate >= oneWeekAgo;
          break;
        case 'month':
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(today.getMonth() - 1);
          matchesDate = chatDate >= oneMonthAgo;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

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

  // Xử lý xóa cuộc trò chuyện
  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      setHistory(history.filter(chat => chat.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#F7FFFA' }}>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Lịch sử trò chuyện</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
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
                    className="focus:ring-mint-500 focus:border-mint-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.1)' }}
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="focus:ring-mint-500 focus:border-mint-500 block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md appearance-none"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.1)' }}
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
            </div>
          </div>

          {/* History list */}
          {currentItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tin nhắn
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Từ khóa
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((chat) => (
                    <tr key={chat.id} className="hover:bg-mint-50" style={{ backgroundColor: 'white' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{chat.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(chat.startTime)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <BiTime className="mr-1" />
                          {formatTime(chat.startTime)} - {formatTime(chat.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <BiMessageRounded className="mr-1" />
                          {chat.messageCount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {chat.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint-100 text-mint-800"
                              style={{ backgroundColor: 'rgba(54, 179, 126, 0.2)' }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/chat/${chat.id}`}
                            className="text-mint-600 hover:text-mint-900 px-2 py-1 rounded-md hover:bg-mint-50"
                          >
                            Xem lại
                          </Link>
                          <button
                            onClick={() => handleDelete(chat.id)}
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded-md hover:bg-red-50"
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
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-500">Không tìm thấy cuộc trò chuyện nào phù hợp</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredHistory.length)}</span> trong <span className="font-medium">{filteredHistory.length}</span> kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Trang trước</span>
                        <BiChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === i + 1
                              ? 'text-mint-600 bg-mint-50'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          style={{ 
                            backgroundColor: currentPage === i + 1 ? '#E6F7EF' : 'white',
                            borderColor: currentPage === i + 1 ? '#36B37E' : ''
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;