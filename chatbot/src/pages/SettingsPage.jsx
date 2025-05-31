// pages/SettingsPage.jsx - VERSION ĐÃ SỬA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiUser, BiLock, BiPalette, BiCheckCircle, BiEdit, BiShield, BiMoon, BiSun } from 'react-icons/bi';
import { useApp } from '../hooks/useContext';
import { Header } from '../components/layout';
import { Button, Input } from '../components/common';
import config from '../config';

const SettingsPage = () => {
  const { 
    userData, 
    logout, 
    isLoading: isLoadingAuth, 
    updateProfile, 
    changePassword,
    requireAuth,
    showSuccess,
    showError
  } = useApp();
  
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAge, setUserAge] = useState(null);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'mint';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

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

  // Apply theme
  useEffect(() => {
    document.documentElement.className = '';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Apply theme colors if config.themes exists
    if (config.themes) {
      const root = document.documentElement;
      const themeColors = config.themes[theme];
      if (themeColors) {
        root.style.setProperty('--color-primary', themeColors.primary);
        root.style.setProperty('--color-primary-light', themeColors.light);
        root.style.setProperty('--color-primary-dark', themeColors.dark);
      }
    }
  }, [theme, darkMode]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      showError('Đã có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        showSuccess('Mật khẩu đã được cập nhật thành công');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({});
      } else {
        showError(result.error || 'Không thể cập nhật mật khẩu');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Đã có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showError('Vui lòng chọn file hình ảnh');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        if (isLoadingAuth) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải...</p>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Thông tin cá nhân</h3>
              <Button
                onClick={() => {
                  if (isEditing) {
                    setFormData({ ...profileData });
                    setErrors({});
                  }
                  setIsEditing(!isEditing);
                }}
                color={isEditing ? "gray" : "mint"}
                outline={true}
                icon={<BiEdit className="mr-1" />}
              >
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3">
                  {(formData.avatar || profileData.avatar) ? (
                    <img
                      src={formData.avatar || profileData.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-mint-100 text-mint-600 dark:bg-mint-900 dark:text-mint-300" 
                         style={{ backgroundColor: darkMode ? '#1a4d3a' : '#E6F7EF', color: darkMode ? '#86efac' : '#36B37E' }}>
                      <BiUser className="w-16 h-16" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-2">
                    <label
                      htmlFor="avatar-upload"
                      className="bg-mint-100 text-mint-700 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-mint-200 dark:bg-mint-900 dark:text-mint-300 dark:hover:bg-mint-800"
                      style={{ backgroundColor: darkMode ? '#1a4d3a' : '#E6F7EF', color: darkMode ? '#86efac' : '#36B37E' }}
                    >
                      Thay đổi ảnh
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      label="Họ và tên"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleProfileChange}
                      error={errors.fullName}
                      required
                    />

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      error={errors.email}
                      disabled
                      helpText="Email không thể thay đổi"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Giới tính
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <Input
                      label="Số điện thoại"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleProfileChange}
                    />

                    <div className="pt-3">
                      <Button
                        onClick={handleSaveProfile}
                        color="mint"
                        disabled={isLoading}
                        className="mr-2"
                      >
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>

                      <Button
                        onClick={() => {
                          setFormData({ ...profileData });
                          setIsEditing(false);
                          setErrors({});
                        }}
                        color="gray"
                        outline
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Họ và tên</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profileData.fullName}</p>
                    </div>
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profileData.email}</p>
                    </div>
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Giới tính</p>
                      <p className="text-gray-800 dark:text-white font-medium">
                        {profileData.gender === 'male' ? 'Nam' : 
                         profileData.gender === 'female' ? 'Nữ' : 
                         profileData.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profileData.phone || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tài khoản được tạo</p>
                      <p className="text-gray-800 dark:text-white font-medium">
                        {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Thay đổi mật khẩu</h3>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <Input
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={errors.currentPassword}
                required
              />

              <Input
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={errors.newPassword}
                helpText="Mật khẩu phải có ít nhất 6 ký tự"
                required
              />

              <Input
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={errors.confirmPassword}
                required
              />

              <div className="pt-3">
                <Button
                  type="submit"
                  color="mint"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </div>
            </form>
          </div>
        );

      case 'appearance':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Tùy chỉnh giao diện</h3>
            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-3">Chế độ hiển thị</h4>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center">
                    {darkMode ? <BiMoon className="w-5 h-5 mr-2 text-blue-500" /> : <BiSun className="w-5 h-5 mr-2 text-yellow-500" />}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {darkMode ? 'Chế độ tối' : 'Chế độ sáng'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {darkMode ? 'Giao diện tối, dễ nhìn trong môi trường ít ánh sáng' : 'Giao diện sáng, phù hợp cho ban ngày'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDarkModeToggle}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2 ${
                      darkMode ? 'bg-mint-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Theme Colors */}
              {config.themes && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-3">Màu sắc chủ đạo</h4>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.keys(config.themes).map(color => (
                      <div
                        key={color}
                        className={`cursor-pointer rounded-lg p-4 h-16 flex items-center justify-center transition-all ${
                          theme === color ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800' : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: config.themes[color].primary,
                          color: 'white',
                          ringColor: theme === color ? config.themes[color].primary : 'transparent',
                        }}
                        onClick={() => handleThemeChange(color)}
                      >
                        {theme === color && <BiCheckCircle className="w-6 h-6" />}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Chọn màu chủ đạo cho giao diện ứng dụng
                  </p>
                </div>
              )}

              <div className="pt-3">
                <Button
                  color="mint"
                  onClick={() => showSuccess('Cài đặt giao diện đã được lưu!')}
                >
                  Lưu cài đặt
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`} 
         style={{ backgroundColor: darkMode ? '#111827' : '#F7FFFA' }}>
      {/* Header */}
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
      />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cài đặt tài khoản</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <nav className="flex flex-col">
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700 dark:bg-mint-900 dark:text-mint-300' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('profile')}
                  style={activeTab === 'profile' ? { 
                    backgroundColor: darkMode ? '#1a4d3a' : '#E6F7EF', 
                    borderLeftColor: '#36B37E', 
                    color: darkMode ? '#86efac' : '#36B37E' 
                  } : {}}
                >
                  <BiUser className="flex-shrink-0" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 transition-colors ${
                    activeTab === 'password' 
                      ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700 dark:bg-mint-900 dark:text-mint-300' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('password')}
                  style={activeTab === 'password' ? { 
                    backgroundColor: darkMode ? '#1a4d3a' : '#E6F7EF', 
                    borderLeftColor: '#36B37E', 
                    color: darkMode ? '#86efac' : '#36B37E' 
                  } : {}}
                >
                  <BiLock className="flex-shrink-0" />
                  <span>Mật khẩu</span>
                </button>
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 transition-colors ${
                    activeTab === 'appearance' 
                      ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700 dark:bg-mint-900 dark:text-mint-300' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('appearance')}
                  style={activeTab === 'appearance' ? { 
                    backgroundColor: darkMode ? '#1a4d3a' : '#E6F7EF', 
                    borderLeftColor: '#36B37E', 
                    color: darkMode ? '#86efac' : '#36B37E' 
                  } : {}}
                >
                  <BiPalette className="flex-shrink-0" />
                  <span>Giao diện</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-3 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  <BiShield className="flex-shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;