import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BiUser,
  BiChevronDown,
  BiCog,
  BiHistory,
  BiLogOut,
  BiMenu,
  BiX
} from 'react-icons/bi';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { Button } from '../common';

// NutriBot Logo Component
const NutribotLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#36B37E" fillOpacity="0.2" />
    <path d="M17.5 9.5C17.5 11.08 16.58 12.45 15.25 13.22C14.58 13.62 13.8 13.85 13 13.85C10.51 13.85 8.5 11.84 8.5 9.35C8.5 8.55 8.73 7.77 9.13 7.1C9.9 5.77 11.27 4.85 12.85 4.85C15.43 4.85 17.5 6.92 17.5 9.5Z" fill="#36B37E" stroke="#36B37E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 14.5C6.5 16.99 8.51 19 11 19C11.8 19 12.58 18.77 13.25 18.37C14.58 17.6 15.5 16.23 15.5 14.65C15.5 12.07 13.43 10 10.85 10C9.27 10 7.9 10.92 7.13 12.25C6.73 12.92 6.5 13.7 6.5 14.5Z" fill="#36B37E" stroke="#36B37E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Header = ({ 
  userAge, 
  setUserAge, 
  toggleSidebar, 
  isMobile, 
  isSidebarVisible, 
  activeConversation, 
  updateConversationAge,
  extraButton = null
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userData, logout } = useAuth();
  const { showAgePrompt, showLogoutConfirm } = useToast();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý thay đổi tuổi
  const handleAgeChange = () => {
    // Kiểm tra nếu đang trong một cuộc hội thoại có age_context và có tin nhắn
    if (activeConversation && activeConversation.id &&
      activeConversation.age_context &&
      activeConversation.messages &&
      activeConversation.messages.length > 0) {
      showToast.showCustomMessage({
        title: 'Không thể thay đổi độ tuổi',
        text: 'Cuộc trò chuyện này đã có tin nhắn với độ tuổi cụ thể. Bạn cần tạo cuộc trò chuyện mới để sử dụng độ tuổi khác.',
        icon: 'warning',
        confirmButtonText: 'Đã hiểu'
      });
      return;
    }

    showAgePrompt(userAge).then((result) => {
      if (result.isConfirmed) {
        const newAge = result.value;
        setUserAge(newAge);

        // Nếu đang trong cuộc hội thoại, cập nhật age_context
        if (activeConversation && activeConversation.id && userData && userData.id) {
          updateConversationAge(activeConversation.id, newAge, userData.id);
        }
      }
    });
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    showLogoutConfirm(logout);
  };

  return (
    <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Thêm điều kiện hiển thị nút toggle sidebar chỉ khi sidebar đóng hoặc không phải mobile */}
        {isMobile !== undefined && (isMobile && !isSidebarVisible) && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-full transition"
            style={{ color: '#36B37E' }}
          >
            {extraButton || <BiMenu className="text-xl" />}
          </button>
        )}

        <Link to="/" className="flex items-center text-mint-600" style={{ color: '#36B37E' }}>
          <NutribotLogo />
          <span className="font-bold text-lg ml-2 hidden sm:block">Nutribot</span>
        </Link>
      </div>

      <div className="flex items-center">
        {/* Hiển thị tuổi hiện tại */}
        {userAge && (
          <button
            onClick={handleAgeChange}
            className="mr-4 px-3 py-1 bg-mint-100 text-mint-700 rounded-full text-sm flex items-center hover:bg-mint-200 transition"
            style={{ backgroundColor: '#E6F7EF', color: '#36B37E' }}
          >
            <BiUser className="mr-1" />
            {userAge} tuổi
          </button>
        )}

        {/* Menu người dùng */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-mint-600 focus:outline-none"
          >
            <span className="hidden sm:block mr-1">{userData ? userData.name : 'Tài khoản'}</span>
            <BiUser className="text-2xl sm:ml-1" />
            <BiChevronDown className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-mint-50 hover:text-mint-700"
              >
                <BiCog className="mr-2" />
                Quản lý tài khoản
              </Link>
              <Link
                to="/history"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-mint-50 hover:text-mint-700"
              >
                <BiHistory className="mr-2" />
                Lịch sử trò chuyện
              </Link>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
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