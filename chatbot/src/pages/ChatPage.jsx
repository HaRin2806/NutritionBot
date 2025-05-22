import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiPlus, BiChat } from 'react-icons/bi';
import useChat from '../hooks/useChat';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { Header, Sidebar } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';
import '../styles/chat.css';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fetchingRef = useRef(false);
  const detailFetchedRef = useRef(false);
  
  const { 
    activeConversation,
    conversations,
    isLoading,
    isLoadingConversations,
    userAge,
    setUserAge,
    fetchConversations,
    fetchConversationDetail,
    sendMessage,
    startNewConversation,
    deleteConversation,
    renameConversation,
    updateUserAge,
    promptUserForAge
  } = useChat();
  
  const { userData, isLoading: isLoadingAuth } = useAuth();
  const { showLoginRequired, showConfirm } = useToast();
  
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isLoadingAuth && !userData) {
      showLoginRequired(() => navigate('/login'));
    }
  }, [userData, isLoadingAuth, navigate, showLoginRequired]);

  // Phát hiện kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (!newIsMobile) {
        setIsSidebarVisible(true);
      } else if (newIsMobile && isSidebarVisible) {
        setIsSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarVisible]);

  // Chỉ lấy danh sách cuộc hội thoại 1 lần khi component mount
  useEffect(() => {
    if (userData && !isLoadingAuth && !fetchingRef.current) {
      fetchingRef.current = true;
      fetchConversations();
    }
  }, [userData, isLoadingAuth, fetchConversations]);

  // Lấy chi tiết cuộc hội thoại khi ID thay đổi (không phụ thuộc vào activeConversation)
  useEffect(() => {
    const loadConversationDetails = async () => {
      if (conversationId && userData && !isLoadingAuth && !detailFetchedRef.current) {
        detailFetchedRef.current = true;
        await fetchConversationDetail(conversationId);
      }
    };
    
    loadConversationDetails();
    
    // Reset flag khi conversation ID thay đổi
    return () => {
      detailFetchedRef.current = false;
    };
  }, [conversationId, userData, isLoadingAuth, fetchConversationDetail]);

  // Cuộn xuống dưới khi có tin nhắn mới
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Scroll xuống mỗi khi messages thay đổi
  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [activeConversation?.messages, scrollToBottom]);

  // Toggle sidebar (cho responsive)
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (message) => {
    await sendMessage(message, activeConversation?.id);
  };

  // Xử lý tạo cuộc hội thoại mới
  const handleNewConversation = async () => {
    if (!userData) {
      showLoginRequired(() => navigate('/login'));
      return;
    }
    
    if (!userAge) {
      promptUserForAge();
      return;
    }
    
    const result = await startNewConversation();
    
    if (result.success) {
      if (isMobile) {
        setIsSidebarVisible(false);
      }
    }
  };

  // Xử lý chọn cuộc hội thoại
  const handleSelectConversation = (id) => {
    if (id !== activeConversation?.id) {
      // Reset flag khi chọn conversation mới
      detailFetchedRef.current = false;
      navigate(`/chat/${id}`);
    }
    
    if (isMobile) {
      setIsSidebarVisible(false);
    }
  };

  // Xử lý xóa cuộc hội thoại
  const handleDeleteConversation = (id) => {
    showConfirm({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      icon: 'warning'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteConversation(id);
      }
    });
  };

  // Hiển thị loading nếu đang xác thực
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        isSidebarVisible={isSidebarVisible}
        activeConversation={activeConversation}
        updateConversationAge={updateUserAge}
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
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            onCreateNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={renameConversation}
            isLoading={isLoadingConversations}
            isMobile={isMobile}
            onCloseSidebar={() => setIsSidebarVisible(false)}
          />
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
                className="flex-1 overflow-y-auto"
                style={{
                  backgroundColor: '#F7FFFA',
                  backgroundImage: 'linear-gradient(to bottom, rgba(54, 179, 126, 0.05) 0%, rgba(54, 179, 126, 0.01) 100%)'
                }}
              >
                {activeConversation.messages && activeConversation.messages.length > 0 ? (
                  <>
                    <MessageList
                      messages={activeConversation.messages}
                      isLoading={isLoading}
                      onCreateNewChat={handleNewConversation}
                    />
                    <div ref={messagesEndRef} style={{ float: "left", clear: "both", height: "1px" }} />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <BiChat className="text-4xl mb-4 text-mint-500" style={{ color: '#36B37E' }} />
                    <p className="text-lg mb-2 text-gray-700">Bắt đầu cuộc trò chuyện mới</p>
                    <p className="text-gray-500 mb-4 text-center max-w-md px-4">
                      Hãy nhập câu hỏi vào ô bên dưới để bắt đầu trò chuyện với Nutribot
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
              <BiChat className="text-7xl mb-6" style={{ color: '#36B37E' }} />
              <p className="text-xl mb-4">Chưa có cuộc trò chuyện nào</p>
              <button
                onClick={handleNewConversation}
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