import React, { useRef, useEffect } from 'react';
import { BiPlus, BiHistory, BiSearch, BiX } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTime, groupConversationsByTime } from '../../utils/index';
import { Loader } from '../common';
import ConversationItem from '../chat/ConversationItem';

const Sidebar = ({
  conversations = [],
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,       
  onRenameConversation,        
  isLoading = false,
  isMobile = false,
  onCloseSidebar = () => { },

}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { darkMode, currentThemeConfig } = useTheme();
  const conversationRefs = useRef({});

  const filteredConversations = conversations.filter(
    conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedConversations = groupConversationsByTime(filteredConversations);

  useEffect(() => {
    if (activeConversation?.id && conversationRefs.current[activeConversation.id]) {
      const element = conversationRefs.current[activeConversation.id];
      const container = element.closest('.overflow-y-auto');

      if (container && element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const isVisible = (
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom
        );

        if (!isVisible) {
          const scrollTop = element.offsetTop - container.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [activeConversation?.id]);

  const renderConversationItem = (conversation) => (
    <div
      key={conversation.id}
      ref={el => {
        if (el) {
          conversationRefs.current[conversation.id] = el;
        }
      }}
      className={`px-4 py-3 transition-all rounded-md mx-2 group ${activeConversation?.id === conversation.id
          ? '' // Style sẽ được set inline
          : `${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`
        }`}
      style={{
        backgroundColor: activeConversation?.id === conversation.id
          ? (currentThemeConfig?.light || '#E6F7EF')
          : undefined,
        color: activeConversation?.id === conversation.id
          ? (currentThemeConfig?.primary || '#36B37E')
          : undefined
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            onSelectConversation(conversation.id);
            if (isMobile) onCloseSidebar();
          }}
        >
          <p className="text-sm font-medium truncate">
            {conversation.title}
          </p>
          <div className="flex items-center mt-1 text-xs opacity-75">
            <span>{formatTime(conversation.updated_at)}</span>
            {conversation.age_context && (
              <>
                <span className="mx-1">•</span>
                <span>{conversation.age_context} tuổi</span>
              </>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <ConversationItem
          conversation={conversation}
          onDelete={onDeleteConversation}
          onRename={onRenameConversation}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: currentThemeConfig?.primary || '#36B37E' }}
        >
          <BiPlus className="w-5 h-5 mr-2" />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <BiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            style={{
              focusRingColor: `${currentThemeConfig?.primary}40`
            }}
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size="sm" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewConversation}
                className="mt-2 text-sm hover:underline"
                style={{ color: currentThemeConfig?.primary || '#36B37E' }}
              >
                Bắt đầu trò chuyện
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedConversations).map(([period, convs]) => (
              convs.length > 0 && (
                <div key={period}>
                  <div className={`px-4 py-2 text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {period}
                  </div>
                  {convs.map(renderConversationItem)}
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <Link
          to="/history"
          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${darkMode
              ? 'hover:bg-gray-700 hover:text-white'
              : 'hover:bg-gray-100 hover:text-gray-900'
            }`}
          style={{ color: currentThemeConfig?.primary || '#36B37E' }}
          onClick={() => isMobile && onCloseSidebar()}
        >
          <BiHistory className="w-4 h-4 mr-3" />
          Xem tất cả lịch sử
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;