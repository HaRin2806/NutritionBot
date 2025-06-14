import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  color = 'mint',
  size = 'md',
  fullWidth = false,
  outline = false,
  icon = null,
  iconPosition = 'left',
  disabled = false,
  className = ''
}) => {
  const getBaseStyles = () => {
    const base = {
      mint: {
        background: '#36B37E',
        color: '#FFFFFF',
        hoverBackground: '#2FAB76'
      },
      red: {
        background: '#EF4444', 
        color: '#FFFFFF',
        hoverBackground: '#DC2626'
      },
      gray: {
        background: '#E5E7EB',
        color: '#4B5563', 
        hoverBackground: '#D1D5DB'
      }
    };
    return base[color] || base.mint;
  };

  const getColorClasses = () => {
    if (outline) {
      switch (color) {
        case 'mint':
          return 'border-2 hover:bg-opacity-10';
        case 'red':
          return 'border-2 hover:bg-opacity-10';
        default:
          return 'border-2 hover:bg-gray-50';
      }
    } else {
      return 'shadow-sm';
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

  const styles = getBaseStyles();
  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();
  const widthClasses = fullWidth ? 'w-full' : '';

  const buttonStyle = outline ? {
    borderColor: styles.background,
    color: styles.background,
    backgroundColor: 'transparent'
  } : {
    backgroundColor: styles.background,
    color: styles.color
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      className={`
        ${colorClasses}
        ${sizeClasses}
        ${widthClasses}
        rounded-md transition-all duration-200
        font-medium flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:-translate-y-0.5'}
        ${className}
      `}
      onMouseEnter={(e) => {
        if (!disabled && !outline) {
          e.target.style.backgroundColor = styles.hoverBackground;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !outline) {
          e.target.style.backgroundColor = styles.background;
        }
      }}
    >
      {icon && iconPosition === 'left' && <span className="mr-1.5">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-1.5">{icon}</span>}
    </button>
  );
};

export default Button;