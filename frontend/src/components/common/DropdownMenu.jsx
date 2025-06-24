import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DropdownMenu = ({ trigger, children, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { darkMode } = useTheme();

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
        <div className={`absolute ${positionClasses[position]} w-44 rounded-xl shadow-2xl z-20 py-2 border backdrop-blur-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-800/90 border-gray-700/50'
            : 'bg-white/90 border-gray-200/50'
        }`}>
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { onClick: () => setIsOpen(false) })
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;