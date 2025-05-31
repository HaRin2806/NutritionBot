import React from 'react';
import { BiPlus, BiHistory, BiSearch, BiX } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import { formatTime, groupConversationsByTime } from '../../utils/dateUtils';
import { Loader } from '../common';
import ConversationItem from '../chat/ConversationItem';

const Sidebar = ({
  conversations = [],
  activeConversation,
  onSelectConversation,
  onCreateNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false,
  isMobile = false,
  onCloseSidebar = () => { },
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredConversations = conversations.filter(
    conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedConversations = groupConversationsByTime(filteredConversations);

  const renderConversationItem = (conversation) => (
    <div
      key={conversation.id}
      onClick={() => {
        onSelectConversation(conversation.id);
        if (isMobile) onCloseSidebar();
      }}
      className={`px-4 py-3 flex items-center justify-between cursor-pointer transition rounded-md mx-2 ${activeConversation?.id === conversation.id ? 'bg-mint-100' : 'hover:bg-gray-50'
        }`}
      style={{ backgroundColor: activeConversation?.id === conversation.id ? '#E6F7EF' : '' }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 truncate">{conversation.title}</h3>
        <div className="text-xs text-gray-500">{formatTime(conversation.updated_at)}</div>
      </div>
      <ConversationItem
        conversation={conversation}
        onDelete={onDeleteConversation}
        onRename={onRenameConversation}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Trò chuyện</h2>
        <div className="flex space-x-2">
          {isMobile && (
            <button
              onClick={onCloseSidebar}
              className="p-2 text-mint-600 hover:bg-mint-50 rounded-full transition"
            >
              <BiX className="text-xl" />
            </button>
          )}
          <Link
            to="/history"
            className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
            style={{ color: '#36B37E' }}
          >
            <BiHistory className="text-lg" />
          </Link>
          <button
            onClick={onCreateNewConversation}
            className="p-2 bg-mint-600 text-white rounded-full hover:bg-mint-700 transition shadow-sm"
            style={{ backgroundColor: '#36B37E' }}
          >
            <BiPlus className="text-lg" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full py-2 pl-8 pr-3 border border-mint-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-mint-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <BiX />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader type="dots" color="mint" text="Đang tải..." />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? (
              <>
                <p>Không tìm thấy cuộc trò chuyện</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-mint-600 hover:underline text-sm"
                >
                  Xóa bộ lọc
                </button>
              </>
            ) : (
              <>
                <p>Chưa có cuộc trò chuyện nào</p>
                <button
                  onClick={onCreateNewConversation}
                  className="mt-2 text-mint-600 hover:underline text-sm"
                >
                  Bắt đầu trò chuyện
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Groups */}
            {groupedConversations.today.length > 0 && (
              <div>
                <h3 className="px-4 pt-2 text-xs font-semibold text-gray-500 uppercase mb-1">
                  Hôm nay
                </h3>
                {groupedConversations.today.map(renderConversationItem)}
              </div>
            )}

            {groupedConversations.yesterday.length > 0 && (
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-1">
                  Hôm qua
                </h3>
                {groupedConversations.yesterday.map(renderConversationItem)}
              </div>
            )}

            {groupedConversations.last7Days.length > 0 && (
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-1">
                  7 ngày qua
                </h3>
                {groupedConversations.last7Days.map(renderConversationItem)}
              </div>
            )}

            {groupedConversations.older.length > 0 && (
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-1">
                  Cũ hơn
                </h3>
                {groupedConversations.older.map(renderConversationItem)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;