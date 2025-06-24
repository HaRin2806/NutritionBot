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
      className={`mx-3 mb-2 rounded-xl transition-all duration-300 group hover:scale-[1.02] ${
        activeConversation?.id === conversation.id
          ? `shadow-lg ${darkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/70 backdrop-blur-sm'}` 
          : `${darkMode ? 'hover:bg-white/5' : 'hover:bg-white/40'} hover:shadow-md`
      }`}
      style={{
        ...(activeConversation?.id === conversation.id && {
          background: darkMode 
            ? `linear-gradient(135deg, ${currentThemeConfig?.primary}20 0%, ${currentThemeConfig?.primary}10 100%)`
            : `linear-gradient(135deg, ${currentThemeConfig?.light} 0%, white 100%)`,
          borderLeft: `4px solid ${currentThemeConfig?.primary}`
        })
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              onSelectConversation(conversation.id);
              if (isMobile) onCloseSidebar();
            }}
          >
            <p className={`text-base font-medium truncate transition-colors ${
              activeConversation?.id === conversation.id
                ? (darkMode ? 'text-white' : `text-gray-800`)
                : (darkMode ? 'text-gray-200' : 'text-gray-700')
            }`}>
              {conversation.title}
            </p>
            <div className={`flex items-center mt-1 text-sm transition-colors ${
              activeConversation?.id === conversation.id
                ? (darkMode ? 'text-gray-300' : 'text-gray-600')
                : (darkMode ? 'text-gray-400' : 'text-gray-500')
            }`}>
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
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header với glassmorphism */}
      <div className={`p-4 border-b transition-all duration-300 ${
        darkMode ? 'border-white/10' : 'border-white/30'
      }`}>
        <button
          onClick={onNewConversation}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            darkMode ? 'shadow-lg' : 'shadow-md'
          }`}
          style={{ 
            background: `linear-gradient(135deg, ${currentThemeConfig?.primary} 0%, ${currentThemeConfig?.dark || currentThemeConfig?.primary} 100%)`
          }}
        >
          <BiPlus className="w-5 h-5 mr-2" />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* Search với glassmorphism */}
      <div className="p-4">
        <div className={`relative ${
          darkMode 
            ? 'bg-white/5 backdrop-blur-sm border-white/10' 
            : 'bg-white/40 backdrop-blur-sm border-white/50'
        } rounded-xl border transition-all duration-300 focus-within:scale-105`}>
          <BiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl bg-transparent transition-all duration-300 focus:outline-none placeholder-opacity-70 ${
              darkMode
                ? 'text-white placeholder-gray-400'
                : 'text-gray-900 placeholder-gray-500'
            }`}
            style={{
              backdropFilter: 'blur(10px)'
            }}
          />
        </div>
      </div>

      {/* Conversations list với custom scrollbar */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size="sm" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className={`${
              darkMode 
                ? 'bg-white/5 backdrop-blur-sm border-white/10' 
                : 'bg-white/40 backdrop-blur-sm border-white/50'
            } rounded-xl p-6 border mx-3`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
              </p>
              {!searchTerm && (
                <button
                  onClick={onNewConversation}
                  className="mt-2 text-sm hover:underline transition-colors"
                  style={{ color: currentThemeConfig?.primary || '#36B37E' }}
                >
                  Bắt đầu trò chuyện
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {Object.entries(groupedConversations).map(([period, convs]) => (
              convs.length > 0 && (
                <div key={period}>
                  <div className={`px-4 py-2 text-xs font-medium uppercase tracking-wide ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
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

      {/* Footer với glassmorphism */}
      <div className={`p-4 border-t transition-all duration-300 ${
        darkMode ? 'border-white/10' : 'border-white/30'
      }`}>
        <Link
          to="/history"
          className={`flex items-center px-3 py-2 text-sm rounded-xl transition-all duration-300 hover:scale-105 ${
            darkMode
              ? 'hover:bg-white/10 hover:text-white text-gray-300'
              : 'hover:bg-white/50 hover:text-gray-900 text-gray-600'
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