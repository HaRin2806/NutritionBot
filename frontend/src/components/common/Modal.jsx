import React, { useEffect, useRef } from 'react';
import { BiX } from 'react-icons/bi';
import { useTheme } from '../../contexts/ThemeContext';

const Modal = ({ 
  isOpen,
  title,
  children,
  onClose,
  size = 'md',
  footer = null,
  closeOnClickOutside = true,
  showCloseButton = true
}) => {
  const { darkMode, currentThemeConfig } = useTheme();
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
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity backdrop-blur-md"
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.3)'
          }}
          aria-hidden="true"
        ></div>

        <div 
          className={`inline-block w-full ${sizeClasses[size]} my-8 overflow-hidden text-left align-middle rounded-lg shadow-xl transform transition-all sm:my-12`}
          style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
          }}
          ref={modalRef}
        >
          <div 
            className="flex items-center justify-between px-6 pt-5 pb-3 border-b"
            style={{
              borderColor: darkMode ? '#374151' : '#e5e7eb'
            }}
          >
            <h3 
              className="text-lg font-medium"
              style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
            >
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="focus:outline-none transition-colors p-1 rounded"
                style={{
                  color: darkMode ? '#9ca3af' : '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <BiX className="w-6 h-6" />
              </button>
            )}
          </div>

          <div 
            className="px-6 py-4"
            style={{
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              color: darkMode ? '#f3f4f6' : '#111827'
            }}
          >
            {children}
          </div>

          {footer && (
            <div 
              className="px-6 py-3 border-t"
              style={{
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                backgroundColor: darkMode ? '#1f2937' : '#ffffff'
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;