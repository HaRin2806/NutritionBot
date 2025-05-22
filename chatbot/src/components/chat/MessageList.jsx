import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Loader } from '../common';
import { BiRocket } from 'react-icons/bi';

const MessageList = ({ 
  messages, 
  isLoading,
  onCreateNewChat
}) => {
  const messagesEndRef = useRef(null);

  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isUser={message.role === 'user'}
        />
      ))}

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