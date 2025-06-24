import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiPlus, BiChat } from 'react-icons/bi';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Header, Sidebar } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';
import config from '../config';

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

  // State management
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentConversationAge, setCurrentConversationAge] = useState(null);

  // Refs để tracking state
  const loadedRef = useRef({
    conversationId: null,
    isLoadingDetail: false,
    conversationsLoaded: false
  });

  // Utility functions
  const canEditAge = useCallback(() => {
    return !activeConversation || activeConversation.messages?.length === 0;
  }, [activeConversation]);

  // Xử lý responsive
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

  // Kiểm tra auth
  useEffect(() => {
    if (!isLoading && !userData) {
      navigate('/login');
    }
  }, [isLoading, userData, navigate]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (userData && !isLoadingConversations && !loadedRef.current.conversationsLoaded) {
        console.log('Loading conversations for first time...');
        loadedRef.current.conversationsLoaded = true;
        const result = await fetchConversations(false);

        if (result.success) {
          console.log(`Loaded ${result.conversations.length} conversations`);
        } else {
          console.error('Failed to load conversations');
          loadedRef.current.conversationsLoaded = false;
        }
      }
    };

    loadConversations();
  }, [userData, fetchConversations, isLoadingConversations]);

  // Load conversation detail
  useEffect(() => {
    const loadConversationDetail = async () => {
      if (!userData || !conversationId) {
        loadedRef.current.conversationId = null;
        setCurrentConversationAge(null);
        return;
      }

      if (conversationId === loadedRef.current.conversationId || loadedRef.current.isLoadingDetail) {
        return;
      }

      console.log('Loading conversation detail for:', conversationId);
      loadedRef.current.isLoadingDetail = true;
      loadedRef.current.conversationId = conversationId;

      try {
        const conversation = await fetchConversationDetail(conversationId);
        // Force a small delay to ensure DOM is ready before scrolling
        if (conversation && conversation.messages?.length > 0) {
          setTimeout(() => {
            // Trigger a scroll by updating a timestamp or similar
            setCurrentConversationAge(conversation.age_context || userAge);
          }, 100);
        }
      } catch (error) {
        console.error('Error loading conversation detail:', error);
        loadedRef.current.conversationId = null;
      } finally {
        loadedRef.current.isLoadingDetail = false;
      }
    };

    loadConversationDetail();
  }, [userData, conversationId, fetchConversationDetail, userAge]);

  // Cập nhật age context
  useEffect(() => {
    if (activeConversation) {
      const conversationAge = activeConversation.age_context;
      console.log('Setting conversation age:', conversationAge, 'for conversation:', activeConversation.id);
      setCurrentConversationAge(conversationAge);
    }
  }, [activeConversation]);

  // Event handlers
  const handleAgeChange = useCallback(async () => {
    if (!canEditAge()) return;

    try {
      const result = await showAgePrompt(currentConversationAge || userAge);
      if (result.isConfirmed) {
        const newAge = result.value;
        setUserAge(newAge);
        setCurrentConversationAge(newAge);

        if (activeConversation && (!activeConversation.messages || activeConversation.messages.length === 0)) {
          try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            await fetch(`${config.apiBaseUrl}/conversations/${activeConversation.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ age_context: newAge })
            });

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

      console.log('Creating new conversation...');
      const conversation = await startNewConversation(ageToUse);

      if (conversation && conversation.id) {
        console.log('New conversation created:', conversation.id);
        loadedRef.current.conversationsLoaded = false;
        navigate(`/chat/${conversation.id}`);
        setCurrentConversationAge(ageToUse);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
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
        loadedRef.current.conversationsLoaded = false;
        await fetchConversations(true);

        if (id === activeConversation?.id) {
          navigate('/chat');
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  }, [showConfirm, deleteConversation, activeConversation?.id, navigate, fetchConversations]);

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
      console.log('Sending message...');
      const result = await sendMessage(message, activeConversation?.id);

      if (result.success) {
        console.log('Message sent successfully');
        loadedRef.current.conversationsLoaded = false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isAuthenticated, currentConversationAge, userAge, showAgePrompt, setUserAge, sendMessage, activeConversation?.id]);

  const handleRenameConversation = useCallback(async (id, currentTitle) => {
    try {
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
        console.log('Renaming conversation:', id, 'to:', result.value);
        await renameConversation(id, result.value);
        loadedRef.current.conversationsLoaded = false;
        await fetchConversations(true);
        console.log('Conversation renamed successfully');
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      showError('Không thể đổi tên cuộc trò chuyện');
    }
  }, [renameConversation, fetchConversations, showConfirm, showError]);

  const handleSwitchVersion = useCallback(async (messageId, conversationId, version) => {
    try {
      console.log('Switching version:', version, 'for message:', messageId);
      const result = await switchMessageVersion(messageId, conversationId, version);

      if (result.success) {
        loadedRef.current.conversationId = null;
        await fetchConversationDetail(conversationId);
        console.log('Version switched and conversation reloaded');
      }
    } catch (error) {
      console.error('Error switching version:', error);
    }
  }, [switchMessageVersion, fetchConversationDetail]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen transition-all duration-500 ${darkMode
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

  if (!userData) {
    return null;
  }

  return (
    <div className={`flex flex-col h-screen transition-all duration-500 ${darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
      }`}>
      {/* Header với backdrop blur */}
      <div className="relative z-10">
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
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar với glassmorphism effect */}
        <div className={`${isSidebarVisible ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
          } ${darkMode
            ? 'bg-black/20 backdrop-blur-xl border-white/10'
            : 'bg-white/30 backdrop-blur-xl border-white/50'
          } border-r flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${isMobile ? 'absolute inset-y-0 left-0 z-40' : 'relative'
          }`}>

          {/* Mobile close button */}
          {isMobile && isSidebarVisible && (
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsSidebarVisible(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
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

        {/* Mobile overlay */}
        {isMobile && isSidebarVisible && (
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300"
            onClick={() => setIsSidebarVisible(false)}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Kiểm tra xem có conversation ID không và có activeConversation không */}
          {conversationId && activeConversation ? (
            <>
              {/* Messages container - BỎ background gradient để không ảnh hưởng scroll */}
              <div className="flex-1 overflow-y-auto">
                {activeConversation.messages?.length > 0 ? (
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
                ) : (
                  // Empty conversation state
                  <div className={`h-full flex flex-col items-center justify-center p-8 ${darkMode
                      ? 'bg-gradient-to-b from-gray-800/30 to-gray-900/30'
                      : 'bg-gradient-to-b from-white/30 to-blue-50/30'
                    }`}>
                    <div className={`${darkMode
                        ? 'bg-white/5 backdrop-blur-xl border-white/10'
                        : 'bg-white/60 backdrop-blur-xl border-white/50'
                      } rounded-3xl p-12 border text-center max-w-md shadow-2xl transition-all duration-300`}>

                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${darkMode ? 'bg-white/10' : 'bg-white/80'
                        }`}>
                        <BiChat
                          className="text-4xl"
                          style={{ color: currentThemeConfig?.primary || '#36B37E' }}
                        />
                      </div>

                      <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                        Bắt đầu cuộc trò chuyện
                      </h3>

                      <p className={`text-lg mb-6 leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-600'
                        }`}>
                        Hãy nhập câu hỏi vào ô bên dưới để bắt đầu trò chuyện với Nutribot
                      </p>

                      {(currentConversationAge || userAge) && (
                        <div
                          className="px-6 py-3 rounded-full text-lg font-medium shadow-lg"
                          style={{
                            backgroundColor: currentThemeConfig?.light || '#E6F7EF',
                            color: currentThemeConfig?.primary || '#36B37E'
                          }}
                        >
                          Độ tuổi hiện tại: {currentConversationAge || userAge} tuổi
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input với glass effect */}
              <div className={`${darkMode
                  ? 'bg-black/20 backdrop-blur-xl border-white/10'
                  : 'bg-white/40 backdrop-blur-xl border-white/50'
                } border-t transition-all duration-300`}>
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={false}
                />
              </div>
            </>
          ) : (
            // No conversation selected state
            <div className={`flex-1 flex items-center justify-center flex-col p-8 ${darkMode ? 'text-gray-200' : 'text-gray-600'
              } ${darkMode
                ? 'bg-gradient-to-b from-gray-800/30 to-gray-900/30'
                : 'bg-gradient-to-b from-white/30 to-blue-50/30'
              }`}>
              <div className={`${darkMode
                  ? 'bg-white/5 backdrop-blur-xl border-white/10'
                  : 'bg-white/60 backdrop-blur-xl border-white/50'
                } rounded-3xl p-16 border text-center shadow-2xl transition-all duration-300`}>

                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg ${darkMode ? 'bg-white/10' : 'bg-white/80'
                  }`}>
                  <BiChat
                    className="text-6xl"
                    style={{ color: currentThemeConfig?.primary || '#36B37E' }}
                  />
                </div>

                <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                  Chọn cuộc trò chuyện
                </h2>

                <p className={`text-xl ${darkMode ? 'text-gray-200' : 'text-gray-600'
                  }`}>
                  Chọn một cuộc trò chuyện từ sidebar hoặc tạo mới để bắt đầu
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;