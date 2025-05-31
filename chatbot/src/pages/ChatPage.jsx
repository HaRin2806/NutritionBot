import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiPlus, BiChat } from 'react-icons/bi';
import { useApp } from '../hooks/useContext';
import { Header, Sidebar } from '../components/layout';
import { MessageList, ChatInput } from '../components/chat';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    // Auth - ✅ SỬA: Dùng đúng tên functions
    userData, isLoading: isLoadingAuth, isAuthenticated, showLoginRequired,
    
    // Chat
    activeConversation, conversations, isLoading, isLoadingConversations,
    userAge, setUserAge, fetchConversations, fetchConversationDetail,
    sendMessage, startNewConversation, deleteConversation, renameConversation,
    editMessage, switchMessageVersion, regenerateResponse, deleteMessageAndFollowing,
    
    // Toast
    showConfirm
  } = useApp();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);

  // ✅ SỬA: Auth check logic đúng
  useEffect(() => {
    console.log('🔍 ChatPage auth check:', { userData, isLoadingAuth, isAuthenticated: isAuthenticated() }); // DEBUG
    
    // CHỈ check khi đã load xong auth
    if (!isLoadingAuth) {
      if (!isAuthenticated()) {
        console.log('❌ Not authenticated, showing login required'); // DEBUG
        showLoginRequired(() => navigate('/login'));
      } else {
        console.log('✅ User authenticated:', userData?.name); // DEBUG
      }
    }
  }, [userData, isLoadingAuth, isAuthenticated, showLoginRequired, navigate]);

  // Responsive
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

  // ✅ SỬA: Load data chỉ khi đã authenticated
  useEffect(() => {
    if (userData && !isLoadingAuth && isAuthenticated()) {
      fetchConversations();
    }
  }, [userData, isLoadingAuth, isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (conversationId && userData && !isLoadingAuth && isAuthenticated()) {
      fetchConversationDetail(conversationId);
    }
  }, [conversationId, userData, isLoadingAuth, isAuthenticated, fetchConversationDetail]);

  // Auto scroll
  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeConversation?.messages]);

  // ✅ SỬA: Handlers với proper error handling
  const handleNewConversation = async () => {
    if (!isAuthenticated()) {
      showLoginRequired(() => navigate('/login'));
      return;
    }

    try {
      const result = await startNewConversation();
      if (result.success && isMobile) setIsSidebarVisible(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    if (id !== activeConversation?.id) {
      navigate(`/chat/${id}`);
    }
    if (isMobile) setIsSidebarVisible(false);
  };

  const handleDeleteConversation = (id) => {
    showConfirm({
      title: 'Xóa cuộc trò chuyện?',
      text: 'Hành động này không thể hoàn tác.',
      icon: 'warning'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteConversation(id);
        } catch (error) {
          console.error('Error deleting conversation:', error);
        }
      }
    });
  };

  // ✅ SỬA: Send message với proper auth check
  const handleSendMessage = async (message) => {
    if (!isAuthenticated()) {
      showLoginRequired(() => navigate('/login'));
      return;
    }

    try {
      await sendMessage(message, activeConversation?.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // ✅ SỬA: Loading state cho auth
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-mint-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: '#36B37E', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
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

        {/* Overlay */}
        {isMobile && isSidebarVisible && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-30"
            onClick={() => setIsSidebarVisible(false)}
          />
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="flex-1 overflow-y-auto" 
                   style={{ backgroundColor: '#F7FFFA' }}>
                {activeConversation.messages?.length > 0 ? (
                  <>
                    <MessageList
                      messages={activeConversation.messages}
                      isLoading={isLoading} // ✅ SỬA: Pass isLoading để hiển thị typing indicator
                      onCreateNewChat={handleNewConversation}
                      onEditMessage={editMessage}
                      onSwitchVersion={switchMessageVersion}
                      onRegenerateResponse={regenerateResponse}
                      onDeleteMessage={deleteMessageAndFollowing}
                      conversationId={activeConversation.id}
                      userAge={userAge}
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
                  </div>
                )}
              </div>
              
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
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