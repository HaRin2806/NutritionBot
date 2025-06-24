import React from 'react';

const PageContainer = ({ 
  children, 
  withPadding = true, 
  className = '', 
  style = {} 
}) => (
  <div 
    className={`
      min-h-[calc(100vh-64px)] 
      ${withPadding ? 'py-6 px-4 sm:px-6 lg:px-8' : ''} 
      ${className}
    `}
    style={style}
  >
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </div>
);

export default PageContainer;