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
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
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
            className={`w-full resize-none rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            style={{ 
              focusRingColor: `${currentThemeConfig?.primary}40`,
              minHeight: '52px', // FIXED: Match button height
              maxHeight: '120px'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`flex-shrink-0 p-3 rounded-lg text-white transition-all duration-200 ${
            disabled || !message.trim()
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-90 hover:shadow-lg'
          }`}
          style={{ 
            backgroundColor: currentThemeConfig?.primary || '#36B37E',
            height: '52px', // FIXED: Explicit height to match textarea min-height
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