import React from 'react';
import { formatTime } from '../../utils/dateUtils';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import SourceReference from './SourceReference';

const MessageBubble = ({ message, isUser }) => {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-animation`}
    >
      <div
        className={`max-w-[90%] md:max-w-[80%] p-4 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-mint-600 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }`}
        style={{
          backgroundColor: isUser ? '#36B37E' : '#FFFFFF',
        }}
      >
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
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-mint-200' : 'text-gray-500'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;