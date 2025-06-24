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
  const [isVersionSwitching, setIsVersionSwitching] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom'); // 'bottom' hoặc 'top'
  const { darkMode, currentThemeConfig } = useTheme();
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  const buttonRef = useRef(null);

  const messageId = message._id || message.id;
  const hasVersions = message.versions && Array.isArray(message.versions) && message.versions.length > 1;
  const currentVersion = message.current_version || 1;
  const totalVersions = message.versions ? message.versions.length : 1;

  useEffect(() => {
    if (hasVersions) {
      console.log(`MessageBubble [${message.role}] Debug:`, {
        messageId,
        currentVersion,
        totalVersions,
        isEdited: message.is_edited,
        versions: message.versions?.map(v => ({
          version: v.version,
          content: v.content.substring(0, 30) + '...',
          followingMessagesCount: v.following_messages ? v.following_messages.length : 0
        }))
      });
    }
  }, [message, hasVersions, currentVersion, totalVersions, messageId]);

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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Xử lý vị trí menu khi click
  const handleMenuToggle = () => {
    if (!showMenu && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // Nếu không đủ chỗ ở dưới (< 200px) và có đủ chỗ ở trên, thì hiển thị ở trên
      if (spaceBelow < 200 && spaceAbove > 200) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
    setShowMenu(!showMenu);
  };

  const handleEditStart = () => {
    console.log(`Starting edit for message: ${messageId}`);
    onEditStart(messageId);
    setShowMenu(false);
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log(`Submitting edit for message: ${messageId}`);
      await onEditMessage(messageId, conversationId, editContent.trim());
      onEditEnd();
    } catch (error) {
      console.error('Error editing message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    console.log(`Canceling edit for message: ${messageId}`);
    onEditEnd();
    setEditContent(message.content);
    setIsSubmitting(false);
  };

  const handleVersionSwitch = async (version) => {
    if (isVersionSwitching || version === currentVersion) {
      console.log(`Skip version switch - switching: ${isVersionSwitching}, same version: ${version === currentVersion}`);
      return;
    }
    
    console.log(`Switching message ${messageId} from version ${currentVersion} to version ${version}`);
    
    setIsVersionSwitching(true);
    try {
      await onSwitchVersion(messageId, conversationId, version);
      console.log(`Version switch completed successfully: ${messageId} -> version ${version}`);
    } catch (error) {
      console.error(`Error switching version for message ${messageId}:`, error);
    } finally {
      setIsVersionSwitching(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      console.log(`Regenerating response for message: ${messageId}`);
      await onRegenerateResponse(messageId, conversationId, userAge);
      setShowMenu(false);
    } catch (error) {
      console.error('Error regenerating response:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này và tất cả tin nhắn sau nó?')) {
      try {
        console.log(`Deleting message and following: ${messageId}`);
        await onDeleteMessage(messageId, conversationId);
        setShowMenu(false);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const canSwitchToPrevious = currentVersion > 1;
  const canSwitchToNext = currentVersion < totalVersions;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group mb-6 transition-all duration-300`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl relative transition-all duration-300 ${
          isUser
            ? 'shadow-lg hover:shadow-xl'
            : `shadow-md hover:shadow-lg ${
                darkMode 
                  ? 'bg-white/10 backdrop-blur-xl border border-white/20' 
                  : 'bg-white/80 backdrop-blur-xl border border-white/30'
              }`
        }`}
        style={{
          backgroundColor: isUser 
            ? currentThemeConfig?.primary || '#36B37E'
            : undefined,
        }}
      >
        {isRegenerating ? (
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="typing-dots">
                <div className="dot" style={{ backgroundColor: currentThemeConfig?.primary }}></div>
                <div className="dot" style={{ backgroundColor: currentThemeConfig?.primary }}></div>
                <div className="dot" style={{ backgroundColor: currentThemeConfig?.primary }}></div>
              </div>
              <span 
                className="text-sm"
                style={{ color: currentThemeConfig?.primary || '#36B37E' }}
              >
                Đang tạo phản hồi...
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-4">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`w-full p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-600 text-white focus:ring-blue-500' 
                        : 'bg-gray-50/80 border-gray-300 text-gray-900 focus:ring-blue-500'
                    }`}
                    placeholder="Nhập tin nhắn..."
                    rows={3}
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleEditCancel}
                      disabled={isSubmitting}
                      className={`flex items-center px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                        darkMode
                          ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/50'
                          : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80'
                      }`}
                    >
                      <BiX className="w-4 h-4 mr-2" />
                      Hủy
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      disabled={isSubmitting || !editContent.trim()}
                      className={`flex items-center px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                        isSubmitting || !editContent.trim()
                          ? 'bg-gray-400/50 text-gray-600 cursor-not-allowed'
                          : 'text-white hover:shadow-lg'
                      }`}
                      style={{
                        backgroundColor: !isSubmitting && editContent.trim() ? currentThemeConfig?.primary : undefined
                      }}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <BiCheck className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isUser ? (
                    <div className="whitespace-pre-wrap text-white">{message.content}</div>
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

            {hasVersions && !isEditing && (
              <div className={`px-4 py-2 border-t transition-all duration-300 ${
                isUser 
                  ? 'border-white/20 bg-black/10' 
                  : (darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200/50 bg-white/30')
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs ${
                      isUser 
                        ? 'text-white/90' 
                        : (darkMode ? 'text-gray-300' : 'text-gray-600')
                    }`}>
                      Phiên bản {currentVersion}/{totalVersions}
                    </span>
                    {message.is_edited && (
                      <span className={`text-xs px-3 py-1 rounded-full transition-all duration-300 ${
                        isUser 
                          ? 'bg-white/20 text-white' 
                          : (darkMode ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100/80 text-gray-600')
                      }`}>
                        Đã sửa
                      </span>
                    )}
                    {isVersionSwitching && (
                      <span className={`text-xs px-3 py-1 rounded-full transition-all duration-300 ${
                        isUser 
                          ? 'bg-white/20 text-white' 
                          : (darkMode ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100/80 text-gray-600')
                      }`}>
                        Đang chuyển...
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVersionSwitch(currentVersion - 1)}
                      disabled={!canSwitchToPrevious || isVersionSwitching}
                      className={`p-1 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-white/20 text-white'
                          : (darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-700')
                      }`}
                      title="Phiên bản trước"
                    >
                      <BiChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className={`text-xs px-3 py-1 rounded-lg min-w-[24px] text-center transition-all duration-300 ${
                      isUser 
                        ? 'bg-white/20 text-white' 
                        : (darkMode ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100/80 text-gray-600')
                    }`}>
                      {currentVersion}
                    </span>
                    
                    <button
                      onClick={() => handleVersionSwitch(currentVersion + 1)}
                      disabled={!canSwitchToNext || isVersionSwitching}
                      className={`p-1 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-white/20 text-white'
                          : (darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-700')
                      }`}
                      title="Phiên bản sau"
                    >
                      <BiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`px-4 pb-2 flex items-center justify-between`}>
              <div className={`text-xs transition-colors duration-300 ${
                isUser 
                  ? 'text-white/70' 
                  : (darkMode ? 'text-gray-400' : 'text-gray-500')
              }`}>
                {formatTime(message.timestamp)}
                {message.is_edited && <span className="ml-1">(đã chỉnh sửa)</span>}
              </div>

              {!isEditing && (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={buttonRef}
                    onClick={handleMenuToggle}
                    className={`opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-lg ${
                      isUser
                        ? 'hover:bg-white/20 text-white/70 hover:text-white'
                        : (darkMode 
                          ? 'hover:bg-white/10 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-200/50 text-gray-400 hover:text-gray-600')
                    }`}
                    title="Tùy chọn"
                  >
                    <BiDotsVerticalRounded className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className={`absolute right-0 ${
                      menuPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                    } w-48 rounded-xl shadow-2xl z-20 py-2 border backdrop-blur-xl transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-800/90 border-gray-700/50'
                        : 'bg-white/90 border-gray-200/50'
                    }`}>
                      {isUser && (
                        <button
                          onClick={handleEditStart}
                          className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-300 ${
                            darkMode
                              ? 'text-gray-300 hover:bg-gray-700/50'
                              : 'text-gray-700 hover:bg-gray-100/50'
                          }`}
                        >
                          <BiEdit className="mr-3 w-4 h-4" />
                          Chỉnh sửa tin nhắn
                        </button>
                      )}

                      {!isUser && (
                        <button
                          onClick={handleRegenerate}
                          className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-300 ${
                            darkMode
                              ? 'text-gray-300 hover:bg-gray-700/50'
                              : 'text-gray-700 hover:bg-gray-100/50'
                          }`}
                        >
                          <BiRefresh className="mr-3 w-4 h-4" />
                          Tạo lại phản hồi
                        </button>
                      )}

                      <button
                        onClick={handleDelete}
                        className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-300 ${
                          darkMode
                            ? 'text-red-400 hover:bg-red-900/20'
                            : 'text-red-600 hover:bg-red-50/50'
                        }`}
                      >
                        <BiTrash className="mr-3 w-4 h-4" />
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