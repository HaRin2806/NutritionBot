import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BiUser, BiChevronDown, BiCog, BiHistory, BiLogOut, BiMenu } from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Button } from '../common';

const Header = ({ 
  toggleSidebar, 
  isMobile, 
  isSidebarVisible, 
  extraButton 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userData, userAge, setUserAge, logout, showAgePrompt } = useApp();
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

  const handleAgeChange = () => {
    showAgePrompt(userAge).then((result) => {
      if (result.isConfirmed) {
        setUserAge(result.value);
      }
    });
  };

  return (
    <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-4">
        {isMobile && !isSidebarVisible && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
            style={{ color: '#36B37E' }}
          >
            {extraButton || <BiMenu className="text-xl" />}
          </button>
        )}

        <Link to="/" className="flex items-center text-mint-600" style={{ color: '#36B37E' }}>
          <span className="font-bold text-lg">🥗 Nutribot</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Age display */}
        {userAge && (
          <button
            onClick={handleAgeChange}
            className="px-3 py-1 bg-mint-100 text-mint-700 rounded-full text-sm hover:bg-mint-200 transition"
            style={{ backgroundColor: '#E6F7EF', color: '#36B37E' }}
          >
            <BiUser className="inline mr-1" />
            {userAge} tuổi
          </button>
        )}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-mint-600 focus:outline-none"
          >
            <span className="hidden sm:block mr-1">{userData?.name || 'Tài khoản'}</span>
            <BiUser className="text-2xl sm:ml-1" />
            <BiChevronDown className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-mint-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <BiCog className="mr-2" />
                Cài đặt
              </Link>
              <Link
                to="/history"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-mint-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <BiHistory className="mr-2" />
                Lịch sử
              </Link>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <BiLogOut className="mr-2" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;