import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  BiSend, 
  BiPlus, 
  BiSearch, 
  BiTrash, 
  BiPaperclip,
  BiRocket,
  BiUserCircle,
  BiInfoCircle,
  BiLinkExternal,
  BiLogOut,
  BiHistory,
  BiCog,
  BiChevronDown
} from 'react-icons/bi';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Inline CSS styles
const styles = `
/* CSS cho nội dung Markdown và bảng */

/* Định dạng cơ bản cho nội dung markdown */
.markdown-content {
    line-height: 1.6;
    color: #333;
  }
  
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    color: #111827;
  }
  
  .markdown-content h1 {
    font-size: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }
  
  .markdown-content h2 {
    font-size: 1.3rem;
  }
  
  .markdown-content h3 {
    font-size: 1.2rem;
  }
  
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    font-size: 1.1rem;
  }
  
  .markdown-content p {
    margin-bottom: 1rem;
  }
  
  /* Định dạng cho danh sách */
  .markdown-content ul,
  .markdown-content ol {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  .markdown-content ul {
    list-style-type: disc;
  }
  
  .markdown-content ol {
    list-style-type: decimal;
  }
  
  .markdown-content li {
    margin-bottom: 0.25rem;
  }
  
  /* Định dạng cho bảng */
  .markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    font-size: 0.9rem;
  }
  
  .markdown-content table th {
    background-color: #E8F5F0;
    color: #1F6A4C;
    font-weight: 600;
    padding: 0.75rem 1rem;
    text-align: left;
    border: 1px solid #BBEADD;
  }
  
  .markdown-content table td {
    padding: 0.75rem 1rem;
    border: 1px solid #E5E7EB;
    vertical-align: top;
  }
  
  .markdown-content table tr:nth-child(even) {
    background-color: #F9FFFC;
  }
  
  .markdown-content table tr:hover {
    background-color: #F0FFF8;
  }
  
  /* Định dạng cho khối code */
  .markdown-content pre {
    background-color: #1E1E1E;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  
  .markdown-content code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
  }
  
  .markdown-content p code,
  .markdown-content li code {
    background-color: #EFF6FF;
    color: #2563EB;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.85rem;
  }
  
  /* Định dạng cho trích dẫn */
  .markdown-content blockquote {
    border-left: 4px solid #36B37E;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #4B5563;
    font-style: italic;
    background-color: #F7FFFA;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  
  /* Định dạng cho hình ảnh */
  .markdown-content img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  
  /* Định dạng cho liên kết */
  .markdown-content a {
    color: #36B37E;
    text-decoration: none;
  }
  
  .markdown-content a:hover {
    text-decoration: underline;
  }
  
  /* Định dạng cho đường kẻ ngang */
  .markdown-content hr {
    border: 0;
    border-top: 1px solid #E5E7EB;
    margin: 1.5rem 0;
  }
  
  /* Định dạng cho nút hiển thị nguồn */
  .source-button {
    display: inline-flex;
    align-items: center;
    background-color: #EFF6FF;
    color: #2563EB;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s;
    margin-top: 0.5rem;
    cursor: pointer;
  }
  
  .source-button:hover {
    background-color: #DBEAFE;
  }
  
  /* Định dạng cho các tag */
  .tag {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 500;
    margin-right: 0.25rem;
  }
  
  .tag-text {
    background-color: #EFF6FF;
    color: #2563EB;
  }
  
  .tag-table {
    background-color: #F5F3FF;
    color: #6D28D9;
  }
  
  .tag-figure {
    background-color: #FEF3C7;
    color: #D97706;
  }
`;

const API_BASE_URL = 'http://localhost:5000/api';

// Component mới để hiển thị hình ảnh với trạng thái loading
const RenderImage = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Xử lý đường dẫn hình ảnh
  let imgSrc = src;
  
  if (src) {
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
    
    console.log("Image source after processing:", imgSrc);
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
        onError={(e) => {
          console.error("Image loading error:", e);
          setLoading(false);
          setError(true);
        }}
      />
      {alt && !error && <span className="block text-center text-sm text-gray-600 mt-1">{alt}</span>}
    </span>
  );
};

const UserInfo = ({ userAge, setUserAge, userData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState(userAge || '');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAge = parseInt(age);
    if (numAge >= 1 && numAge <= 19) {
      setUserAge(numAge);
      setIsEditing(false);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Tuổi không hợp lệ',
        text: 'Vui lòng nhập tuổi từ 1-19',
        confirmButtonColor: '#36B37E'
      });
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BiUserCircle className="text-3xl text-mint-600 mr-2" style={{ color: '#36B37E' }} />
          <div>
            <h3 className="font-medium">{userData ? `Xin chào, ${userData.name}` : 'Thông tin học sinh'}</h3>
            {!isEditing ? (
              <p className="text-gray-600">Độ tuổi: {userAge || 'Chưa thiết lập'}</p>
            ) : null}
          </div>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-mint-600 hover:text-mint-700"
            style={{ color: '#36B37E' }}
          >
            Chỉnh sửa
          </button>
        ) : null}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex items-center">
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
            >
              <option value="">Chọn tuổi</option>
              {Array.from({ length: 19 }, (_, i) => i + 1).map(age => (
                <option key={age} value={age}>{age} tuổi</option>
              ))}
            </select>
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
              style={{ backgroundColor: '#36B37E' }}
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

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

// Component mới cho menu tài khoản
const UserMenu = ({ userData, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative ml-2">
      <button 
        onClick={toggleMenu}
        className="flex items-center text-sm font-medium text-gray-700 hover:text-mint-600 focus:outline-none"
      >
        <span className="hidden sm:block mr-1">{userData ? userData.name : 'Tài khoản'}</span>
        <BiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200"
          onBlur={() => setIsOpen(false)}
        >
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { conversationId } = useParams(); // Để lấy conversation_id từ URL nếu có

  // Thêm style vào document
  useEffect(() => {
    // Thêm style tag vào head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    // Cleanup khi component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Kiểm tra đăng nhập và lấy thông tin user
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    
    if (user && Object.keys(user).length > 0) {
      setUserData(user);
      
      // Nếu người dùng có tuổi, sử dụng làm tuổi mặc định
      if (user.age && !userAge) {
        setUserAge(parseInt(user.age));
      }

      // Lấy danh sách cuộc hội thoại nếu đã đăng nhập
      fetchConversations();
    } else if (!token) {
      // Không bắt buộc đăng nhập, nhưng hiển thị thông báo gợi ý
      Swal.fire({
        title: 'Chưa đăng nhập',
        text: 'Bạn chưa đăng nhập. Đăng nhập để lưu lịch sử trò chuyện và nhận nội dung phù hợp với lứa tuổi.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#36B37E',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đăng nhập',
        cancelButtonText: 'Tiếp tục dùng thử'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    }
  }, [navigate, userAge]);

  // Lấy danh sách cuộc hội thoại
  const fetchConversations = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoadingConversations(true);
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setConversations(response.data.conversations);
        
        // Nếu có conversationId từ URL, thiết lập nó làm cuộc hội thoại active
        if (conversationId) {
          setActiveConversation(response.data.conversations.find(c => c.id === conversationId) || null);
          // Nếu tìm thấy, lấy chi tiết cuộc hội thoại
          fetchConversationDetail(conversationId);
        } else if (response.data.conversations.length > 0) {
          // Nếu không có conversationId từ URL, lấy cuộc hội thoại mới nhất
          setActiveConversation(response.data.conversations[0]);
          fetchConversationDetail(response.data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách cuộc hội thoại:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Lấy chi tiết cuộc hội thoại
  const fetchConversationDetail = async (id) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || !id) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Cập nhật cuộc hội thoại đang hoạt động với dữ liệu đầy đủ
        setActiveConversation(response.data.conversation);
        
        // Cập nhật userAge nếu có age_context
        if (response.data.conversation.age_context && !userAge) {
          setUserAge(response.data.conversation.age_context);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết cuộc hội thoại:", error);
    }
  };

  useEffect(() => {
    if (activeConversation === null && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

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
        const updatedConversation = {...prev};
        
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
      // Lấy token từ localStorage hoặc sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Chuẩn bị dữ liệu gửi đi
      const requestData = { 
        message: messageContent,
        age: userAge
      };
      
      // Nếu đang trong một cuộc hội thoại, thêm conversation_id
      if (activeConversation && activeConversation.id) {
        requestData.conversation_id = activeConversation.id;
      }
      
      // Gọi API
      const response = await axios.post(
        `${API_BASE_URL}/chat`, 
        requestData,
        { 
          headers: token ? { 
            'Authorization': `Bearer ${token}` 
          } : {}
        }
      );
      
      if (response.data.success) {
        // Nếu có conversation_id mới được tạo, cập nhật state
        if (response.data.conversation_id && (!activeConversation?.id)) {
          // Tìm nạp chi tiết cuộc hội thoại mới
          fetchConversationDetail(response.data.conversation_id);
          // Làm mới danh sách cuộc hội thoại
          fetchConversations();
        } else if (activeConversation && activeConversation.id) {
          // Nếu đang trong cuộc hội thoại hiện có, làm mới nó
          fetchConversationDetail(activeConversation.id);
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
            const updatedConversation = {...prev};
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
          const updatedConversation = {...prev};
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
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      try {
        // Tạo cuộc hội thoại mới thông qua API
        const response = await axios.post(
          `${API_BASE_URL}/conversations`,
          { 
            title: 'Cuộc trò chuyện mới',
            age_context: userAge
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          // Làm mới danh sách cuộc hội thoại
          await fetchConversations();
          // Mở cuộc hội thoại mới
          fetchConversationDetail(response.data.conversation_id);
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
    } else {
      // Nếu chưa đăng nhập, tạo cuộc hội thoại mới tạm thời (chỉ trong session)
      setActiveConversation({
        id: null,
        title: 'Cuộc trò chuyện mới',
        messages: [],
        age_context: userAge
      });
    }
    
    // Focus vào input
    inputRef.current?.focus();
  };

  const deleteConversation = async (conversationId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

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
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            // Xóa khỏi state
            const updatedConversations = conversations.filter(c => c.id !== conversationId);
            setConversations(updatedConversations);
            
            // Nếu đang xem cuộc hội thoại bị xóa, chuyển sang cuộc hội thoại khác
            if (activeConversation && activeConversation.id === conversationId) {
              if (updatedConversations.length > 0) {
                setActiveConversation(updatedConversations[0]);
                fetchConversationDetail(updatedConversations[0].id);
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
        // Xóa token và thông tin người dùng
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
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
    // Có thể thêm logic tìm kiếm trên client hoặc gọi API tìm kiếm
  };

  // Lọc conversations dựa trên searchTerm
  const filteredConversations = conversations.filter(
    conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="flex h-screen bg-mint-50" style={{ backgroundColor: '#F7FFFA' }}>
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Trò chuyện</h2>
            <button 
              onClick={startNewConversation}
              className="p-2 bg-mint-600 text-white rounded-full hover:bg-mint-700 transition"
              style={{ backgroundColor: '#36B37E' }}
            >
              <BiPlus className="text-xl" />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              value={searchTerm}
              onChange={handleSearchConversations}
            />
            <BiSearch className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 pt-4">
          <UserInfo userAge={userAge} setUserAge={setUserAge} userData={userData} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="h-12 bg-gray-200 rounded-md"></div>
                <div className="h-12 bg-gray-200 rounded-md"></div>
                <div className="h-12 bg-gray-200 rounded-md"></div>
              </div>
              <p className="mt-4">Đang tải cuộc trò chuyện...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                onClick={() => {
                  if (activeConversation?.id !== conversation.id) {
                    fetchConversationDetail(conversation.id);
                  }
                }}
                className={`p-4 flex items-center justify-between cursor-pointer transition 
                  ${activeConversation?.id === conversation.id ? 'bg-mint-100' : 'hover:bg-gray-50'}`}
                style={{ backgroundColor: activeConversation?.id === conversation.id ? '#E6F7EF' : '' }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{conversation.title}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.last_message || 'Chưa có tin nhắn'}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition ml-2"
                >
                  <BiTrash />
                </button>
              </div>
            ))
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-500">
              Không tìm thấy cuộc trò chuyện phù hợp
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Chưa có cuộc trò chuyện nào. Bấm + để bắt đầu.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {activeConversation.title}
              </h2>
              <div className="flex items-center">
                {/* Thông tin tuổi hiện tại */}
                {userAge && (
                  <div className="mr-4 px-3 py-1 bg-mint-100 text-mint-700 rounded-full text-sm flex items-center">
                    <BiUserCircle className="mr-1" />
                    {userAge} tuổi
                  </div>
                )}
                
                {/* User Menu */}
                <UserMenu userData={userData} handleLogout={handleLogout} />
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6"
              style={{ 
                backgroundColor: '#F7FFFA', 
                backgroundImage: 'linear-gradient(to bottom, rgba(54, 179, 126, 0.05) 0%, rgba(54, 179, 126, 0.01) 100%)' 
              }}
            >
              {activeConversation.messages && activeConversation.messages.length > 0 ? (
                activeConversation.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div 
                      className={`max-w-[80%] p-5 rounded-2xl shadow-sm ${
                        message.role === 'user' 
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
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' 
                          ? 'text-mint-200' 
                          : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
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
                    <BiRocket className="mr-2 text-mint-600 animate-pulse" style={{ color: '#36B37E' }} />
                    <span className="text-gray-600">Đang soạn phản hồi...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form 
              onSubmit={handleSendMessage}
              className="p-6 bg-white border-t border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <button 
                  type="button" 
                  className="text-gray-500 hover:text-mint-600 transition"
                >
                  <BiPaperclip className="text-xl" />
                </button>
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
                  className={`p-3 rounded-lg text-white transition ${
                    isLoading 
                      ? 'bg-mint-400 cursor-not-allowed' 
                      : 'bg-mint-600 hover:bg-mint-700'
                  }`}
                  style={{ backgroundColor: isLoading ? '#A0D9C1' : '#36B37E' }}
                >
                  <BiSend />
                </button>
              </div>
              {!userAge && (
                <div className="mt-3 text-sm text-amber-600 flex items-center">
                  <BiInfoCircle className="mr-1" />
                  Bạn chưa thiết lập tuổi của học sinh. Vui lòng cập nhật thông tin để nhận câu trả lời phù hợp.
                </div>
              )}
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
  );
};

export default ChatPage;