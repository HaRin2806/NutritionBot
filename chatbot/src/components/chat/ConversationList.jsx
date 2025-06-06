import React, { useState } from 'react';
import { BiSearch, BiPlus, BiHistory, BiX } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import { formatTime, groupConversationsByTime } from '../../utils/index';
import { Loader } from '../common';
import ConversationItem from './ConversationItem';

const ConversationList = ({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc conversations theo searchTerm
  const filteredConversations = conversations.filter(
    conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Nhóm cuộc hội thoại theo thời gian
  const groupedConversations = groupConversationsByTime(filteredConversations);

  // Render một item cuộc hội thoại
  const renderConversationItem = (conversation) => (
    <div
      key={conversation.id}
      onClick={() => onSelectConversation(conversation.id)}
      className={`px-4 py-3 flex items-center justify-between cursor-pointer transition rounded-md mx-2
        ${activeConversationId === conversation.id ? 'bg-mint-100' : 'hover:bg-gray-50'}`}
      style={{ backgroundColor: activeConversationId === conversation.id ? '#E6F7EF' : '' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-medium text-gray-800 truncate">{conversation.title}</h3>
        </div>
        <div className="text-xs text-gray-500">
          {formatTime(conversation.updated_at)}
        </div>
      </div>
      <ConversationItem
        conversation={conversation}
        onDelete={onDeleteConversation}
        onRename={onRenameConversation}
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Trò chuyện</h2>
        <div className="flex space-x-2">
          <Link
            to="/history"
            className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
            style={{ color: '#36B37E' }}
          >
            <BiHistory className="text-lg" />
          </Link>
          <button
            onClick={onCreateConversation}
            className="p-2 bg-mint-600 text-white rounded-full hover:bg-mint-700 transition shadow-sm"
            style={{ backgroundColor: '#36B37E' }}
          >
            <BiPlus className="text-lg" />
          </button>
        </div>
      </div>

      {/* Search section */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full py-2 pl-8 pr-3 border border-mint-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            style={{ borderColor: '#A0D9C1' }}
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
          <div className="p-4 text-center text-gray-500">
            <Loader type="dots" color="mint" text="Đang tải cuộc trò chuyện..." />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? (
              <>
                <p>Không tìm thấy cuộc trò chuyện phù hợp</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-mint-600 hover:underline text-sm flex items-center justify-center"
                  style={{ color: '#36B37E' }}
                >
                  <BiX className="mr-1" /> Xóa bộ lọc
                </button>
              </>
            ) : (
              <>
                <p>Chưa có cuộc trò chuyện nào</p>
                <button
                  onClick={onCreateConversation}
                  className="mt-2 text-mint-600 hover:underline text-sm flex items-center justify-center"
                  style={{ color: '#36B37E' }}
                >
                  <BiPlus className="mr-1" /> Bắt đầu trò chuyện
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Nhóm Hôm nay */}
            {groupedConversations.today.length > 0 && (
              <div>
                <h3 className="px-4 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Hôm nay
                </h3>
                {groupedConversations.today.map(renderConversationItem)}
              </div>
            )}

            {/* Nhóm Hôm qua */}
            {groupedConversations.yesterday.length > 0 && (
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Hôm qua
                </h3>
                {groupedConversations.yesterday.map(renderConversationItem)}
              </div>
            )}

            {/* Nhóm 7 ngày qua */}
            {groupedConversations.last7Days.length > 0 && (
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  7 ngày qua
                </h3>
                {groupedConversations.last7Days.map(renderConversationItem)}
              </div>
            )}

            {/* Nhóm Cũ hơn */}
            {groupedConversations.older.length > 0 && (
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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

export default ConversationList;