import React, { useState, useEffect, useRef } from 'react';
import { BiSend } from 'react-icons/bi';

const ChatInput = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Nhập câu hỏi của bạn...",
  initialValue = ""
}) => {
  const [message, setMessage] = useState(initialValue);
  const inputRef = useRef(null);

  // Focus vào input khi component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Xử lý khi submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage("");
  };

  // Xử lý resize textarea khi nội dung thay đổi
  const handleInput = (e) => {
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  // Xử lý phím Enter để gửi tin nhắn (Shift+Enter để xuống dòng)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white border-t border-gray-200"
    >
      <div className="flex items-end space-x-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 resize-none overflow-hidden"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`p-3 rounded-lg text-white transition ${
            disabled || !message.trim()
              ? "bg-mint-400 cursor-not-allowed"
              : "bg-mint-600 hover:bg-mint-700"
          }`}
          style={{ 
            backgroundColor: disabled || !message.trim() ? "#A0D9C1" : "#36B37E",
            minWidth: "44px",
            height: "44px"
          }}
        >
          <BiSend />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;