import React, { useState } from 'react';
import { BiBookOpen, BiChevronDown, BiChevronUp } from 'react-icons/bi';

const SourceReference = ({ sources = [], darkMode = false, themeConfig = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 border-t pt-3 ${
      darkMode ? 'border-gray-600' : 'border-gray-200'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center text-sm font-medium transition-colors hover:opacity-80 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}
        style={{ color: themeConfig?.primary || '#36B37E' }}
      >
        <BiBookOpen className="w-4 h-4 mr-2" />
        <span>Nguồn tham khảo ({sources.length})</span>
        {isExpanded ? (
          <BiChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <BiChevronDown className="w-4 h-4 ml-1" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sources.map((source, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border text-sm ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-300'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium mb-1" style={{ color: themeConfig?.primary || '#36B37E' }}>
                    [{index + 1}] {source.title}
                  </div>
                  {source.content && (
                    <div className={`text-xs leading-relaxed ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {source.content.length > 200 
                        ? `${source.content.substring(0, 200)}...` 
                        : source.content
                      }
                    </div>
                  )}
                  {source.page && (
                    <div className={`text-xs mt-1 font-medium ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Trang {source.page}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SourceReference;