import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BiUser, BiChevronDown, BiCog, BiHistory, BiLogOut, BiMenu, BiLeaf, BiShield } from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common';

const Header = ({
  toggleSidebar,
  isMobile,
  isSidebarVisible,
  extraButton,
  userAge,
  setUserAge, // Đây thực tế là handleAgeChange function
  canEditAge = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userData, logout } = useApp();
  const { darkMode, currentThemeConfig } = useTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAgeClick = () => {
    if (canEditAge && setUserAge) {
      setUserAge(); // Gọi handleAgeChange từ ChatPage
    }
  };

  return (
    <div className={`p-3 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors duration-300 ${darkMode
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-gray-200'
      }`}>
      <div className="flex items-center space-x-4">
        {isMobile && !isSidebarVisible && (
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-full transition-colors ${darkMode
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'hover:bg-gray-100'
              }`}
            style={{ color: currentThemeConfig?.primary }}
          >
            {extraButton || <BiMenu className="text-xl" />}
          </button>
        )}

        <Link
          to="/"
          className="flex items-center"
          style={{ color: currentThemeConfig?.primary || '#36B37E' }}
        >
          <BiLeaf className="text-2xl mr-2" />
          <span className="font-bold text-lg">Nutribot</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Admin Badge - Simple but elegant */}
        {userData?.is_admin && (
          <Link
            to="/admin/dashboard"
            className="flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 border border-opacity-20"
            style={{
              backgroundColor: `${currentThemeConfig?.primary || '#36B37E'}15`, // 15% opacity
              borderColor: currentThemeConfig?.primary || '#36B37E',
              color: currentThemeConfig?.primary || '#36B37E'
            }}
          >
            <BiShield className="w-4 h-4 mr-1" />
            Admin
          </Link>
        )}

        {/* Age display */}
        {userAge && (
          <button
            onClick={handleAgeClick}
            disabled={!canEditAge}
            className={`px-3 py-1 rounded-full text-sm transition flex items-center ${canEditAge
              ? `${darkMode ? 'hover:opacity-80' : 'hover:opacity-90'} cursor-pointer`
              : 'cursor-not-allowed opacity-75'
              }`}
            style={{
              backgroundColor: canEditAge
                ? (currentThemeConfig?.light || '#E6F7EF')
                : (darkMode ? '#374151' : '#F3F4F6'),
              color: canEditAge
                ? (currentThemeConfig?.primary || '#36B37E')
                : (darkMode ? '#9CA3AF' : '#6B7280')
            }}
            title={canEditAge ? "Nhấn để thay đổi độ tuổi" : "Không thể thay đổi độ tuổi khi đang có tin nhắn"}
          >
            {userAge} tuổi
          </button>
        )}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${darkMode
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: currentThemeConfig?.primary || '#36B37E' }}
            >
              {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block font-medium">
              {userData?.name || 'Người dùng'}
            </span>
            <BiChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''
              }`} />
          </button>

          {/* Dropdown menu */}
          {isMenuOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 border ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              <div className="py-1">
                <Link
                  to="/history"
                  className={`flex items-center px-4 py-2 text-sm transition-colors ${darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BiHistory className="w-4 h-4 mr-3" />
                  Lịch sử
                </Link>
                <Link
                  to="/settings"
                  className={`flex items-center px-4 py-2 text-sm transition-colors ${darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BiCog className="w-4 h-4 mr-3" />
                  Cài đặt
                </Link>
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-1`} />
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${darkMode
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-red-600 hover:bg-red-50'
                    }`}
                >
                  <BiLogOut className="w-4 h-4 mr-3" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;