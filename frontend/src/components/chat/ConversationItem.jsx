import React, { useState, useRef, useEffect } from 'react';
import { BiDotsVerticalRounded, BiTrash, BiEdit } from 'react-icons/bi';
import { useTheme } from '../../contexts/ThemeContext';

const ConversationItem = ({ 
  conversation, 
  onDelete, 
  onRename 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState('bottom');
  const { darkMode, currentThemeConfig } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Kiểm tra vị trí để quyết định hiển thị menu hướng lên hay xuống
  const toggleMenu = (e) => {
    e.stopPropagation(); // Ngăn event propagate lên parent element
    
    if (!isOpen) {
      const button = e.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const bottomSpace = windowHeight - buttonRect.bottom;

      // Nếu khoảng cách từ button đến bottom của trang < 100px, hiển thị menu ở phía trên
      setMenuPosition(bottomSpace < 100 ? 'top' : 'bottom');
    }

    setIsOpen(!isOpen);
  };

  const handleRename = (e) => {
    e.stopPropagation(); // Ngăn event propagate lên parent element
    onRename(conversation.id, conversation.title);
    setIsOpen(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Ngăn event propagate lên parent element
    onDelete(conversation.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`transition-all duration-300 p-2 rounded-lg hover:scale-110 ${
          darkMode 
            ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
        }`}
      >
        <BiDotsVerticalRounded className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            menuPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          } right-0 w-44 rounded-xl shadow-2xl z-30 py-2 border backdrop-blur-xl transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800/90 border-gray-700/50'
              : 'bg-white/90 border-gray-200/50'
          }`}
        >
          <button
            onClick={handleRename}
            className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-700/50'
                : 'text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            <BiEdit className="mr-3 w-4 h-4" />
            Đổi tên
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'text-red-400 hover:bg-red-900/20'
                : 'text-red-600 hover:bg-red-50/50'
            }`}
          >
            <BiTrash className="mr-3 w-4 h-4" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationItem;