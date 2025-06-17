import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiPlus, BiChat } from 'react-icons/bi';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Header, Sidebar } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { theme, darkMode, currentThemeConfig } = useTheme();

  const {
    userData, isLoading, isAuthenticated,
    activeConversation, conversations, isLoadingConversations,
    userAge, setUserAge,
    fetchConversations, fetchConversationDetail, sendMessage, startNewConversation,
    deleteConversation, renameConversation, editMessage,
    switchMessageVersion, regenerateResponse, deleteMessageAndFollowing,
    showConfirm, showAgePrompt, showError
    
  } = useApp();

  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentConversationAge, setCurrentConversationAge] = useState(null);

  const loadedRef = useRef({
    conversationId: null,
    isLoadingDetail: false,
    conversationsLoaded: false // ✅ THÊM: Track việc đã load conversations chưa
  });

  const messagesEndRef = useRef(null);

  // Define canEditAge
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

  // ✅ SỬA: Load conversations với logic tốt hơn
  useEffect(() => {
    const loadConversations = async () => {
      if (userData && !isLoadingConversations && !loadedRef.current.conversationsLoaded) {
        console.log('🔄 ChatPage: Loading conversations for first time...');

        loadedRef.current.conversationsLoaded = true;
        const result = await fetchConversations(false); // false = không force, để context tự quyết định

        if (result.success) {
          console.log(`✅ ChatPage: Loaded ${result.conversations.length} conversations`);
        } else {
          console.error('❌ ChatPage: Failed to load conversations');
          loadedRef.current.conversationsLoaded = false; // Reset on failure
        }
      }
    };

    loadConversations();
  }, [userData, fetchConversations, isLoadingConversations]);

  // Load conversation detail when conversationId changes
  useEffect(() => {
    const loadConversationDetail = async () => {
      if (!userData) return;

      if (!conversationId) {
        loadedRef.current.conversationId = null;
        setCurrentConversationAge(null);
        return;
      }

      if (conversationId === loadedRef.current.conversationId) {
        return;
      }

      if (loadedRef.current.isLoadingDetail) {
        return;
      }

      console.log('🔄 Loading conversation detail for:', conversationId);
      loadedRef.current.isLoadingDetail = true;
      loadedRef.current.conversationId = conversationId;

      try {
        await fetchConversationDetail(conversationId);
      } catch (error) {
        console.error('❌ Error loading conversation detail:', error);
        loadedRef.current.conversationId = null;
      } finally {
        loadedRef.current.isLoadingDetail = false;
      }
    };

    loadConversationDetail();
  }, [userData, conversationId, fetchConversationDetail]);

  // Update age context when activeConversation changes
  useEffect(() => {
    if (activeConversation) {
      const conversationAge = activeConversation.age_context;
      console.log('📝 Setting conversation age:', conversationAge, 'for conversation:', activeConversation.id);
      setCurrentConversationAge(conversationAge);
    }
  }, [activeConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleAgeChange = useCallback(async () => {
    if (!canEditAge()) {
      return;
    }

    try {
      const result = await showAgePrompt(currentConversationAge || userAge);
      if (result.isConfirmed) {
        const newAge = result.value;
        setUserAge(newAge);
        setCurrentConversationAge(newAge);

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

            loadedRef.current.conversationId = null;
            await fetchConversationDetail(activeConversation.id);
          } catch (error) {
            console.error('❌ Error updating conversation age context:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error changing age:', error);
    }
  }, [canEditAge, currentConversationAge, userAge, showAgePrompt, setUserAge, activeConversation, fetchConversationDetail]);

  // ✅ SỬA: Cải thiện handleNewConversation
  const handleNewConversation = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      let ageToUse = currentConversationAge || userAge;

      if (!ageToUse) {
        const result = await showAgePrompt();
        if (result.isConfirmed) {
          ageToUse = result.value;
          setUserAge(ageToUse);
        } else {
          return;
        }
      }

      console.log('🔄 ChatPage: Creating new conversation...');
      const conversation = await startNewConversation(ageToUse);

      if (conversation && conversation.id) {
        console.log('✅ ChatPage: New conversation created:', conversation.id);

        // ✅ SỬA: Reset conversations loaded flag để force reload sidebar
        loadedRef.current.conversationsLoaded = false;

        navigate(`/chat/${conversation.id}`);
        setCurrentConversationAge(ageToUse);
      }
    } catch (error) {
      console.error('❌ ChatPage: Error creating conversation:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, startNewConversation, navigate]);

  const handleDeleteConversation = useCallback(async (id) => {
    const result = await showConfirm({
      title: 'Xóa cuộc hội thoại',
      text: 'Hành động này không thể hoàn tác.',
      icon: 'warning'
    });

    if (result.isConfirmed) {
      try {
        await deleteConversation(id);

        // ✅ SỬA: Reset flag để force reload conversations
        loadedRef.current.conversationsLoaded = false;
        await fetchConversations(true);

        if (id === activeConversation?.id) {
          navigate('/chat');
        }
      } catch (error) {
        console.error('❌ Error deleting conversation:', error);
      }
    }
  }, [showConfirm, deleteConversation, activeConversation?.id, navigate, fetchConversations]);

  // ✅ SỬA: Cải thiện handleSendMessage
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
      console.log('🔄 ChatPage: Sending message...');
      const result = await sendMessage(message, activeConversation?.id);

      if (result.success) {
        console.log('✅ ChatPage: Message sent successfully');
        // ✅ SỬA: Reset flag để đảm bảo sidebar được update
        loadedRef.current.conversationsLoaded = false;
      }
    } catch (error) {
      console.error('❌ ChatPage: Error sending message:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, sendMessage, activeConversation?.id]);

  const handleRenameConversation = useCallback(async (id, currentTitle) => {
    try {
      // Hiển thị prompt để nhập tên mới
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
        console.log('🔄 ChatPage: Renaming conversation:', id, 'to:', result.value);

        await renameConversation(id, result.value);

        // Force reload conversations để update sidebar và đồng bộ với HistoryPage
        loadedRef.current.conversationsLoaded = false;
        await fetchConversations(true);

        console.log('✅ ChatPage: Conversation renamed successfully');
      }
    } catch (error) {
      console.error('❌ ChatPage: Error renaming conversation:', error);
      showError('Không thể đổi tên cuộc trò chuyện');
    }
  }, [renameConversation, fetchConversations, showConfirm, showError]);

  // Enhanced switch version handler
  const handleSwitchVersion = useCallback(async (messageId, conversationId, version) => {
    try {
      console.log('🔄 Switching version:', version, 'for message:', messageId);
      const result = await switchMessageVersion(messageId, conversationId, version);

      if (result.success) {
        // Force reload conversation detail to get updated state
        loadedRef.current.conversationId = null;
        await fetchConversationDetail(conversationId);
        console.log('✅ Version switched and conversation reloaded');
      }
    } catch (error) {
      console.error('❌ Error switching version:', error);
    }
  }, [switchMessageVersion, fetchConversationDetail]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
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

  if (!userData) {
    return null;
  }

  console.log('📊 ChatPage render:', {
    conversationId,
    activeConversationId: activeConversation?.id,
    messagesLength: activeConversation?.messages?.length,
    currentAge: currentConversationAge,
    conversationsLength: conversations?.length || 0,
    isLoadingConversations,
    conversationsLoaded: loadedRef.current.conversationsLoaded
  });

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
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
        <div className={`${isSidebarVisible ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} 
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
          border-r flex flex-col shadow-lg transition-all duration-300 overflow-hidden 
          ${isMobile ? 'absolute inset-y-0 left-0 z-40' : 'relative'}`}>

          {isMobile && isSidebarVisible && (
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsSidebarVisible(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                <BiPlus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          )}

          <Sidebar
            conversations={conversations}
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

        {isMobile && isSidebarVisible && (
          <div
            className="absolute inset-0 bg-black bg-opacity-20 z-30"
            onClick={() => setIsSidebarVisible(false)}
          />
        )}

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
                      onSwitchVersion={handleSwitchVersion}
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
            <div className={`flex-1 flex items-center justify-center flex-col ${darkMode ? 'text-gray-400' : 'text-gray-500'
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