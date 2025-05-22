import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  color = 'mint', // mint, gray, red
  size = 'md', // sm, md, lg
  fullWidth = false,
  outline = false,
  icon = null,
  iconPosition = 'left',
  disabled = false,
  className = ''
}) => {
  const getColorClasses = () => {
    if (outline) {
      switch (color) {
        case 'mint':
          return 'border-mint-600 text-mint-600 hover:bg-mint-50';
        case 'red':
          return 'border-red-600 text-red-600 hover:bg-red-50';
        default:
          return 'border-gray-300 text-gray-700 hover:bg-gray-50';
      }
    } else {
      switch (color) {
        case 'mint':
          return 'bg-mint-600 text-white hover:bg-mint-700 shadow-sm';
        case 'red':
          return 'bg-red-600 text-white hover:bg-red-700 shadow-sm';
        default:
          return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
      }
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-6 py-3';
      default:
        return 'text-sm px-4 py-2';
    }
  };

  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();
  const widthClasses = fullWidth ? 'w-full' : '';
  const outlineClass = outline ? 'border' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses}
        ${sizeClasses}
        ${widthClasses}
        ${outlineClass}
        rounded-md transition-all duration-200
        font-medium flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={color === 'mint' && !outline ? { backgroundColor: '#36B37E' } : {}}
    >
      {icon && iconPosition === 'left' && <span className="mr-1.5">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-1.5">{icon}</span>}
    </button>
  );
};

export default Button;