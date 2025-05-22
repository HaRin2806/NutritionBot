import React, { useEffect, useRef } from 'react';
import { BiX } from 'react-icons/bi';

const Modal = ({ 
  isOpen,
  title,
  children,
  onClose,
  size = 'md', // sm, md, lg, xl
  footer = null,
  closeOnClickOutside = true,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);

  // Xử lý click outside để đóng modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Xử lý phím Escape
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Ngăn scroll khi modal mở
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      // Khôi phục scroll khi đóng modal
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  // Xác định classes cho kích thước
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
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
        ></div>

        {/* Modal */}
        <div 
          className={`inline-block w-full ${sizeClasses[size]} my-8 overflow-hidden text-left align-middle bg-white rounded-lg shadow-xl transform transition-all sm:my-12`}
          ref={modalRef}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <BiX className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-3 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;