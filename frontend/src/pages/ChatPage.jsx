import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiPlus, BiChat } from 'react-icons/bi';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Header, Sidebar } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';
import { chatService } from '../services';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { theme, darkMode, currentThemeConfig } = useTheme();
  
  const {
    userData, isLoading, isAuthenticated,
    activeConversation, userAge, setUserAge,
    fetchConversationDetail, sendMessage, startNewConversation,
    deleteConversation, renameConversation, editMessage,
    switchMessageVersion, regenerateResponse, deleteMessageAndFollowing,
    showConfirm, showAgePrompt
  } = useApp();

  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentConversationAge, setCurrentConversationAge] = useState(null);

  // SỬA: Sử dụng local state cho conversations thay vì từ context
  const [localConversations, setLocalConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // SỬA: Đơn giản hóa tracking state
  const loadedRef = useRef({
    conversations: false,
    conversationId: null,
    isLoadingDetail: false
  });

  const messagesEndRef = useRef(null);

  // Define canEditAge FIRST
  const canEditAge = useCallback(() => {
    return !activeConversation || activeConversation.messages?.length === 0;
  }, [activeConversation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (!newIsMobile) {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple auth redirect
  useEffect(() => {
    if (!isLoading && !userData) {
      navigate('/login');
    }
  }, [isLoading, userData, navigate]);

  // SỬA: Load conversations trực tiếp từ API một lần duy nhất
  useEffect(() => {
    const loadConversations = async () => {
      if (userData && !loadedRef.current.conversations) {
        try {
          loadedRef.current.conversations = true;
          setIsLoadingConversations(true);
          
          console.log('🔄 ChatPage: Loading conversations directly from API...');
          
          // SỬA: Gọi trực tiếp chatService thay vì qua context
          const response = await chatService.getConversations();
          
          if (response.success) {
            setLocalConversations(response.conversations || []);
            console.log('✅ Loaded conversations:', response.conversations?.length || 0);
          } else {
            setLocalConversations([]);
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
          setLocalConversations([]);
          loadedRef.current.conversations = false; // Reset on error
        } finally {
          setIsLoadingConversations(false);
        }
      }
    };

    loadConversations();
  }, [userData]); // SỬA: Chỉ dependency userData

  // Load conversation detail khi conversationId thay đổi
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

      console.log('🔄 Loading conversation detail for:', conversationId);
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
      setCurrentConversationAge(conversationAge);
    }
  }, [activeConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // SỬA: Helper function để reload conversations
  const reloadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await chatService.getConversations();
      if (response.success) {
        setLocalConversations(response.conversations || []);
        console.log('✅ Reloaded conversations:', response.conversations?.length || 0);
      }
    } catch (error) {
      console.error('Error reloading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleAgeChange = useCallback(async () => {
    // Nếu không thể edit age (có tin nhắn), return
    if (!canEditAge()) {
      return;
    }

    try {
      const result = await showAgePrompt(currentConversationAge || userAge);
      if (result.isConfirmed) {
        const newAge = result.value;
        setUserAge(newAge);
        setCurrentConversationAge(newAge);

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
            loadedRef.current.conversationId = null;
            await fetchConversationDetail(activeConversation.id);
          } catch (error) {
            console.error('Error updating conversation age context:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error changing age:', error);
    }
  }, [canEditAge, currentConversationAge, userAge, showAgePrompt, setUserAge, activeConversation, fetchConversationDetail]);

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      // Sử dụng tuổi hiện tại nếu có, không thì mới hỏi
      let ageToUse = currentConversationAge || userAge;
      
      // Chỉ hỏi tuổi nếu chưa có tuổi nào
      if (!ageToUse) {
        const result = await showAgePrompt();
        if (result.isConfirmed) {
          ageToUse = result.value;
          setUserAge(ageToUse);
        } else {
          return;
        }
      }

      const conversation = await startNewConversation(ageToUse);
      if (conversation) {
        // SỬA: Reload local conversations
        await reloadConversations();
        navigate(`/chat/${conversation.id}`);
        setCurrentConversationAge(ageToUse);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, startNewConversation, navigate]);

  const handleDeleteConversation = useCallback(async (id) => {
    await showConfirm({
      title: 'Xóa cuộc hội thoại',
      text: 'Hành động này không thể hoàn tác.',
      icon: 'warning'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteConversation(id);
          // SỬA: Reload local conversations
          await reloadConversations();
          if (id === activeConversation?.id) {
            navigate('/chat');
          }
        } catch (error) {
          console.error('Error deleting conversation:', error);
        }
      }
    });
  }, [showConfirm, deleteConversation, activeConversation?.id, navigate]);

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
      const result = await sendMessage(message, activeConversation?.id);
      if (result.success) {
        // SỬA: Reload local conversations sau khi gửi tin nhắn
        await reloadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, sendMessage, activeConversation?.id]);

  const handleRenameConversation = useCallback(async (id, newTitle) => {
    try {
      await renameConversation(id, newTitle);
      // SỬA: Update local conversations
      setLocalConversations(prev =>
        prev.map(conv =>
          conv.id === id ? { ...conv, title: newTitle } : conv
        )
      );
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  }, [renameConversation]);

  // Show loading only when explicitly loading
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div 
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ 
              borderColor: currentThemeConfig?.primary || '#36B37E', 
              borderTopColor: 'transparent' 
            }}
          />
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user data (will be redirected)
  if (!userData) {
    return null;
  }

  console.log('📱 ChatPage render:', {
    conversationId,
    activeConversationId: activeConversation?.id,
    messagesLength: activeConversation?.messages?.length,
    currentAge: currentConversationAge,
    localConversationsLength: localConversations?.length || 0,
    loadedRef: loadedRef.current
  });

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
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
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
          border-r flex flex-col shadow-lg transition-all duration-300 overflow-hidden 
          ${isMobile ? 'absolute inset-y-0 left-0 z-40' : 'relative'}`}>
          
          {/* Mobile close button */}
          {isMobile && isSidebarVisible && (
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsSidebarVisible(false)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <BiPlus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          )}

          <Sidebar
            conversations={localConversations}
            activeConversation={activeConversation}
            isLoading={isLoadingConversations}
            onNewConversation={handleNewConversation}
            onSelectConversation={(id) => navigate(`/chat/${id}`)}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            isMobile={isMobile}
            onCloseSidebar={() => setIsSidebarVisible(false)}
          />
        </div>

        {/* Mobile overlay */}
        {isMobile && isSidebarVisible && (
          <div
            className="absolute inset-0 bg-black bg-opacity-20 z-30"
            onClick={() => setIsSidebarVisible(false)}
          />
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {activeConversation ? (
            <>
              <div 
                className="flex-1 overflow-y-auto transition-colors duration-300"
                style={{ 
                  backgroundColor: darkMode ? '#1f2937' : (currentThemeConfig?.light || '#F7FFFA')
                }}
              >
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
                    <BiChat 
                      className="text-4xl mb-4" 
                      style={{ color: currentThemeConfig?.primary || '#36B37E' }} 
                    />
                    <p className={`text-lg mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bắt đầu cuộc trò chuyện mới
                    </p>
                    <p className={`mb-4 text-center max-w-md px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Hãy nhập câu hỏi vào ô bên dưới để bắt đầu trò chuyện với Nutribot
                    </p>
                    {(currentConversationAge || userAge) && (
                      <div 
                        className="mb-4 px-4 py-2 rounded-full text-sm"
                        style={{ 
                          backgroundColor: currentThemeConfig?.light || '#E6F7EF',
                          color: currentThemeConfig?.primary || '#36B37E'
                        }}
                      >
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
            <div className={`flex-1 flex items-center justify-center flex-col ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <BiChat 
                className="text-7xl mb-6" 
                style={{ color: currentThemeConfig?.primary || '#36B37E' }} 
              />
              <p className={`text-xl mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Chưa có cuộc trò chuyện nào
              </p>
              <button
                onClick={handleNewConversation}
                className="px-6 py-3 text-white rounded-lg transition-colors hover:opacity-90 flex items-center"
                style={{ backgroundColor: currentThemeConfig?.primary || '#36B37E' }}
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