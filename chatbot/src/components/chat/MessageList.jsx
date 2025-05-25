import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { Loader } from '../common';
import { BiRocket } from 'react-icons/bi';

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

  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <BiRocket className="text-5xl mb-4" style={{ color: '#36B37E' }} />
        <p className="text-lg mb-2">Bắt đầu cuộc trò chuyện mới</p>
        <p className="text-sm text-center max-w-md mb-4">
          Hãy đặt câu hỏi về dinh dưỡng và an toàn thực phẩm để tôi có thể giúp bạn
        </p>
        {onCreateNewChat && (
          <button
            onClick={onCreateNewChat}
            className="px-4 py-2 bg-mint-600 text-white rounded-md hover:bg-mint-700 transition flex items-center shadow-sm"
            style={{ backgroundColor: '#36B37E' }}
          >
            <BiRocket className="mr-2" />
            Bắt đầu trò chuyện
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4">
      {/* Danh sách tin nhắn */}
      {messages.map((message, index) => {
        const messageId = getMessageId(message);

        // Kiểm tra xem message này có đang regenerating không
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
          <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Loader type="dots" color="mint" text="Đang soạn phản hồi..." />
          </div>
        </div>
      )}

      {/* Ref để cuộn xuống dưới */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;