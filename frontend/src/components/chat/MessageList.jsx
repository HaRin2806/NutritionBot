import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { Loader } from '../common';
import { BiRocket } from 'react-icons/bi';
import { useTheme } from '../../contexts/ThemeContext';

const MessageList = ({
  messages,
  isLoading,
  onCreateNewChat,
  onEditMessage,
  onSwitchVersion,
  onRegenerateResponse,
  onDeleteMessage,
  conversationId,
  userAge
}) => {
  const messagesEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState(null);
  const [shouldScroll, setShouldScroll] = useState(true);
  const { darkMode, currentThemeConfig } = useTheme();

  // Track if user has manually scrolled up
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when messages change or conversation loads
  useLayoutEffect(() => {
    const scrollToBottom = () => {
      if (!messagesEndRef.current || !shouldScroll) return;
      
      // Use longer timeout for page reload scenarios
      const timeout = messages?.length > 0 ? 300 : 100;
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }
      }, timeout);
    };

    scrollToBottom();
  }, [messages, isLoading, conversationId, shouldScroll]);

  // Force scroll when conversation changes (for page reload)
  useEffect(() => {
    if (conversationId && messages?.length > 0) {
      setShouldScroll(true);
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto', // Use 'auto' for immediate scroll on conversation change
            block: 'end'
          });
        }
      }, 500); // Longer timeout for conversation load
    }
  }, [conversationId]);

  // Handle edit message
  const handleEditMessage = async (messageId, conversationId, newContent) => {
    try {
      await onEditMessage(messageId, conversationId, newContent);
      setEditingMessageId(null);
    } catch (error) {
      console.error('Error in MessageList handleEditMessage:', error);
      throw error;
    }
  };

  // Handle switch version
  const handleSwitchVersion = async (messageId, conversationId, version) => {
    try {
      await onSwitchVersion(messageId, conversationId, version);
    } catch (error) {
      console.error('Error in MessageList handleSwitchVersion:', error);
      throw error;
    }
  };

  // Handle regenerate response
  const handleRegenerateResponse = async (messageId, conversationId, userAge) => {
    try {
      setRegeneratingMessageId(messageId);
      await onRegenerateResponse(messageId, conversationId, userAge);
    } catch (error) {
      console.error('Error in MessageList handleRegenerateResponse:', error);
      throw error;
    } finally {
      setRegeneratingMessageId(null);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId, conversationId) => {
    try {
      await onDeleteMessage(messageId, conversationId);
    } catch (error) {
      console.error('Error in MessageList handleDeleteMessage:', error);
      throw error;
    }
  };

  // Helper function to get message ID
  const getMessageId = (message) => {
    return message._id || message.id;
  };

  // Nếu không có tin nhắn nào
  if (!messages || messages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${
        darkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <div className={`${
          darkMode 
            ? 'bg-white/5 backdrop-blur-xl border-white/10' 
            : 'bg-white/60 backdrop-blur-xl border-white/50'
        } rounded-3xl p-12 border text-center shadow-2xl transition-all duration-300`}>
          
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
            darkMode ? 'bg-white/10' : 'bg-white/80'
          }`}>
            <BiRocket 
              className="text-4xl" 
              style={{ color: currentThemeConfig?.primary || '#36B37E' }} 
            />
          </div>

          <h3 className={`text-2xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Bắt đầu cuộc trò chuyện mới
          </h3>

          <p className={`text-lg mb-6 leading-relaxed max-w-md ${
            darkMode ? 'text-gray-200' : 'text-gray-600'
          }`}>
            Hãy đặt câu hỏi về dinh dưỡng và an toàn thực phẩm để tôi có thể giúp bạn
          </p>

          {onCreateNewChat && (
            <button
              onClick={onCreateNewChat}
              className="px-6 py-3 text-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center font-medium shadow-lg"
              style={{ backgroundColor: currentThemeConfig?.primary || '#36B37E' }}
            >
              <BiRocket className="mr-2" />
              Bắt đầu trò chuyện
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col space-y-6 p-6 max-w-4xl mx-auto">
      {/* Danh sách tin nhắn */}
      {messages.map((message, index) => {
        const messageId = getMessageId(message);
        const isRegenerating = message.isRegenerating || false;

        return (
          <MessageBubble
            key={messageId}
            message={message}
            isUser={message.role === 'user'}
            onEditMessage={handleEditMessage}
            onSwitchVersion={handleSwitchVersion}
            onRegenerateResponse={handleRegenerateResponse}
            onDeleteMessage={handleDeleteMessage}
            conversationId={conversationId}
            userAge={userAge}
            isEditing={editingMessageId === messageId}
            onEditStart={(messageId) => setEditingMessageId(messageId)}
            onEditEnd={() => setEditingMessageId(null)}
            isRegenerating={isRegenerating}
          />
        );
      })}

      {/* Hiển thị loading khi đang gửi tin nhắn */}
      {isLoading && (
        <div className="flex justify-start">
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            darkMode 
              ? 'bg-white/10 backdrop-blur-sm border-white/20' 
              : 'bg-white/80 backdrop-blur-sm border-white/50'
          } shadow-lg`}>
            <Loader 
              type="dots" 
              color={currentThemeConfig?.primary || '#36B37E'} 
              text="Đang soạn phản hồi..." 
            />
          </div>
        </div>
      )}
      
      {/* Ref để cuộn xuống dưới - đặt ở cuối cùng */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;