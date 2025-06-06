import React, { useState, useRef, useEffect } from 'react';
import { BiX, BiMenu, BiDotsVerticalRounded, BiClipboard, BiCheck } from 'react-icons/bi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { COLORS } from '../../utils';

// Base Button with optimized props
export const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'mint', // mint, red, gray
  size = 'md', // sm, md, lg
  outline = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  disabled = false,
  className = '',
  ...props
}) => {
  const variants = {
    mint: { bg: COLORS.MINT, hover: COLORS.MINT_DARK, text: 'white' },
    red: { bg: '#EF4444', hover: '#DC2626', text: 'white' },
    gray: { bg: '#E5E7EB', hover: '#D1D5DB', text: '#4B5563' }
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  const variantConfig = variants[variant];
  const baseStyle = outline 
    ? { borderColor: variantConfig.bg, color: variantConfig.bg, backgroundColor: 'transparent' }
    : { backgroundColor: variantConfig.bg, color: variantConfig.text };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      className={`
        ${outline ? 'border-2 hover:bg-opacity-10' : 'shadow-sm'}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-md transition-all duration-200 font-medium flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:-translate-y-0.5'}
        ${className}
      `}
      onMouseEnter={(e) => {
        if (!disabled && !outline) {
          e.target.style.backgroundColor = variantConfig.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !outline) {
          e.target.style.backgroundColor = variantConfig.bg;
        }
      }}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="mr-1.5">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-1.5">{icon}</span>}
    </button>
  );
};

// Enhanced Input with all features
export const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label = '',
  error = '',
  icon = null,
  disabled = false,
  required = false,
  readOnly = false,
  helpText = '',
  className = '',
  inputClassName = '',
  ...props
}) => (
  <div className={`mb-4 ${className}`}>
    {label && (
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        </div>
      )}
      
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`
          w-full rounded-lg border transition-colors duration-200
          ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2
          ${error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-mint-500 focus:border-mint-500'
          }
          ${disabled || readOnly 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white'
          }
          focus:outline-none focus:ring-2 
          placeholder-gray-400
          ${inputClassName}
        `}
        {...props}
      />
    </div>
    
    {helpText && !error && (
      <p className="mt-1 text-xs text-gray-500">{helpText}</p>
    )}
    
    {error && (
      <p className="mt-1 text-xs text-red-600">{error}</p>
    )}
  </div>
);

// Optimized Loader
export const Loader = ({ type = 'dots', size = 'md', color = 'mint', text = '' }) => {
  const sizeClasses = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  const colorValue = color === 'mint' ? COLORS.MINT : 
                     color === 'white' ? '#FFFFFF' : 
                     color === 'gray' ? '#6B7280' : COLORS.MINT;

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        const spinnerSize = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
        return (
          <div 
            className={`${spinnerSize[size]} border-4 border-current border-t-transparent rounded-full animate-spin`}
            style={{ borderColor: `${colorValue}`, borderTopColor: 'transparent' }}
          />
        );
      case 'pulse':
        return (
          <div 
            className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`}
            style={{ backgroundColor: colorValue }}
          />
        );
      default: // dots
        return (
          <div className="flex space-x-2">
            {[0, 300, 600].map((delay, i) => (
              <div 
                key={i}
                className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`} 
                style={{ backgroundColor: colorValue, animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center">
      {renderLoader()}
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  );
};

// Enhanced Modal
export const Modal = ({ 
  isOpen,
  title,
  children,
  onClose,
  size = 'md',
  footer = null,
  closeOnClickOutside = true,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  const sizeClasses = {
    sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', 
    xl: 'max-w-5xl', full: 'max-w-full mx-4'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity backdrop-blur-md bg-white bg-opacity-10" aria-hidden="true" />

        <div 
          className={`inline-block w-full ${sizeClasses[size]} my-8 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl transform transition-all sm:my-12`}
          ref={modalRef}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {showCloseButton && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors">
                <BiX className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="px-6 py-4">{children}</div>
          
          {footer && <div className="px-6 py-3 border-t border-gray-200">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

// Dropdown Menu Component
export const DropdownMenu = ({ trigger, children, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-1',
    'bottom-left': 'top-full left-0 mt-1',
    'top-right': 'bottom-full right-0 mb-1',
    'top-left': 'bottom-full left-0 mb-1'
  };

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div className={`absolute ${positionClasses[position]} w-44 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200`}>
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { onClick: () => setIsOpen(false) })
          )}
        </div>
      )}
    </div>
  );
};

// Code Block Component
export const CodeBlock = ({ language, value, showLineNumbers = true }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code"
      >
        {copied ? <BiCheck className="w-5 h-5" /> : <BiClipboard className="w-5 h-5" />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        showLineNumbers={showLineNumbers}
        wrapLongLines={true}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.9rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

// Page Container
export const PageContainer = ({ 
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

// Header Component
export const Header = ({ 
  title,
  subtitle,
  actions,
  userData,
  onMenuClick,
  showMobileMenu = false
}) => (
  <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
    <div className="flex items-center space-x-4">
      {showMobileMenu && (
        <button onClick={onMenuClick} className="p-2 text-mint-600 hover:bg-mint-50 rounded-full transition">
          <BiMenu className="text-xl" />
        </button>
      )}
      <div>
        {title && <h1 className="text-xl font-bold">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      {actions}
    </div>
  </div>
);