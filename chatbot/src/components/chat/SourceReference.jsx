import React from 'react';
import { BiInfoCircle } from 'react-icons/bi';

const SourceReference = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
      <div className="flex items-center mb-2">
        <BiInfoCircle className="text-mint-600 mr-1" style={{ color: '#36B37E' }} />
        <span className="font-medium">Nguồn tham khảo:</span>
      </div>
      <ul className="space-y-1 ml-1">
        {sources.map((source, index) => (
          <li key={index} className="flex items-start">
            <span className="text-xs text-gray-500 mr-1">[{index + 1}]</span>
            <span className="text-gray-700">
              {source.title}
              {source.pages && <span className="text-gray-500 ml-1">(Trang {source.pages})</span>}
              {source.content_type === 'table' && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Bảng</span>}
              {source.content_type === 'figure' && <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Hình</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceReference;