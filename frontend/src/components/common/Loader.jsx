import React from 'react';

const Loader = ({ type = 'dots', size = 'md', color = 'mint', text = '' }) => {
  // Các classes cho kích thước
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Màu sắc
  const colorValue = color === 'mint' ? '#36B37E' : 
                      color === 'white' ? '#FFFFFF' : 
                      color === 'gray' ? '#6B7280' : '#36B37E';

  // Render loader dots (3 chấm nhảy)
  if (type === 'dots') {
    return (
      <div className="flex items-center justify-center">
        <div className="flex space-x-2">
          <div 
            className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
            style={{ backgroundColor: colorValue, animationDelay: '0ms' }}
          ></div>
          <div 
            className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
            style={{ backgroundColor: colorValue, animationDelay: '300ms' }}
          ></div>
          <div 
            className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
            style={{ backgroundColor: colorValue, animationDelay: '600ms' }}
          ></div>
        </div>
        {text && <span className="ml-3 text-gray-600">{text}</span>}
      </div>
    );
  }

  // Render spinner (quay tròn)
  if (type === 'spinner') {
    const spinnerSize = {
      sm: 'w-5 h-5',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
    };

    return (
      <div className="flex items-center justify-center">
        <div 
          className={`${spinnerSize[size]} border-4 border-current border-t-transparent rounded-full animate-spin`}
          style={{ borderColor: `${colorValue}`, borderTopColor: 'transparent' }}
        ></div>
        {text && <span className="ml-3 text-gray-600">{text}</span>}
      </div>
    );
  }

  // Render pulse (nhịp đập)
  if (type === 'pulse') {
    return (
      <div className="flex items-center justify-center">
        <div 
          className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`}
          style={{ backgroundColor: colorValue }}
        ></div>
        {text && <span className="ml-3 text-gray-600">{text}</span>}
      </div>
    );
  }

  // Mặc định trả về dots
  return (
    <div className="flex items-center justify-center">
      <div className="flex space-x-2">
        <div 
          className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
          style={{ backgroundColor: colorValue, animationDelay: '0ms' }}
        ></div>
        <div 
          className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
          style={{ backgroundColor: colorValue, animationDelay: '300ms' }}
        ></div>
        <div 
          className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
          style={{ backgroundColor: colorValue, animationDelay: '600ms' }}
        ></div>
      </div>
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  );
};

export default Loader;