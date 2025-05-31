import React, { useState, useRef, useEffect } from 'react';
import { BiEdit, BiCheck, BiX, BiChevronLeft, BiChevronRight, BiRefresh, BiTrash, BiDotsVerticalRounded } from 'react-icons/bi';
import { formatTime } from '../../utils/dateUtils';
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
  userAge
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);

  // Get message ID - handle both _id and id
  const messageId = message._id || message.id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditContent(message.content);
    setShowMenu(false);
  };

  const handleEditSave = async () => {
    if (!editContent.trim() || editContent === message.content) {
      handleEditCancel();
      return;
    }

    setIsSubmitting(true);

    try {
      setIsSubmitting(false);
      setIsEditing(false);
      onEditMessage(messageId, conversationId, editContent.trim());
    } catch (error) {
      console.error('Error editing message:', error);
      setIsSubmitting(false);
      setIsEditing(true);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
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

  // Kiểm tra xem tin nhắn này có đang được regenerate hay không
  const isRegenerating = !isUser && message.isRegenerating;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-animation group mb-4`}>
      <div
        className={`max-w-[90%] md:max-w-[80%] rounded-2xl shadow-sm relative ${
          isUser
            ? 'bg-mint-600 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }`}
        style={{
          backgroundColor: isUser ? '#36B37E' : '#FFFFFF',
        }}
      >
        {/* SỬA: Typing indicator cho bot message */}
        {isRegenerating ? (
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <span className="text-mint-600 text-sm font-medium ml-2" style={{ color: '#36B37E' }}>
                Đang tạo phản hồi...
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Message content */}
            <div className="p-4">
              {isEditing ? (
                // Edit form
                <div>
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-mint-500 focus:border-transparent text-gray-800"
                    style={{ minHeight: '60px', borderColor: '#36B37E' }}
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleEditSave();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleEditCancel();
                      }
                    }}
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={handleEditCancel}
                      disabled={isSubmitting}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center"
                    >
                      <BiX className="w-4 h-4 mr-1" />
                      Hủy
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={isSubmitting || !editContent.trim() || editContent === message.content}
                      className="px-3 py-1 text-sm bg-mint-600 text-white rounded hover:bg-mint-700 disabled:opacity-50 transition-colors flex items-center"
                      style={{ backgroundColor: '#36B37E' }}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Nhấn Ctrl+Enter để lưu, Esc để hủy
                  </p>
                </div>
              ) : (
                <>
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="markdown-content">
                      <MarkdownRenderer content={message.content} />
                      {message.sources && message.sources.length > 0 && (
                        <SourceReference sources={message.sources} />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Version controls */}
            {hasVersions && !isEditing && (
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={isUser ? 'text-mint-200' : 'text-gray-500'}>
                    Phiên bản {currentVersion} / {totalVersions}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleVersionSwitch(Math.max(1, currentVersion - 1))}
                      disabled={currentVersion <= 1}
                      className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-mint-700 text-mint-200'
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                      title="Phiên bản trước"
                    >
                      <BiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleVersionSwitch(Math.min(totalVersions, currentVersion + 1))}
                      disabled={currentVersion >= totalVersions}
                      className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUser
                          ? 'hover:bg-mint-700 text-mint-200'
                          : 'hover:bg-gray-200 text-gray-500'
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
              <div className={`text-xs ${isUser ? 'text-mint-200' : 'text-gray-500'}`}>
                {formatTime(message.timestamp)}
                {message.is_edited && <span className="ml-1">(đã chỉnh sửa)</span>}
              </div>

              {/* Action buttons */}
              {!isEditing && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${
                      isUser ? 'text-mint-200 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Tùy chọn"
                  >
                    <BiDotsVerticalRounded className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
                      {isUser && (
                        <button
                          onClick={handleEditStart}
                          className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <BiEdit className="mr-2 w-4 h-4" />
                          Chỉnh sửa tin nhắn
                        </button>
                      )}

                      {!isUser && (
                        <button
                          onClick={handleRegenerate}
                          className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <BiRefresh className="mr-2 w-4 h-4" />
                          Tạo lại phản hồi
                        </button>
                      )}

                      <button
                        onClick={handleDelete}
                        className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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