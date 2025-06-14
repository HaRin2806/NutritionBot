import React, { useState, useRef, useEffect } from 'react';
import { 
  BiEdit, BiTrash, BiRefresh, BiDotsVerticalRounded, 
  BiChevronLeft, BiChevronRight, BiCheck, BiX 
} from 'react-icons/bi';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTime } from '../../utils';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import SourceReference from './SourceReference';

const MessageBubble = ({
  message,
  isUser,
  onEditMessage,
  onSwitchVersion,
  onRegenerateResponse,
  onDeleteMessage,
  conversationId,
  userAge,
  isEditing,
  onEditStart,
  onEditEnd,
  isRegenerating
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darkMode, currentThemeConfig } = useTheme();
  const menuRef = useRef(null);
  const textareaRef = useRef(null);

  const messageId = message._id || message.id;

  // ✅ SỬA: Logic version tốt hơn
  const hasVersions = message.versions && Array.isArray(message.versions) && message.versions.length > 1;
  const currentVersion = message.current_version || 1;
  const totalVersions = message.versions ? message.versions.length : 1;

  // ✅ THÊM: Debug log để kiểm tra data
  useEffect(() => {
    console.log('MessageBubble Debug:', {
      messageId,
      hasVersions,
      currentVersion,
      totalVersions,
      versions: message.versions,
      isEditing
    });
  }, [message, hasVersions, currentVersion, totalVersions, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setEditContent(message.content || '');
  }, [message.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEditStart = () => {
    onEditStart(messageId);
    setShowMenu(false);
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onEditMessage(messageId, conversationId, editContent.trim());
      onEditEnd();
    } catch (error) {
      console.error('Error editing message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    onEditEnd();
    setEditContent(message.content);
    setIsSubmitting(false);
  };

  const handleVersionSwitch = async (version) => {
    console.log('Switching to version:', version, 'for message:', messageId);
    try {
      await onSwitchVersion(messageId, conversationId, version);
    } catch (error) {
      console.error('Error switching version:', error);
    }
  };

  const handleRegenerate = async () => {
    try {
      await onRegenerateResponse(messageId, conversationId, userAge);
      setShowMenu(false);
    } catch (error) {
      console.error('Error regenerating response:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này và tất cả tin nhắn sau nó?')) {
      try {
        await onDeleteMessage(messageId, conversationId);
        setShowMenu(false);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-animation group mb-4`}>
      <div
        className={`max-w-[90%] md:max-w-[80%] rounded-2xl shadow-sm relative transition-colors border ${
          isUser
            ? 'text-white border-transparent'
            : darkMode 
              ? 'bg-gray-700 text-gray-100 border-gray-600' 
              : 'bg-white text-gray-800 border-gray-200'
        }`}
        style={{
          backgroundColor: isUser 
            ? (currentThemeConfig?.primary || '#36B37E') 
            : darkMode 
              ? '#374151'
              : '#ffffff',
        }}
      >
        {/* Typing indicator cho bot message */}
        {isRegenerating ? (
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <span 
                className="text-sm font-medium ml-2"
                style={{ color: currentThemeConfig?.primary || '#36B37E' }}
              >
                Đang tạo phản hồi...
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Message content */}
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`w-full p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500'
                    }`}
                    placeholder="Nhập tin nhắn..."
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleEditCancel}
                      disabled={isSubmitting}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                        darkMode
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <BiX className="w-4 h-4 mr-1" />
                      Hủy
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      disabled={isSubmitting || !editContent.trim()}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                        isSubmitting || !editContent.trim()
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <BiCheck className="w-4 h-4 mr-1" />
                      )}
                      {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className={`markdown-content ${darkMode ? 'dark' : ''}`}>
                      <MarkdownRenderer content={message.content} />
                      {message.sources && message.sources.length > 0 && (
                        <SourceReference 
                          sources={message.sources} 
                          darkMode={darkMode}
                          themeConfig={currentThemeConfig}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ✅ SỬA: Version selector - đặt ở vị trí riêng biệt, rõ ràng */}
            {hasVersions && !isEditing && (
              <div className={`px-4 py-3 border-t ${
                isUser 
                  ? 'border-white border-opacity-20' 
                  : (darkMode ? 'border-gray-600' : 'border-gray-200')
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${
                      isUser 
                        ? 'text-white text-opacity-90' 
                        : (darkMode ? 'text-gray-300' : 'text-gray-600')
                    }`}>
                      Phiên bản {currentVersion}/{totalVersions}
                    </span>
                    {message.is_edited && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isUser 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600')
                      }`}>
                        Đã sửa
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleVersionSwitch(currentVersion - 1)}
                      disabled={currentVersion <= 1}
                      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-white hover:bg-opacity-20 text-white'
                          : (darkMode ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700')
                      }`}
                      title="Phiên bản trước"
                    >
                      <BiChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className={`text-xs px-2 py-1 rounded min-w-[20px] text-center ${
                      isUser 
                        ? 'bg-white bg-opacity-20 text-white' 
                        : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {currentVersion}
                    </span>
                    
                    <button
                      onClick={() => handleVersionSwitch(currentVersion + 1)}
                      disabled={currentVersion >= totalVersions}
                      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-white hover:bg-opacity-20 text-white'
                          : (darkMode ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700')
                      }`}
                      title="Phiên bản sau"
                    >
                      <BiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamp and actions */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className={`text-xs ${
                isUser 
                  ? 'text-white text-opacity-70' 
                  : (darkMode ? 'text-gray-400' : 'text-gray-500')
              }`}>
                {formatTime(message.timestamp)}
                {message.is_edited && <span className="ml-1">(đã chỉnh sửa)</span>}
              </div>

              {/* Action buttons */}
              {!isEditing && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded ${
                      isUser
                        ? 'hover:bg-white hover:bg-opacity-20 text-white text-opacity-70 hover:text-white'
                        : (darkMode 
                          ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600')
                    }`}
                    title="Tùy chọn"
                  >
                    <BiDotsVerticalRounded className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className={`absolute right-0 bottom-full mb-1 w-44 rounded-md shadow-lg z-20 py-1 border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}>
                      {isUser && (
                        <button
                          onClick={handleEditStart}
                          className={`flex items-center w-full text-left px-3 py-2 text-sm transition-colors ${
                            darkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <BiEdit className="mr-2 w-4 h-4" />
                          Chỉnh sửa tin nhắn
                        </button>
                      )}

                      {!isUser && (
                        <button
                          onClick={handleRegenerate}
                          className={`flex items-center w-full text-left px-3 py-2 text-sm transition-colors ${
                            darkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <BiRefresh className="mr-2 w-4 h-4" />
                          Tạo lại phản hồi
                        </button>
                      )}

                      <button
                        onClick={handleDelete}
                        className={`flex items-center w-full text-left px-3 py-2 text-sm transition-colors ${
                          darkMode
                            ? 'text-red-400 hover:bg-red-900/20'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <BiTrash className="mr-2 w-4 h-4" />
                        Xóa từ đây trở đi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;