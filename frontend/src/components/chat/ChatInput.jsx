import React, { useState, useRef, useEffect } from 'react';
import { BiSend, BiMicrophone, BiPaperclip } from 'react-icons/bi';
import { useTheme } from '../../contexts/ThemeContext';

const ChatInput = ({ onSendMessage, disabled = false, placeholder = "Hãy hỏi tôi về dinh dưỡng..." }) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const { darkMode, currentThemeConfig } = useTheme();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`border-t p-4 transition-colors ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full resize-none rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
              darkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600'
                : 'bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200'
            }`}
            style={{ 
              '--tw-ring-color': `${currentThemeConfig?.primary}40`,
              minHeight: '52px',
              maxHeight: '120px',
              borderColor: darkMode ? '#4B5563' : '#E5E7EB'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`flex-shrink-0 p-3 rounded-lg text-white transition-all duration-200 flex items-center justify-center ${
            disabled || !message.trim()
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-90 hover:shadow-lg'
          }`}
          style={{ 
            backgroundColor: currentThemeConfig?.primary || '#36B37E',
            height: '52px',
            width: '52px'
          }}
        >
          <BiSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;