import React, { useState, useRef, useEffect } from 'react';
import { 
  BiSend, 
  BiPlus, 
  BiSearch, 
  BiDotsVerticalRounded, 
  BiTrash, 
  BiPaperclip,
  BiRocket,
  BiUserCircle,
  BiInfoCircle,
  BiLinkExternal
} from 'react-icons/bi';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatPage.css'; // Tạo file CSS riêng cho styling nâng cao

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

const UserInfo = ({ userAge, setUserAge }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState(userAge || '');

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
          <BiUserCircle className="text-3xl text-mint-600 mr-2" />
          <div>
            <h3 className="font-medium">Thông tin học sinh</h3>
            {!isEditing ? (
              <p className="text-gray-600">Độ tuổi: {userAge || 'Chưa thiết lập'}</p>
            ) : null}
          </div>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-mint-600 hover:text-mint-700"
          >
            Chỉnh sửa
          </button>
        ) : null}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex items-center">
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Nhập tuổi (1-19)"
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              min="1"
              max="19"
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
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
        <BiInfoCircle className="text-mint-600 mr-1" />
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

// Component chính
const ChatPage = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([
    { 
      id: 1, 
      title: 'Dinh dưỡng trẻ em', 
      messages: [
        { 
          id: 1, 
          sender: 'user', 
          content: 'Chế độ dinh dưỡng cho trẻ 3-5 tuổi như thế nào?', 
          timestamp: '10:30' 
        },
        { 
          id: 2, 
          sender: 'bot', 
          content: 'Trẻ 3-5 tuổi cần ăn đa dạng các nhóm thực phẩm để đảm bảo đủ dưỡng chất cho sự phát triển toàn diện.', 
          timestamp: '10:31',
          sources: [
            {
              id: 'bai1_muc3_2_3_3-5tuoi',
              title: 'Trẻ từ 3-5 tuổi: Nhu cầu năng lượng và các chất dinh dưỡng',
              content_type: 'text',
              pages: '21-23'
            }
          ]
        }
      ]
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeChat === null && chats.length > 0) {
      setActiveChat(chats[0].id);
    }
  }, [chats]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
  
    const currentChatIndex = chats.findIndex(chat => chat.id === activeChat);
    
    // Thêm tin nhắn người dùng
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  
    const updatedChats = [...chats];
    updatedChats[currentChatIndex].messages.push(userMessage);
    
    setChats(updatedChats);
    setNewMessage('');
    setIsLoading(true);
  
    try {
      // Gọi API với thông tin tuổi người dùng
      const response = await axios.post(`${API_BASE_URL}/chat`, { 
        message: newMessage,
        age: userAge // Gửi thông tin tuổi
      });
      
      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          content: response.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: response.data.sources || [],
          contexts: response.data.contexts || []
        };
  
        updatedChats[currentChatIndex].messages.push(botMessage);
        setChats(updatedChats);
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
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    const newChatId = Date.now();
    setChats([...chats, { 
      id: newChatId, 
      title: 'Cuộc trò chuyện mới', 
      messages: [] 
    }]);
    setActiveChat(newChatId);
    inputRef.current?.focus();
  };

  const deleteChat = (chatId) => {
    Swal.fire({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Bạn có chắc muốn xóa cuộc trò chuyện này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedChats = chats.filter(chat => chat.id !== chatId);
        setChats(updatedChats);
        setActiveChat(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
    });
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

  const activeCurrentChat = chats.find(chat => chat.id === activeChat);

  return (
    <div className="flex h-screen bg-mint-50" style={{ backgroundColor: '#F7FFFA' }}>
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Trò chuyện</h2>
            <button 
              onClick={startNewChat}
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
            />
            <BiSearch className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 pt-4">
          <UserInfo userAge={userAge} setUserAge={setUserAge} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`p-4 flex items-center justify-between cursor-pointer transition 
                ${activeChat === chat.id ? 'bg-mint-100' : 'hover:bg-gray-50'}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{chat.title}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {chat.messages.length > 0 
                    ? chat.messages[chat.messages.length - 1].content 
                    : 'Chưa có tin nhắn'}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="text-gray-400 hover:text-red-500 transition ml-2"
              >
                <BiTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeCurrentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {activeCurrentChat.title}
              </h2>
              <button className="text-gray-500 hover:text-mint-600 transition">
                <BiDotsVerticalRounded className="text-2xl" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6"
              style={{ 
                backgroundColor: '#F7FFFA', 
                backgroundImage: 'linear-gradient(to bottom, rgba(54, 179, 126, 0.05) 0%, rgba(54, 179, 126, 0.01) 100%)' 
              }}
            >
              {activeCurrentChat.messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div 
                    className={`max-w-[80%] p-5 rounded-2xl shadow-sm ${
                      message.sender === 'user' 
                        ? 'bg-mint-600 text-white' 
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                    style={{ 
                      backgroundColor: message.sender === 'user' 
                        ? '#36B37E' 
                        : '#FFFFFF' 
                    }}
                  >
                    {message.sender === 'user' ? (
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
                      message.sender === 'user' 
                        ? 'text-mint-200' 
                        : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center">
                    <BiRocket className="mr-2 text-mint-600 animate-pulse" />
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
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;