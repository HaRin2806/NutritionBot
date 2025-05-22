import React, { useState, useRef, useEffect } from 'react';
import { BiDotsVerticalRounded, BiTrash, BiEdit } from 'react-icons/bi';

const ConversationItem = ({ 
  conversation, 
  onDelete, 
  onRename 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState('bottom'); // 'bottom' hoặc 'top'

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
        className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
      >
        <BiDotsVerticalRounded />
      </button>

      {isOpen && (
        <div
          className={`absolute ${menuPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'} right-0 w-40 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200`}
        >
          <button
            onClick={handleRename}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <BiEdit className="mr-2" />
            Đổi tên
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <BiTrash className="mr-2" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationItem;