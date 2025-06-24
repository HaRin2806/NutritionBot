// frontend/src/pages/SettingsPage.jsx - FULL VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiUser, BiLock, BiPalette, BiCheckCircle, BiEdit, BiShield,
  BiMoon, BiSun, BiSave, BiX, BiCamera, BiPhone, BiMailSend,
  BiKey, BiShow, BiHide, BiArrowBack
} from 'react-icons/bi';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Header } from '../components/layout';
import { Button, Input, Modal } from '../components/common';
import config from '../config';
import { feedbackService } from '../services';
import { BiStar, BiMessageSquareDetail, BiSend } from 'react-icons/bi';

const SettingsPage = () => {
  const {
    userData,
    logout,
    isLoading: isLoadingAuth,
    updateProfile,
    changePassword,
    requireAuth,
    showSuccess,
    showError,
    showConfirm
  } = useApp();

  const { theme, darkMode, updateTheme, toggleDarkMode, currentThemeConfig } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    gender: '',
    avatar: null,
    phone: ''
  });

  const [formData, setFormData] = useState({ ...profileData });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    category: '',
    title: '',
    content: ''
  });
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [feedbackCategories, setFeedbackCategories] = useState([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isLoadingAuth && !userData) {
      requireAuth(() => navigate('/login'));
    }
  }, [userData, isLoadingAuth, navigate, requireAuth]);

  // Load user data
  useEffect(() => {
    if (userData) {
      const newProfileData = {
        fullName: userData.name || '',
        email: userData.email || '',
        gender: userData.gender || '',
        avatar: null,
        phone: userData.phone || ''
      };

      setProfileData(newProfileData);
      setFormData(newProfileData);
    }
  }, [userData]);

  // Load feedback data when feedback tab is active
  useEffect(() => {
    const loadFeedbackData = async () => {
      try {
        const [categoriesRes, userFeedbackRes] = await Promise.all([
          feedbackService.getCategories(),
          feedbackService.getUserFeedback()
        ]);

        if (categoriesRes.success) {
          setFeedbackCategories(categoriesRes.categories);
        }

        if (userFeedbackRes.success) {
          setUserFeedbacks(userFeedbackRes.feedbacks);
        }
      } catch (error) {
        console.error('Error loading feedback data:', error);
      }
    };

    if (userData && activeTab === 'feedback') {
      loadFeedbackData();
    }
  }, [userData, activeTab]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleThemeChange = (newTheme) => {
    updateTheme(newTheme);
    showSuccess(`Đã chuyển sang theme ${newTheme}!`);
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    showSuccess(`Đã ${!darkMode ? 'bật' : 'tắt'} chế độ tối!`);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackData.category || !feedbackData.content.trim()) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (feedbackData.content.trim().length < 10) {
      showError('Nội dung phải có ít nhất 10 ký tự');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const result = await feedbackService.createFeedback(feedbackData);

      if (result.success) {
        showSuccess('Cảm ơn bạn đã đóng góp ý kiến!');
        setFeedbackData({ rating: 5, category: '', title: '', content: '' });

        // Reload user feedbacks
        const userFeedbackRes = await feedbackService.getUserFeedback();
        if (userFeedbackRes.success) {
          setUserFeedbacks(userFeedbackRes.feedbacks);
        }
      } else {
        showError(result.error || 'Không thể gửi đóng góp');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showError('Có lỗi xảy ra khi gửi đóng góp');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        name: formData.fullName,
        gender: formData.gender,
        phone: formData.phone
      });

      if (result.success) {
        setProfileData(formData);
        setIsEditing(false);
        setErrors({});
        showSuccess('Thông tin cá nhân đã được cập nhật thành công');
      } else {
        showError(result.error || 'Không thể cập nhật thông tin cá nhân');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({});
        showSuccess('Mật khẩu đã được thay đổi thành công');
      } else {
        showError(result.error || 'Không thể thay đổi mật khẩu');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Có lỗi xảy ra khi thay đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await showConfirm({
      title: 'Đăng xuất',
      text: 'Bạn có chắc chắn muốn đăng xuất?',
      icon: 'question'
    });

    if (result.isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Thông tin cá nhân</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 rounded-lg transition-all hover:shadow-lg"
            style={{
              backgroundColor: isEditing ? '#ef4444' : currentThemeConfig?.primary,
              color: 'white'
            }}
          >
            {isEditing ? <BiX className="mr-2" /> : <BiEdit className="mr-2" />}
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex items-center mb-8">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              style={{ backgroundColor: currentThemeConfig?.primary }}
            >
              {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all">
                <BiCamera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          <div className="ml-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
              {userData?.name || 'Người dùng'}
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              {userData?.email}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BiUser className="inline mr-2" />
              Họ và tên
            </label>
            <Input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleProfileChange}
              disabled={!isEditing}
              error={errors.fullName}
              className="w-full"
              placeholder="Nhập họ và tên"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BiMailSend className="inline mr-2" />
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              disabled={true}
              className="w-full bg-gray-100 dark:bg-gray-700"
              placeholder="Email"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email không thể thay đổi
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BiPhone className="inline mr-2" />
              Số điện thoại
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleProfileChange}
              disabled={!isEditing}
              className="w-full"
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Giới tính
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleProfileChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 transition-all"
              style={{
                focusRingColor: currentThemeConfig?.primary,
                borderColor: errors.gender ? '#ef4444' : undefined
              }}
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end mt-8 space-x-4">
            <button
              onClick={() => {
                setFormData(profileData);
                setIsEditing(false);
                setErrors({});
              }}
              className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Hủy
            </button>
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: currentThemeConfig?.primary }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang lưu...
                </div>
              ) : (
                <div className="flex items-center">
                  <BiSave className="mr-2" />
                  Lưu thay đổi
                </div>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Thay đổi mật khẩu</h3>

        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BiKey className="inline mr-2" />
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={errors.currentPassword}
                className="w-full pr-12"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showCurrentPassword ? <BiHide /> : <BiShow />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BiKey className="inline mr-2" />
              Mật khẩu mới
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={errors.newPassword}
                className="w-full pr-12"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showNewPassword ? <BiHide /> : <BiShow />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BiKey className="inline mr-2" />
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={errors.confirmPassword}
                className="w-full pr-12"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <BiHide /> : <BiShow />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={isLoading}
              className="w-full py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: currentThemeConfig?.primary }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang thay đổi...
                </div>
              ) : (
                'Thay đổi mật khẩu'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Tùy chỉnh giao diện</h3>

        {/* Dark Mode Toggle */}
        <div className="mb-10">
          <h4 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Chế độ hiển thị</h4>
          <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 border border-gray-200/50 dark:border-gray-600/50">
            <div className="flex items-center space-x-4">
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: currentThemeConfig?.light }}
              >
                {darkMode ? <BiMoon className="w-6 h-6 text-blue-600" /> : <BiSun className="w-6 h-6 text-yellow-600" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                  {darkMode ? 'Chế độ tối' : 'Chế độ sáng'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {darkMode ? 'Giao diện tối, dễ nhìn trong môi trường ít ánh sáng' : 'Giao diện sáng, phù hợp cho ban ngày'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDarkModeToggle}
              className={`relative inline-flex items-center h-8 rounded-full w-14 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 shadow-lg ${darkMode ? 'shadow-blue-500/25' : 'shadow-gray-300/50'
                }`}
              style={{
                backgroundColor: darkMode ? currentThemeConfig?.primary : '#e5e7eb',
                focusRingColor: `${currentThemeConfig?.primary}40`
              }}
            >
              <span
                className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 shadow-lg ${darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Theme Colors */}
        <div>
          <h4 className="font-semibold text-lg text-gray-800 dark:text-white mb-6">Màu sắc chủ đạo</h4>
          <div className="grid grid-cols-5 gap-6">
            {Object.entries(config.themes).map(([colorKey, colorConfig]) => (
              <div
                key={colorKey}
                className={`relative cursor-pointer rounded-2xl p-6 h-24 flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${theme === colorKey ? 'ring-4 ring-offset-4 dark:ring-offset-gray-800 scale-110 shadow-2xl' : 'hover:shadow-lg'
                  }`}
                style={{
                  background: `linear-gradient(135deg, ${colorConfig.primary} 0%, ${colorConfig.dark || colorConfig.primary} 100%)`,
                  ringColor: theme === colorKey ? colorConfig.primary : 'transparent',
                }}
                onClick={() => handleThemeChange(colorKey)}
              >
                {theme === colorKey && (
                  <BiCheckCircle className="w-8 h-8 text-white drop-shadow-lg animate-pulse" />
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-center">
            Chọn màu chủ đạo cho giao diện ứng dụng
          </p>

          {/* Theme Preview */}
          <div className="mt-8 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <h5 className="font-medium text-gray-800 dark:text-white mb-4">Xem trước theme hiện tại</h5>
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 rounded-lg shadow-lg"
                style={{ backgroundColor: currentThemeConfig?.primary }}
              />
              <div
                className="w-12 h-12 rounded-lg shadow-lg"
                style={{ backgroundColor: currentThemeConfig?.light }}
              />
              <div
                className="w-12 h-12 rounded-lg shadow-lg"
                style={{ backgroundColor: currentThemeConfig?.dark }}
              />
              <div className="ml-4">
                <p className="font-medium text-gray-800 dark:text-white">Theme: {theme}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Primary: {currentThemeConfig?.primary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

   const renderFeedbackTab = () => (
    <div className="space-y-8">
      {/* Form gửi feedback mới */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Đóng góp ý kiến</h3>

        <div className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Đánh giá tổng thể
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                  className={`text-2xl transition-colors ${star <= feedbackData.rating
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                    }`}
                >
                  <BiStar />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {feedbackData.rating}/5 sao
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Danh mục *
            </label>
            <select
              value={feedbackData.category}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 transition-all"
              style={{
                focusRingColor: currentThemeConfig?.primary,
                borderColor: !feedbackData.category ? '#ef4444' : undefined
              }}
            >
              <option value="">Chọn danh mục</option>
              {feedbackCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiêu đề (không bắt buộc)
            </label>
            <Input
              type="text"
              value={feedbackData.title}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nhập tiêu đề ngắn gọn..."
              className="w-full"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nội dung đóng góp *
            </label>
            <textarea
              value={feedbackData.content}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Chia sẻ ý kiến, đánh giá hoặc đề xuất của bạn..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border transition-all resize-none focus:outline-none focus:ring-2 ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              style={{
                focusRingColor: currentThemeConfig?.primary,
                borderColor: !feedbackData.content.trim() ? '#ef4444' : undefined
              }}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tối thiểu 10 ký tự ({feedbackData.content.length}/10)
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingFeedback || !feedbackData.category || !feedbackData.content.trim()}
              className="px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: currentThemeConfig?.primary }}
            >
              {isSubmittingFeedback ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang gửi...
                </div>
              ) : (
                <div className="flex items-center">
                  <BiSend className="mr-2" />
                  Gửi đóng góp
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Lịch sử đóng góp */}
      {userFeedbacks.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Lịch sử đóng góp</h3>

          <div className="space-y-4">
            {userFeedbacks.map((feedback) => (
              <div key={feedback.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <BiStar
                          key={star}
                          className={`text-sm ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feedbackCategories.find(c => c.value === feedback.category)?.label || feedback.category}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    {feedback.status === 'pending' ? 'Đang xử lý' :
                      feedback.status === 'reviewed' ? 'Đã xem' : 'Đã giải quyết'}
                  </span>
                </div>

                {feedback.title && (
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {feedback.title}
                  </h4>
                )}

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {feedback.content}
                </p>

                {feedback.admin_response && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phản hồi từ admin:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feedback.admin_response}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {new Date(feedback.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'password':
        return renderPasswordTab();
      case 'appearance':
        return renderAppearanceTab();
       case 'feedback':
        return renderFeedbackTab();
      default:
        return renderProfileTab();
    }
  };

  if (isLoadingAuth || !userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: currentThemeConfig?.primary }}
          />
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
          : `linear-gradient(135deg, ${currentThemeConfig?.light}20 0%, #ffffff 50%, #f8fafc 100%)`
      }}
    >
      <Header userData={userData} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-6 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
        >
          <BiArrowBack className="mr-2" />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 sticky top-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Cài đặt</h2>
                <nav className="space-y-2">
                  <button
                    className={`w-full px-4 py-3 text-left flex items-center space-x-3 rounded-xl transition-all duration-200 ${activeTab === 'profile'
                        ? 'text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    onClick={() => setActiveTab('profile')}
                    style={activeTab === 'profile' ? {
                      background: `linear-gradient(135deg, ${currentThemeConfig?.primary} 0%, ${currentThemeConfig?.dark} 100%)`
                    } : {}}
                  >
                    <BiUser className="flex-shrink-0 w-5 h-5" />
                    <span className="font-medium">Hồ sơ</span>
                  </button>

                  <button
                    className={`w-full px-4 py-3 text-left flex items-center space-x-3 rounded-xl transition-all duration-200 ${activeTab === 'password'
                        ? 'text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    onClick={() => setActiveTab('password')}
                    style={activeTab === 'password' ? {
                      background: `linear-gradient(135deg, ${currentThemeConfig?.primary} 0%, ${currentThemeConfig?.dark} 100%)`
                    } : {}}
                  >
                    <BiLock className="flex-shrink-0 w-5 h-5" />
                    <span className="font-medium">Mật khẩu</span>
                  </button>

                  <button
                    className={`w-full px-4 py-3 text-left flex items-center space-x-3 rounded-xl transition-all duration-200 ${activeTab === 'appearance'
                        ? 'text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    onClick={() => setActiveTab('appearance')}
                    style={activeTab === 'appearance' ? {
                      background: `linear-gradient(135deg, ${currentThemeConfig?.primary} 0%, ${currentThemeConfig?.dark} 100%)`
                    } : {}}
                  >
                    <BiPalette className="flex-shrink-0 w-5 h-5" />
                    <span className="font-medium">Giao diện</span>
                  </button>
                  <button
                    className={`w-full px-4 py-3 text-left flex items-center space-x-3 rounded-xl transition-all duration-200 ${activeTab === 'feedback'
                        ? 'text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    onClick={() => setActiveTab('feedback')}
                    style={activeTab === 'feedback' ? {
                      background: `linear-gradient(135deg, ${currentThemeConfig?.primary} 0%, ${currentThemeConfig?.dark} 100%)`
                    } : {}}
                  >
                    <BiMessageSquareDetail className="flex-shrink-0 w-5 h-5" />
                    <span className="font-medium">Đóng góp</span>
                  </button>
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left flex items-center space-x-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                    >
                      <BiShield className="flex-shrink-0 w-5 h-5" />
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;