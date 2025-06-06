import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BiUser, BiChevronDown, BiCog, BiHistory, BiLogOut, BiMenu, BiLeaf, BiShield } from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
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
          <BiLeaf className="text-2xl mr-2" />
          <span className="font-bold text-lg">Nutribot</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Admin Badge */}
        {userData?.is_admin && (
          <Link
            to="/admin/dashboard"
            className="flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-sm hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm"
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
            className={`px-3 py-1 text-mint-700 rounded-full text-sm transition flex items-center ${
              canEditAge 
                ? 'bg-mint-100 hover:bg-mint-200 cursor-pointer' 
                : 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-75'
            }`}
            style={{ 
              backgroundColor: canEditAge ? '#E6F7EF' : '#F3F4F6', 
              color: canEditAge ? '#36B37E' : '#6B7280' 
            }}
            title={canEditAge ? 'Nhấn để thay đổi độ tuổi' : 'Không thể thay đổi độ tuổi khi đã có tin nhắn'}
          >
            <BiUser className="inline mr-1" />
            {userAge} tuổi
            {canEditAge && <BiChevronDown className="ml-1 w-3 h-3" />}
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
              {/* Admin Panel Access */}
              {userData?.is_admin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BiShield className="mr-2" />
                    Admin Panel
                  </Link>
                  <hr className="my-1 border-gray-200" />
                </>
              )}
              
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