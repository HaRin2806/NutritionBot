import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiPlus, BiChat } from 'react-icons/bi';
import { useApp } from '../hooks/useContext';
import { Header, Sidebar } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';
import storageService from '../services/storageService';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    userData, isLoading, isAuthenticated,
    activeConversation, conversations, isLoadingConversations,
    userAge, setUserAge, fetchConversations, fetchConversationDetail,
    sendMessage, startNewConversation, deleteConversation, renameConversation,
    editMessage, switchMessageVersion, regenerateResponse, deleteMessageAndFollowing,
    showConfirm, showAgePrompt
  } = useApp();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentConversationAge, setCurrentConversationAge] = useState(null);

  // Track loaded states
  const loadedRef = useRef({
    conversations: false,
    conversationId: null,
    isLoadingDetail: false
  });

  const messagesEndRef = useRef(null);

  // Simple auth redirect
  useEffect(() => {
    if (!isLoading && !userData) {
      navigate('/login');
    }
  }, [isLoading, userData, navigate]);

  // Load conversations once when user is available
  useEffect(() => {
    if (userData && !loadedRef.current.conversations) {
      loadedRef.current.conversations = true;
      fetchConversations().catch(error => {
        console.error('Error loading conversations:', error);
        loadedRef.current.conversations = false;
      });
    }
  }, [userData, fetchConversations]);

  // SỬA: Load conversation detail khi conversationId thay đổi
  useEffect(() => {
    const loadConversationDetail = async () => {
      if (!userData) return;

      // Nếu không có conversationId, reset state
      if (!conversationId) {
        loadedRef.current.conversationId = null;
        setCurrentConversationAge(null);
        return;
      }

      // Nếu conversationId giống với đã load, skip
      if (conversationId === loadedRef.current.conversationId) {
        return;
      }

      // Nếu đang loading detail khác, skip
      if (loadedRef.current.isLoadingDetail) {
        return;
      }

      console.log('Loading conversation detail for:', conversationId);
      loadedRef.current.isLoadingDetail = true;
      loadedRef.current.conversationId = conversationId;

      try {
        await fetchConversationDetail(conversationId);
      } catch (error) {
        console.error('Error loading conversation detail:', error);
        // Reset nếu có lỗi
        loadedRef.current.conversationId = null;
      } finally {
        loadedRef.current.isLoadingDetail = false;
      }
    };

    loadConversationDetail();
  }, [userData, conversationId, fetchConversationDetail]);

  // Cập nhật age context khi activeConversation thay đổi
  useEffect(() => {
    if (activeConversation) {
      const conversationAge = activeConversation.age_context;
      console.log('Setting conversation age:', conversationAge, 'for conversation:', activeConversation.id);

      // CHỈ set currentConversationAge, KHÔNG set userAge để tránh re-render loop
      setCurrentConversationAge(conversationAge);

      // Chỉ cập nhật storage age nếu khác với age hiện tại
      const currentStoredAge = storageService.getUserAge();
      if (conversationAge && conversationAge !== currentStoredAge) {
        storageService.saveUserAge(conversationAge);
      }
    } else {
      setCurrentConversationAge(null);
    }
  }, [activeConversation]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (!newIsMobile) setIsSidebarVisible(true);
      else if (newIsMobile && isSidebarVisible) setIsSidebarVisible(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarVisible]);

  // Auto scroll
  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeConversation?.messages?.length]);

  // Kiểm tra xem có thể chỉnh sửa độ tuổi không
  const canEditAge = useCallback(() => {
    return !activeConversation || !activeConversation.messages || activeConversation.messages.length === 0;
  }, [activeConversation]);

  // Xử lý thay đổi độ tuổi
  const handleAgeChange = useCallback(async () => {
    if (!canEditAge()) {
      showConfirm({
        title: 'Không thể thay đổi độ tuổi',
        text: 'Bạn chỉ có thể thay đổi độ tuổi khi bắt đầu cuộc trò chuyện mới.',
        icon: 'info',
        showCancelButton: false,
        confirmButtonText: 'Đã hiểu'
      });
      return;
    }

    const result = await showAgePrompt(currentConversationAge || userAge);
    if (result.isConfirmed) {
      const newAge = result.value;
      setCurrentConversationAge(newAge);

      // Cập nhật global userAge và storage
      setUserAge(newAge);

      // Nếu có cuộc trò chuyện hiện tại nhưng chưa có tin nhắn, cập nhật age_context
      if (activeConversation && (!activeConversation.messages || activeConversation.messages.length === 0)) {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          await fetch(`http://localhost:5000/api/conversations/${activeConversation.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              age_context: newAge
            })
          });

          // Reload conversation detail để có dữ liệu mới
          loadedRef.current.conversationId = null; // Reset để force reload
          await fetchConversationDetail(activeConversation.id);
        } catch (error) {
          console.error('Error updating conversation age context:', error);
        }
      }
    }
  }, [canEditAge, currentConversationAge, userAge, showAgePrompt, showConfirm, setUserAge, activeConversation, fetchConversationDetail]);

  // Event handlers
  const handleNewConversation = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      let ageToUse = currentConversationAge || userAge;
      if (!ageToUse) {
        const result = await showAgePrompt();
        if (result.isConfirmed) {
          ageToUse = result.value;
          setUserAge(ageToUse);
          setCurrentConversationAge(ageToUse);
        } else {
          return;
        }
      }

      const result = await startNewConversation();
      if (result.success && isMobile) {
        setIsSidebarVisible(false);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, startNewConversation, isMobile]);

  // SỬA: Xử lý chọn conversation
  const handleSelectConversation = useCallback((id) => {
    console.log('Selecting conversation:', id, 'current active:', activeConversation?.id);

    if (id !== activeConversation?.id) {
      // Reset loading state trước khi navigate
      loadedRef.current.conversationId = null;
      loadedRef.current.isLoadingDetail = false;

      navigate(`/chat/${id}`);
    }
    if (isMobile) {
      setIsSidebarVisible(false);
    }
  }, [activeConversation?.id, navigate, isMobile]);

  const handleDeleteConversation = useCallback((id) => {
    showConfirm({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Hành động này không thể hoàn tác.',
      icon: 'warning'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteConversation(id);
          loadedRef.current.conversations = false;
        } catch (error) {
          console.error('Error deleting conversation:', error);
        }
      }
    });
  }, [showConfirm, deleteConversation]);

  const handleSendMessage = useCallback(async (message) => {
    if (!isAuthenticated()) return;

    let ageToUse = currentConversationAge || userAge;

    if (!ageToUse) {
      const result = await showAgePrompt();
      if (result.isConfirmed) {
        ageToUse = result.value;
        setUserAge(ageToUse);
        setCurrentConversationAge(ageToUse);
      } else {
        return;
      }
    }

    try {
      await sendMessage(message, activeConversation?.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, sendMessage, activeConversation?.id]);

  // Show loading only when explicitly loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-mint-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#36B37E', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user data (will be redirected)
  if (!userData) {
    return null;
  }

  console.log('Rendering ChatPage with:', {
    conversationId,
    activeConversationId: activeConversation?.id,
    messagesLength: activeConversation?.messages?.length,
    currentAge: currentConversationAge
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        userData={userData}
        userAge={currentConversationAge || userAge}
        setUserAge={handleAgeChange}
        canEditAge={canEditAge()}
        toggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        isMobile={isMobile}
        isSidebarVisible={isSidebarVisible}
        activeConversation={activeConversation}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`${isSidebarVisible ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} 
          bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 overflow-hidden 
          ${isMobile ? 'fixed inset-0 z-30' : 'relative'}`}>
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

        {/* Mobile overlay */}
        {isMobile && isSidebarVisible && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-30"
            onClick={() => setIsSidebarVisible(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="flex-1 overflow-y-auto"
                style={{ backgroundColor: '#F7FFFA' }}>
                {activeConversation.messages?.length > 0 ? (
                  <>
                    <MessageList
                      messages={activeConversation.messages}
                      isLoading={false}
                      onCreateNewChat={handleNewConversation}
                      onEditMessage={editMessage}
                      onSwitchVersion={switchMessageVersion}
                      onRegenerateResponse={regenerateResponse}
                      onDeleteMessage={deleteMessageAndFollowing}
                      conversationId={activeConversation.id}
                      userAge={currentConversationAge || userAge}
                    />
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <BiChat className="text-4xl mb-4 text-mint-500" style={{ color: '#36B37E' }} />
                    <p className="text-lg mb-2 text-gray-700">Bắt đầu cuộc trò chuyện mới</p>
                    <p className="text-gray-500 mb-4 text-center max-w-md px-4">
                      Hãy nhập câu hỏi vào ô bên dưới để bắt đầu trò chuyện với Nutribot
                    </p>
                    {(currentConversationAge || userAge) && (
                      <div className="mb-4 px-4 py-2 bg-mint-100 text-mint-700 rounded-full text-sm">
                        Độ tuổi hiện tại: {currentConversationAge || userAge} tuổi
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={false}
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