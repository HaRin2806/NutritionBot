import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BiSend,
  BiPlus,
  BiSearch,
  BiUserCircle,
  BiInfoCircle,
  BiHistory,
  BiCog,
  BiLogOut,
  BiRocket,
  BiChevronDown,
  BiDotsVerticalRounded,
  BiTrash,
  BiEdit,
  BiX,
  BiMenu,
  BiHomeAlt
} from 'react-icons/bi';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Nutribot Logo SVG component
const NutribotLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#36B37E" fillOpacity="0.2" />
    <path d="M17.5 9.5C17.5 11.08 16.58 12.45 15.25 13.22C14.58 13.62 13.8 13.85 13 13.85C10.51 13.85 8.5 11.84 8.5 9.35C8.5 8.55 8.73 7.77 9.13 7.1C9.9 5.77 11.27 4.85 12.85 4.85C15.43 4.85 17.5 6.92 17.5 9.5Z" fill="#36B37E" stroke="#36B37E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 14.5C6.5 16.99 8.51 19 11 19C11.8 19 12.58 18.77 13.25 18.37C14.58 17.6 15.5 16.23 15.5 14.65C15.5 12.07 13.43 10 10.85 10C9.27 10 7.9 10.92 7.13 12.25C6.73 12.92 6.5 13.7 6.5 14.5Z" fill="#36B37E" stroke="#36B37E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Component để hiển thị hình ảnh với trạng thái loading
const RenderImage = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Xử lý đường dẫn hình ảnh
  let imgSrc = src;

  if (src) {
    // Xử lý đường dẫn tương đối với '../figures/'
    if (src.includes('../figures/')) {
      const relativePath = src.split('../figures/')[1];
      // Lấy tên file từ đường dẫn
      const fileName = relativePath;

      // Tìm mã bài từ tên file (ví dụ: bai1_hinh1.jpg -> bai1)
      let baiId = 'bai1'; // Mặc định là bai1
      const baiMatch = fileName.match(/^(bai\d+)_/);
      if (baiMatch) {
        baiId = baiMatch[1];
      }

      // Tạo URL API chính xác
      imgSrc = `${API_BASE_URL}/figures/${baiId}/${fileName}`;
    }
    // Trường hợp đường dẫn bình thường
    else {
      // Lấy tên file từ đường dẫn
      const fileName = src.split('/').pop();

      // Tìm mã bài từ tên file (ví dụ: bai1_hinh1.jpg -> bai1)
      let baiId = 'bai1'; // Mặc định là bai1
      const baiMatch = fileName.match(/^(bai\d+)_/);
      if (baiMatch) {
        baiId = baiMatch[1];
      }

      // Tạo URL API chính xác
      imgSrc = `${API_BASE_URL}/figures/${baiId}/${fileName}`;
    }
  }

  return (
    <span className="block my-4">
      {loading && (
        <span className="flex items-center justify-center h-24 bg-gray-100 rounded-lg animate-pulse">
          <span className="text-gray-500">Đang tải hình ảnh...</span>
        </span>
      )}
      {error && (
        <span className="flex items-center justify-center h-24 bg-red-50 rounded-lg">
          <span className="text-red-500">Không thể tải hình ảnh</span>
        </span>
      )}
      <img
        src={imgSrc}
        alt={alt || "Hình ảnh"}
        className={`max-w-full rounded-lg border border-gray-200 shadow-sm ${loading ? 'hidden' : 'block'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {alt && !error && <span className="block text-center text-sm text-gray-600 mt-1">{alt}</span>}
    </span>
  );
};

// Component hiển thị nguồn tham khảo
const SourceReference = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
      <div className="flex items-center mb-2">
        <BiInfoCircle className="text-mint-600 mr-1" style={{ color: '#36B37E' }} />
        <span className="font-medium">Nguồn tham khảo:</span>
      </div>
      <ul className="space-y-1 ml-1">
        {sources.map((source, index) => (
          <li key={index} className="flex items-start">
            <span className="text-xs text-gray-500 mr-1">[{index + 1}]</span>
            <span className="text-gray-700">
              {source.title}
              {source.pages && <span className="text-gray-500 ml-1">(Trang {source.pages})</span>}
              {source.content_type === 'table' && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Bảng</span>}
              {source.content_type === 'figure' && <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Hình</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component hiển thị menu cho mỗi đoạn chat
const ChatItemMenu = ({ conversation, onDelete, onRename }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState('bottom'); // 'bottom' hoặc 'top'

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Kiểm tra vị trí để quyết định hiển thị menu hướng lên hay xuống
  const toggleMenu = (e) => {
    if (!isOpen) {
      const button = e.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const bottomSpace = windowHeight - buttonRect.bottom;

      // Nếu khoảng cách từ button đến bottom của trang < 100px, hiển thị menu ở phía trên
      setMenuPosition(bottomSpace < 100 ? 'top' : 'bottom');
    }

    setIsOpen(!isOpen);
  };

  const handleRename = () => {
    onRename(conversation.id, conversation.title);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(conversation.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
      >
        <BiDotsVerticalRounded />
      </button>

      {isOpen && (
        <div
          className={`absolute ${menuPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'} right-0 w-40 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200`}
        >
          <button
            onClick={handleRename}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <BiEdit className="mr-2" />
            Đổi tên
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <BiTrash className="mr-2" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};

// Component header và menu người dùng
const Header = ({ userData, userAge, setUserAge, handleLogout, toggleSidebar, isMobile, isSidebarVisible, activeConversation, updateConversationAge }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý thay đổi tuổi
  const handleAgeChange = () => {
    // Kiểm tra nếu đang trong một cuộc hội thoại có age_context và có tin nhắn
    if (activeConversation && activeConversation.id &&
      activeConversation.age_context &&
      activeConversation.messages &&
      activeConversation.messages.length > 0) {
      Swal.fire({
        title: 'Không thể thay đổi độ tuổi',
        text: 'Cuộc trò chuyện này đã có tin nhắn với độ tuổi cụ thể. Bạn cần tạo cuộc trò chuyện mới để sử dụng độ tuổi khác.',
        icon: 'warning',
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#36B37E'
      });
      return;
    }

    Swal.fire({
      title: 'Thay đổi độ tuổi',
      html: `
        <select id="swal-age" class="swal2-input">
          ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
        `<option value="${age}" ${userAge === age ? 'selected' : ''}>${age} tuổi</option>`
      ).join('')}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#36B37E',
      preConfirm: () => {
        const age = parseInt(document.getElementById('swal-age').value);
        if (isNaN(age) || age < 1 || age > 19) {
          Swal.showValidationMessage('Vui lòng chọn tuổi từ 1-19');
        }
        return age;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newAge = result.value;
        setUserAge(newAge);

        // Nếu đang trong cuộc hội thoại, cập nhật age_context
        if (activeConversation && activeConversation.id && userData && userData.id) {
          updateConversationAge(activeConversation.id, newAge, userData.id);
        }

        Swal.fire({
          icon: 'success',
          title: 'Đã cập nhật',
          text: `Đã cập nhật độ tuổi thành ${newAge}`,
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Thêm điều kiện hiển thị nút toggle sidebar chỉ khi sidebar đóng hoặc không phải mobile */}
        {(isMobile && !isSidebarVisible) && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
            style={{ color: '#36B37E' }}
          >
            <BiMenu className="text-xl" />
          </button>
        )}

        <div className="flex items-center text-mint-600" style={{ color: '#36B37E' }}>
          <NutribotLogo />
          <span className="font-bold text-lg ml-2 hidden sm:block">Nutribot</span>
        </div>

        {/* Nút trở về trang chủ */}
        <Link
          to="/"
          className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
          style={{ color: '#36B37E' }}
        >
          <BiHomeAlt className="text-xl" />
        </Link>
      </div>

      <div className="flex items-center">
        {/* Hiển thị tuổi hiện tại */}
        {userAge && (
          <button
            onClick={handleAgeChange}
            className="mr-4 px-3 py-1 bg-mint-100 text-mint-700 rounded-full text-sm flex items-center hover:bg-mint-200 transition"
            style={{ backgroundColor: '#E6F7EF', color: '#36B37E' }}
          >
            <BiUserCircle className="mr-1" />
            {userAge} tuổi
          </button>
        )}

        {/* Menu người dùng */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-mint-600 focus:outline-none"
          >
            <span className="hidden sm:block mr-1">{userData ? userData.name : 'Tài khoản'}</span>
            <BiUserCircle className="text-2xl sm:ml-1" />
            <BiChevronDown className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-mint-50 hover:text-mint-700"
              >
                <BiCog className="mr-2" />
                Quản lý tài khoản
              </Link>
              <Link
                to="/history"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-mint-50 hover:text-mint-700"
              >
                <BiHistory className="mr-2" />
                Lịch sử trò chuyện
              </Link>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <BiLogOut className="mr-2" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component chính
const ChatPage = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { conversationId } = useParams();

  // Phát hiện kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      // Trên màn hình lớn, luôn hiển thị sidebar
      if (!newIsMobile) {
        setIsSidebarVisible(true);
      } else if (newIsMobile && isSidebarVisible) {
        // Trên màn hình nhỏ, nếu đang hiển thị sidebar thì ẩn đi
        setIsSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarVisible]);

  // Hàm cập nhật age_context
  const updateConversationAge = async (conversationId, age, userId) => {
    if (!conversationId || !userId) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/conversations/${conversationId}`,
        {
          title: activeConversation?.title,
          age_context: age,
          user_id: userId
        }
      );

      if (response.data.success) {
        // Cập nhật cả activeConversation
        setActiveConversation(prev => ({
          ...prev,
          age_context: age
        }));

        // Cập nhật trong danh sách cuộc hội thoại
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, age_context: age }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật tuổi cho cuộc hội thoại:", error);
    }
  };

  // Kiểm tra đăng nhập và lấy thông tin user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    if (user && Object.keys(user).length > 0) {
      setUserData(user);
      // Lấy danh sách cuộc hội thoại nếu đã đăng nhập
      fetchConversations(user.id);
    } else {
      // Hiển thị thông báo chưa đăng nhập nhưng vẫn ở trang chat
      Swal.fire({
        title: 'Bạn chưa đăng nhập',
        text: 'Bạn cần đăng nhập để sử dụng ứng dụng này',
        icon: 'warning',
        timer: 5000,
        timerProgressBar: true,
        confirmButtonText: 'Đăng nhập ngay',
        confirmButtonColor: '#36B37E',
        didOpen: () => {
          Swal.showLoading();
          const timerInterval = setInterval(() => {
            // Chỉ để trống, thanh tiến trình sẽ tự động hiển thị
          }, 100);
          Swal.timerInterval = timerInterval;
        },
        willClose: () => {
          clearInterval(Swal.timerInterval);
          navigate('/login');
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    }
  }, [navigate]);

  // Lấy danh sách cuộc hội thoại
  const fetchConversations = async (userId) => {
    if (!userId) return;

    try {
      setIsLoadingConversations(true);
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        params: { user_id: userId }
      });

      if (response.data.success) {
        setConversations(response.data.conversations);

        // Nếu có conversationId từ URL, thiết lập nó làm cuộc hội thoại active
        if (conversationId) {
          const foundConversation = response.data.conversations.find(c => c.id === conversationId);
          if (foundConversation) {
            setActiveConversation(foundConversation);
            // Lấy chi tiết cuộc hội thoại
            fetchConversationDetail(conversationId, userId);
          }
        } else if (response.data.conversations.length > 0) {
          // Nếu không có conversationId từ URL, lấy cuộc hội thoại mới nhất
          setActiveConversation(response.data.conversations[0]);
          fetchConversationDetail(response.data.conversations[0].id, userId);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách cuộc hội thoại:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Lấy chi tiết cuộc hội thoại
  const fetchConversationDetail = async (id, userId) => {
    if (!id || !userId) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/conversations/${id}`, {
        params: { user_id: userId }
      });

      if (response.data.success) {
        const conversation = response.data.conversation;

        // Cập nhật cuộc hội thoại đang hoạt động với dữ liệu đầy đủ
        setActiveConversation(conversation);

        // Cập nhật userAge từ age_context nếu có
        if (conversation.age_context) {
          setUserAge(conversation.age_context);
        } else {
          // Nếu cuộc hội thoại không có age_context và cũng không có tin nhắn
          // (nghĩa là cuộc hội thoại mới), cho phép người dùng đặt tuổi mới
          if (!conversation.messages || conversation.messages.length === 0) {
            setUserAge(null);
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết cuộc hội thoại:", error);
    }
  };

  // Khi không có active conversation nhưng có conversations
  useEffect(() => {
    if (activeConversation === null && conversations.length > 0) {
      setActiveConversation(conversations[0]);

      // Nếu cuộc hội thoại có age_context, cập nhật userAge
      if (conversations[0].age_context) {
        setUserAge(conversations[0].age_context);
      }
    }
  }, [conversations, activeConversation]);

  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Hàm tạo ID duy nhất cho tin nhắn tạm thời
  const generateTempId = () => {
    return 'temp_' + Date.now();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Kiểm tra nếu không có tuổi
    if (!userAge) {
      Swal.fire({
        title: 'Chưa thiết lập tuổi',
        text: 'Bạn cần thiết lập tuổi để nhận câu trả lời phù hợp.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Thiết lập ngay',
        cancelButtonText: 'Để sau',
        confirmButtonColor: '#36B37E'
      }).then((result) => {
        if (result.isConfirmed) {
          // Mở dialog thiết lập tuổi
          Swal.fire({
            title: 'Thiết lập độ tuổi',
            html: `
              <select id="swal-age" class="swal2-input">
                ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
              `<option value="${age}">${age} tuổi</option>`
            ).join('')}
              </select>
            `,
            confirmButtonText: 'Lưu',
            confirmButtonColor: '#36B37E',
            preConfirm: () => {
              const age = parseInt(document.getElementById('swal-age').value);
              if (isNaN(age) || age < 1 || age > 19) {
                Swal.showValidationMessage('Vui lòng chọn tuổi từ 1-19');
              }
              return age;
            }
          }).then((result) => {
            if (result.isConfirmed) {
              const newAge = result.value;
              setUserAge(newAge);

              // Nếu đang trong cuộc hội thoại, cập nhật age_context
              if (activeConversation && activeConversation.id && userData && userData.id) {
                updateConversationAge(activeConversation.id, newAge, userData.id);
              }

              // Tiếp tục gửi tin nhắn sau khi thiết lập tuổi
              setTimeout(() => {
                handleSendMessage(e);
              }, 500);
            }
          });
        }
      });
      return;
    }

    // Kiểm tra nếu đang trong một cuộc hội thoại có age_context khác với userAge hiện tại
    if (activeConversation && activeConversation.id &&
      activeConversation.age_context &&
      activeConversation.age_context !== userAge) {
      Swal.fire({
        title: 'Độ tuổi không khớp',
        text: 'Cuộc trò chuyện này đã được thiết lập cho độ tuổi khác. Vui lòng tạo cuộc trò chuyện mới nếu muốn sử dụng độ tuổi hiện tại.',
        icon: 'warning',
        confirmButtonText: 'Tạo cuộc trò chuyện mới',
        cancelButtonText: 'Đóng',
        showCancelButton: true,
        confirmButtonColor: '#36B37E'
      }).then((result) => {
        if (result.isConfirmed) {
          startNewConversation();
        } else {
          // Khôi phục lại tuổi theo age_context của cuộc hội thoại
          setUserAge(activeConversation.age_context);
        }
      });
      return;
    }

    // Sao lưu tin nhắn để dùng sau
    const messageContent = newMessage;
    setNewMessage('');

    // Tạo ID tạm thời cho tin nhắn người dùng
    const tempUserId = generateTempId();

    // Tạo tin nhắn người dùng để hiển thị ngay lập tức
    const userMessage = {
      id: tempUserId,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    // Cập nhật state để hiển thị tin nhắn người dùng ngay lập tức
    if (activeConversation) {
      setActiveConversation(prev => {
        // Tạo bản sao của cuộc hội thoại hiện tại
        const updatedConversation = { ...prev };

        // Khởi tạo mảng messages nếu chưa có
        if (!updatedConversation.messages) {
          updatedConversation.messages = [];
        }

        // Thêm tin nhắn mới
        updatedConversation.messages = [...updatedConversation.messages, userMessage];

        return updatedConversation;
      });
    } else {
      // Nếu chưa có cuộc hội thoại nào, tạo cuộc hội thoại mới tạm thời
      setActiveConversation({
        id: null,
        title: 'Cuộc trò chuyện mới',
        messages: [userMessage],
        age_context: userAge
      });
    }

    // Cuộn xuống dưới để hiển thị tin nhắn mới
    setTimeout(scrollToBottom, 100);

    // Bắt đầu loading
    setIsLoading(true);

    try {
      // Chuẩn bị dữ liệu gửi đi
      const requestData = {
        message: messageContent,
        age: userAge,
        user_id: userData?.id
      };

      // Nếu đang trong một cuộc hội thoại, thêm conversation_id
      if (activeConversation && activeConversation.id) {
        requestData.conversation_id = activeConversation.id;
      }

      // Gọi API
      const response = await axios.post(`${API_BASE_URL}/chat`, requestData);

      if (response.data.success) {
        // Nếu có conversation_id mới được tạo, cập nhật state
        if (response.data.conversation_id && (!activeConversation?.id)) {
          // Tìm nạp chi tiết cuộc hội thoại mới
          fetchConversationDetail(response.data.conversation_id, userData?.id);
          // Làm mới danh sách cuộc hội thoại
          fetchConversations(userData?.id);

          // Thêm thông báo khi có title mới được tạo
          if (response.data.conversation_title) {
            // Hiển thị thông báo nổi nhỏ
            const toastDiv = document.createElement('div');
            toastDiv.className = 'toast-notification';
            toastDiv.innerHTML = `<span>Đã đặt tên cuộc hội thoại: ${response.data.conversation_title}</span>`;
            document.body.appendChild(toastDiv);

            // Xóa thông báo sau 3 giây
            setTimeout(() => {
              toastDiv.remove();
            }, 3000);
          }
        } else if (activeConversation && activeConversation.id) {
          // Nếu đang trong cuộc hội thoại hiện có, làm mới nó
          fetchConversationDetail(activeConversation.id, userData?.id);
        } else {
          // Nếu không có conversation_id từ API (trường hợp người dùng không đăng nhập)
          // Tạo tin nhắn bot để hiển thị ngay
          const botMessage = {
            id: generateTempId(),
            role: 'bot',
            content: response.data.reply,
            timestamp: new Date().toISOString(),
            sources: response.data.sources || []
          };

          // Cập nhật giao diện với tin nhắn bot
          setActiveConversation(prev => {
            const updatedConversation = { ...prev };
            updatedConversation.messages = [...updatedConversation.messages, botMessage];
            return updatedConversation;
          });
        }
      } else {
        // Xử lý lỗi
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: response.data.error || 'Có lỗi xảy ra',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#36B37E'
        });
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi kết nối',
        text: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#36B37E'
      });

      // Xóa tin nhắn tạm nếu gặp lỗi
      if (activeConversation) {
        setActiveConversation(prev => {
          const updatedConversation = { ...prev };
          updatedConversation.messages = updatedConversation.messages.filter(m => m.id !== tempUserId);
          return updatedConversation;
        });
      }
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const startNewConversation = async () => {
    if (!userData || !userData.id) {
      navigate('/login');
      return;
    }

    try {
      // Tạo cuộc hội thoại mới mà không truyền age_context
      const response = await axios.post(
        `${API_BASE_URL}/conversations`,
        {
          title: 'Cuộc trò chuyện mới',
          user_id: userData.id
          // Không truyền age_context ở đây
        }
      );

      if (response.data.success) {
        // Tạo thành công, thiết lập lại userAge
        setUserAge(null); // Reset tuổi để người dùng nhập lại

        // Làm mới danh sách cuộc hội thoại
        await fetchConversations(userData.id);

        // Mở cuộc hội thoại mới
        const conversationId = response.data.conversation_id;
        if (conversationId) {
          // Tạo một cuộc hội thoại tạm với ID mới và không có age_context
          const newConversation = {
            id: conversationId,
            title: 'Cuộc trò chuyện mới',
            messages: [],
            age_context: null, // Đảm bảo không có age_context
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Thiết lập cuộc hội thoại mới không có age_context
          setActiveConversation(newConversation);

          // Lấy chi tiết đầy đủ sau khi thiết lập
          fetchConversationDetail(conversationId, userData.id);
        }

        // Trên mobile, ẩn sidebar sau khi tạo cuộc trò chuyện mới
        if (isMobile) {
          setIsSidebarVisible(false);
        }

        // Hiển thị thông báo nhắc người dùng chọn tuổi
        setTimeout(() => {
          Swal.fire({
            title: 'Thiết lập độ tuổi',
            text: 'Vui lòng thiết lập độ tuổi cho cuộc trò chuyện mới',
            icon: 'info',
            confirmButtonText: 'Thiết lập ngay',
            confirmButtonColor: '#36B37E'
          }).then((result) => {
            if (result.isConfirmed) {
              // Mở dialog thiết lập tuổi
              Swal.fire({
                title: 'Chọn độ tuổi',
                html: `
                  <select id="swal-age" class="swal2-input">
                    ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
                  `<option value="${age}">${age} tuổi</option>`
                ).join('')}
                  </select>
                `,
                confirmButtonText: 'Lưu',
                confirmButtonColor: '#36B37E',
                preConfirm: () => {
                  const age = parseInt(document.getElementById('swal-age').value);
                  if (isNaN(age) || age < 1 || age > 19) {
                    Swal.showValidationMessage('Vui lòng chọn tuổi từ 1-19');
                  }
                  return age;
                }
              }).then((result) => {
                if (result.isConfirmed) {
                  setUserAge(result.value);
                  // Cập nhật age_context cho cuộc hội thoại mới
                  updateConversationAge(conversationId, result.value, userData.id);
                }
              });
            }
          });
        }, 500);
      }
    } catch (error) {
      console.error("Lỗi khi tạo cuộc hội thoại mới:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tạo cuộc hội thoại mới',
        confirmButtonColor: '#36B37E'
      });
    }

    // Focus vào input
    inputRef.current?.focus();
  };

  const deleteConversation = async (conversationId) => {
    if (!userData || !userData.id) return;

    Swal.fire({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Bạn có chắc muốn xóa cuộc trò chuyện này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${API_BASE_URL}/conversations/${conversationId}`,
            { params: { user_id: userData.id } }
          );

          if (response.data.success) {
            // Xóa khỏi state
            const updatedConversations = conversations.filter(c => c.id !== conversationId);
            setConversations(updatedConversations);

            // Nếu đang xem cuộc hội thoại bị xóa, chuyển sang cuộc hội thoại khác
            if (activeConversation && activeConversation.id === conversationId) {
              if (updatedConversations.length > 0) {
                setActiveConversation(updatedConversations[0]);
                fetchConversationDetail(updatedConversations[0].id, userData.id);
              } else {
                setActiveConversation(null);
              }
            }
          }
        } catch (error) {
          console.error("Lỗi khi xóa cuộc hội thoại:", error);
        }
      }
    });
  };

  const renameConversation = async (conversationId, currentTitle) => {
    if (!userData || !userData.id) return;

    Swal.fire({
      title: 'Đổi tên cuộc trò chuyện',
      input: 'text',
      inputValue: currentTitle,
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#36B37E',
      preConfirm: (title) => {
        if (!title.trim()) {
          Swal.showValidationMessage('Tên cuộc trò chuyện không được để trống');
        }
        return title;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${API_BASE_URL}/conversations/${conversationId}`,
            {
              title: result.value,
              user_id: userData.id
            }
          );

          if (response.data.success) {
            // Cập nhật title trong state
            setConversations(prevConversations =>
              prevConversations.map(conv =>
                conv.id === conversationId
                  ? { ...conv, title: result.value }
                  : conv
              )
            );

            // Nếu đang xem cuộc hội thoại được đổi tên, cập nhật title
            if (activeConversation && activeConversation.id === conversationId) {
              setActiveConversation(prev => ({
                ...prev,
                title: result.value
              }));
            }

            // Thông báo thành công
            Swal.fire({
              icon: 'success',
              title: 'Đã đổi tên',
              timer: 1500,
              showConfirmButton: false
            });
          }
        } catch (error) {
          console.error("Lỗi khi đổi tên cuộc hội thoại:", error);
        }
      }
    });
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
    }).then((result) => {
      if (result.isConfirmed) {
        // Xóa thông tin người dùng
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');

        // Đặt lại state
        setUserData(null);
        setActiveConversation(null);
        setConversations([]);

        // Chuyển hướng về trang đăng nhập
        navigate('/login');
      }
    });
  };

  const handleSearchConversations = (e) => {
    setSearchTerm(e.target.value);
  };

  // Lọc conversations dựa trên searchTerm
  const filteredConversations = conversations.filter(
    conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle sidebar (cho responsive)
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Nhóm các cuộc trò chuyện
  const groupConversationsByTime = (conversations) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000; // Trừ đi 1 ngày
    const last7Days = today - 86400000 * 7; // Trừ đi 7 ngày
    const last30Days = today - 86400000 * 30; // Trừ đi 30 ngày

    const groups = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: []
    };

    conversations.forEach(conversation => {
      const conversationDate = new Date(conversation.updated_at).getTime();

      if (conversationDate >= today) {
        groups.today.push(conversation);
      } else if (conversationDate >= yesterday) {
        groups.yesterday.push(conversation);
      } else if (conversationDate >= last7Days) {
        groups.last7Days.push(conversation);
      } else if (conversationDate >= last30Days) {
        groups.older.push(conversation);
      } else {
        groups.older.push(conversation);
      }
    });

    return groups;
  };

  // Format time từ timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Custom renderer cho markdown
  const MarkdownComponents = {
    // Xử lý image để tránh lỗi nested DOM
    img: ({ node, ...props }) => {
      return <RenderImage src={props.src} alt={props.alt} />;
    },

    // Override p để ngăn các thành phần không hợp lệ bên trong
    p: ({ node, children, ...props }) => {
      // Kiểm tra nếu children có chứa RenderImage
      const hasSpecialChild = React.Children.toArray(children).some(
        child => React.isValidElement(child) &&
          (child.type === RenderImage || child.props?.src)
      );

      // Nếu có special child, chỉ render children
      if (hasSpecialChild) {
        return <>{children}</>;
      }

      // Nếu không, render như paragraph bình thường
      return <p {...props}>{children}</p>;
    },

    table: ({ node, ...props }) => {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
            {props.children}
          </table>
        </div>
      );
    },
    thead: ({ node, ...props }) => {
      return <thead className="bg-mint-50">{props.children}</thead>;
    },
    th: ({ node, ...props }) => {
      return <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">{props.children}</th>;
    },
    td: ({ node, ...props }) => {
      return <td className="border border-gray-300 px-4 py-2 text-gray-700">{props.children}</td>;
    },
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-4"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-gray-800`} {...props}>
          {children}
        </code>
      );
    },
    blockquote: ({ node, ...props }) => {
      return (
        <blockquote className="border-l-4 border-mint-500 pl-4 italic text-gray-700 my-4">
          {props.children}
        </blockquote>
      );
    },
    li: ({ node, ...props }) => {
      return <li className="mb-1">{props.children}</li>;
    }
  };

  // Tạo phần conversation list với các nhóm thời gian
  const renderConversationGroups = () => {
    // Nếu đang loading
    if (isLoadingConversations) {
      return (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-12 bg-gray-200 rounded-md"></div>
            <div className="h-12 bg-gray-200 rounded-md"></div>
            <div className="h-12 bg-gray-200 rounded-md"></div>
          </div>
          <p className="mt-4">Đang tải cuộc trò chuyện...</p>
        </div>
      );
    }

    // Nếu không có kết quả
    if (filteredConversations.length === 0) {
      return searchTerm ? (
        <div className="p-4 text-center text-gray-500">
          Không tìm thấy cuộc trò chuyện phù hợp
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          Chưa có cuộc trò chuyện nào. Bấm + để bắt đầu.
        </div>
      );
    }

    // Nhóm các cuộc trò chuyện
    const groupedConversations = groupConversationsByTime(filteredConversations);

    // Render các nhóm
    return (
      <div className="space-y-4">
        {/* Nhóm Hôm nay */}
        {groupedConversations.today.length > 0 && (
          <div>
            <h3 className="px-4 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hôm nay
            </h3>
            {groupedConversations.today.map(renderConversationItem)}
          </div>
        )}

        {/* Nhóm Hôm qua */}
        {groupedConversations.yesterday.length > 0 && (
          <div>
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hôm qua
            </h3>
            {groupedConversations.yesterday.map(renderConversationItem)}
          </div>
        )}

        {/* Nhóm 7 ngày qua */}
        {groupedConversations.last7Days.length > 0 && (
          <div>
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              7 ngày qua
            </h3>
            {groupedConversations.last7Days.map(renderConversationItem)}
          </div>
        )}

        {/* Nhóm Cũ hơn */}
        {groupedConversations.older.length > 0 && (
          <div>
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              30 ngày qua
            </h3>
            {groupedConversations.older.map(renderConversationItem)}
          </div>
        )}
      </div>
    );
  };

  // Render một item cuộc trò chuyện
  const renderConversationItem = (conversation) => {
    return (
      <div
        key={conversation.id}
        onClick={() => {
          if (activeConversation?.id !== conversation.id) {
            fetchConversationDetail(conversation.id, userData?.id);
          }
          // Trên mobile, đóng sidebar sau khi chọn
          if (isMobile) {
            setIsSidebarVisible(false);
          }
        }}
        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition rounded-md mx-2
          ${activeConversation?.id === conversation.id ? 'bg-mint-100' : 'hover:bg-gray-50'}`}
        style={{ backgroundColor: activeConversation?.id === conversation.id ? '#E6F7EF' : '' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium text-gray-800 truncate">{conversation.title}</h3>
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(conversation.updated_at)}
          </div>
        </div>
        <ChatItemMenu
          conversation={conversation}
          onDelete={deleteConversation}
          onRename={renameConversation}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
        handleLogout={handleLogout}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        isSidebarVisible={isSidebarVisible}
        activeConversation={activeConversation}
        updateConversationAge={updateConversationAge}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - fixed on mobile when visible */}
        <div
          className={`${isSidebarVisible
            ? 'w-80 transform translate-x-0'
            : 'w-0 -translate-x-full'
            } bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 overflow-hidden ${isMobile ? 'fixed inset-0 z-30' : 'relative'
            }`}
        >
          {/* Header của sidebar riêng, nút đóng chuyển lên đây */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Trò chuyện</h2>
            <div className="flex space-x-2">
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
                  style={{ color: '#36B37E' }}
                >
                  <BiX className="text-xl" />
                </button>
              )}
              <Link
                to="/history"
                className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
                style={{ color: '#36B37E' }}
              >
                <BiHistory className="text-lg" />
              </Link>
              <button
                onClick={startNewConversation}
                className="p-2 bg-mint-600 text-white rounded-full hover:bg-mint-700 transition shadow-sm"
                style={{ backgroundColor: '#36B37E' }}
              >
                <BiPlus className="text-lg" />
              </button>
            </div>
          </div>

          {/* Search section */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full py-2 pl-8 pr-3 border border-mint-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                style={{ borderColor: '#A0D9C1' }}
                value={searchTerm}
                onChange={handleSearchConversations}
              />
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderConversationGroups()}
          </div>
        </div>

        {/* Overlay mới với background transparent và chỉ backdrop filter */}
        {isMobile && isSidebarVisible && (
          <div
            className="fixed inset-0 z-20"
            style={{
              backgroundColor: 'rgba(0,0,0,0.15)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)'
            }}
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative z-5">
          {activeConversation ? (
            <>
              {/* Messages Area */}
              <div
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
                style={{
                  backgroundColor: '#F7FFFA',
                  backgroundImage: 'linear-gradient(to bottom, rgba(54, 179, 126, 0.05) 0%, rgba(54, 179, 126, 0.01) 100%)'
                }}
              >
                {activeConversation.messages && activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        } message-animation`}
                    >
                      <div
                        className={`max-w-[90%] md:max-w-[80%] p-4 rounded-2xl shadow-sm ${message.role === 'user'
                          ? 'bg-mint-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        style={{
                          backgroundColor: message.role === 'user'
                            ? '#36B37E'
                            : '#FFFFFF'
                        }}
                      >
                        {message.role === 'user' ? (
                          <div>{message.content}</div>
                        ) : (
                          <div className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={MarkdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {message.sources && message.sources.length > 0 && (
                              <SourceReference sources={message.sources} />
                            )}
                          </div>
                        )}
                        <div className={`text-xs mt-2 ${message.role === 'user'
                          ? 'text-mint-200'
                          : 'text-gray-500'
                          }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <BiRocket className="text-5xl mb-4" style={{ color: '#36B37E' }} />
                    <p className="text-lg mb-2">Bắt đầu cuộc trò chuyện mới</p>
                    <p className="text-sm text-center max-w-md">
                      Hãy đặt câu hỏi về dinh dưỡng và an toàn thực phẩm để tôi có thể giúp bạn
                    </p>
                  </div>
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-mint-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="h-2 w-2 bg-mint-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="h-2 w-2 bg-mint-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="ml-3 text-gray-600">{"Đang soạn phản hồi..."}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Nhập câu hỏi của bạn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`p-3 rounded-lg text-white transition ${isLoading
                      ? 'bg-mint-400 cursor-not-allowed'
                      : 'bg-mint-600 hover:bg-mint-700'
                      }`}
                    style={{ backgroundColor: isLoading ? '#A0D9C1' : '#36B37E' }}
                  >
                    <BiSend />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
              <BiRocket className="text-7xl mb-6" style={{ color: '#36B37E' }} />
              <p className="text-xl mb-4">Chưa có cuộc trò chuyện nào</p>
              <button
                onClick={startNewConversation}
                className="px-6 py-3 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition flex items-center"
                style={{ backgroundColor: '#36B37E' }}
              >
                <BiPlus className="mr-2" />
                Bắt đầu cuộc trò chuyện mới
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;