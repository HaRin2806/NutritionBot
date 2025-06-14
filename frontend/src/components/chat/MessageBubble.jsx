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

  const hasVersions = message.versions && message.versions.length > 1;
  const currentVersion = message.current_version || 1;
  const totalVersions = message.versions ? message.versions.length : 1;

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
              ? '#374151' // FIXED: Darker background for better contrast
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
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                    style={{ 
                      focusRingColor: `${currentThemeConfig?.primary}40`,
                      minHeight: '80px'
                    }}
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleEditSubmit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleEditCancel();
                      }
                    }}
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleEditCancel}
                      disabled={isSubmitting}
                      className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${
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
                      className="px-3 py-1 text-sm text-white rounded transition-colors disabled:opacity-50 flex items-center"
                      style={{ backgroundColor: currentThemeConfig?.primary || '#36B37E' }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <BiCheck className="w-4 h-4 mr-1" />
                          Lưu
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs opacity-75">
                    Nhấn Ctrl+Enter để lưu, Esc để hủy
                  </p>
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

            {/* Version selector */}
            {hasVersions && !isEditing && (
              <div className={`px-4 pb-2 border-t ${
                isUser 
                  ? 'border-white border-opacity-20' 
                  : (darkMode ? 'border-gray-600' : 'border-gray-200')
              }`}>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${
                    isUser 
                      ? 'text-white text-opacity-80' 
                      : (darkMode ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    Phiên bản {currentVersion}/{totalVersions}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleVersionSwitch(currentVersion - 1)}
                      disabled={currentVersion <= 1}
                      className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-white hover:bg-opacity-20 text-white'
                          : (darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500')
                      }`}
                      title="Phiên bản trước"
                    >
                      <BiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleVersionSwitch(currentVersion + 1)}
                      disabled={currentVersion >= totalVersions}
                      className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-white hover:bg-opacity-20 text-white'
                          : (darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500')
                      }`}
                      title="Phiên bản tiếp theo"
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