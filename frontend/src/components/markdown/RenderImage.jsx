import React, { useState } from 'react';
import { processImagePath } from '../../utils/index';

const RenderImage = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Xử lý đường dẫn hình ảnh
  const imgSrc = processImagePath(src);

  return (
    <span className="block my-4">
      {loading && (
        <span className="flex items-center justify-center h-24 bg-gray-100 rounded-lg animate-pulse">
          <span className="text-gray-500">Đang tải hình ảnh...</span>
        </span>
      )}
      {error && (
        <span className="flex items-center justify-center h-24 bg-red-50 rounded-lg">
          <span className="text-red-500">Không thể tải hình ảnh</span>
        </span>
      )}
      <img
        src={imgSrc}
        alt={alt || "Hình ảnh"}
        className={`max-w-full rounded-lg border border-gray-200 shadow-sm ${loading ? 'hidden' : 'block'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {alt && !error && <span className="block text-center text-sm text-gray-600 mt-1">{alt}</span>}
    </span>
  );
};

export default RenderImage;