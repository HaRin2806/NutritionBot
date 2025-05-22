import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiUser, BiLock, BiPalette, BiCheckCircle, BiEdit, BiShield } from 'react-icons/bi';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { Header } from '../components/layout';
import { Button, Input } from '../components/common';
import config from '../config';

const SettingsPage = () => {
  const { userData, updateProfile, changePassword, logout } = useAuth();
  const { showSuccess, showError, showPrompt } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAge, setUserAge] = useState(null);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    avatar: null,
    phone: ''
  });

  const [formData, setFormData] = useState({ ...profileData });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [theme, setTheme] = useState('mint');

  // Lấy thông tin người dùng khi vào trang
  useEffect(() => {
    if (userData) {
      setProfileData({
        fullName: userData.name || '',
        email: userData.email || '',
        avatar: null,
        phone: userData.phone || ''
      });
      setFormData({
        fullName: userData.name || '',
        email: userData.email || '',
        avatar: null,
        phone: userData.phone || ''
      });
    } else {
      navigate('/login');
    }
  }, [userData, navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      showError('Vui lòng nhập họ tên');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        name: formData.fullName,
        phone: formData.phone
      });

      if (result.success) {
        setProfileData(formData);
        setIsEditing(false);
        showSuccess('Thông tin cá nhân đã được cập nhật');
      } else {
        showError(result.error || 'Không thể cập nhật thông tin cá nhân');
      }
    } catch (error) {
      showError(error.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu
    if (!passwordData.currentPassword) {
      showError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!passwordData.newPassword) {
      showError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(passwordData);

      if (result.success) {
        showSuccess('Mật khẩu đã được cập nhật');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showError(result.error || 'Không thể cập nhật mật khẩu');
      }
    } catch (error) {
      showError(error.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Đọc file thành URL để hiển thị preview
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

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    // Nếu đang chỉnh sửa profile và chuyển tab, hỏi xác nhận
    if (isEditing && activeTab === 'profile' && tab !== 'profile') {
      showPrompt({
        title: 'Bạn có muốn lưu thay đổi?',
        text: 'Các thay đổi sẽ bị mất nếu bạn rời khỏi tab này.',
        confirmButtonText: 'Lưu',
        cancelButtonText: 'Không lưu'
      }).then((result) => {
        if (result.isConfirmed) {
          handleSaveProfile();
        } else {
          setFormData({ ...profileData });
        }
        setIsEditing(false);
        setActiveTab(tab);
      });
    } else {
      setActiveTab(tab);
    }
  };

  // Cập nhật độ tuổi - placeholder, không dùng thực tế trong SettingsPage
  const updateConversationAge = () => { };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Thông tin cá nhân</h3>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                color={isEditing ? "gray" : "mint"}
                outline={true}
                icon={<BiEdit className="mr-1" />}
              >
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-3">
                  {(formData.avatar || profileData.avatar) ? (
                    <img
                      src={formData.avatar || profileData.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-mint-100 text-mint-600" style={{ backgroundColor: '#E6F7EF', color: '#36B37E' }}>
                      <BiUser className="w-16 h-16" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-2">
                    <label
                      htmlFor="avatar-upload"
                      className="bg-mint-100 text-mint-700 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-mint-200"
                      style={{ backgroundColor: '#E6F7EF', color: '#36B37E' }}
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
                      required
                    />

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      disabled
                      helpText="Email không thể thay đổi"
                    />

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
                    <div className="border-b border-gray-200 pb-3">
                      <p className="text-sm text-gray-500">Họ và tên</p>
                      <p className="text-gray-800 font-medium">{profileData.fullName}</p>
                    </div>
                    <div className="border-b border-gray-200 pb-3">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800 font-medium">{profileData.email}</p>
                    </div>
                    <div className="border-b border-gray-200 pb-3">
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="text-gray-800 font-medium">{profileData.phone || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-gray-500">Tài khoản được tạo</p>
                      <p className="text-gray-800 font-medium">01/01/2023</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Thay đổi mật khẩu</h3>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <Input
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />

              <Input
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                helpText="Mật khẩu phải có ít nhất 8 ký tự"
                required
              />

              <Input
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Tùy chỉnh giao diện</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Màu sắc chủ đạo</h4>
                <div className="grid grid-cols-5 gap-4">
                  {Object.keys(config.themes).map(color => (
                    <div
                      key={color}
                      className={`cursor-pointer rounded-lg p-4 h-16 flex items-center justify-center transition-all ${theme === color ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}`}
                      style={{
                        backgroundColor: config.themes[color].primary,
                        color: 'white',
                        boxShadow: theme === color ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
                        ringColor: config.themes[color].primary,
                      }}
                      onClick={() => setTheme(color)}
                    >
                      {theme === color && <BiCheckCircle className="w-6 h-6" />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-3">Chế độ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2"
                    style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                  >
                    <div className="w-full h-20 bg-white border border-gray-200 rounded mb-2"></div>
                    <span className="font-medium">Sáng</span>
                  </button>
                  <button
                    className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2"
                    style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                  >
                    <div className="w-full h-20 bg-gray-800 border border-gray-700 rounded mb-2"></div>
                    <span className="font-medium">Tối</span>
                  </button>
                </div>
              </div>

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
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#F7FFFA' }}>
      {/* Header */}
      <Header
        userData={userData}
        userAge={userAge}
        setUserAge={setUserAge}
        handleLogout={logout}
        activeConversation={null}
        updateConversationAge={updateConversationAge}
      />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt tài khoản</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <nav className="flex flex-col">
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 ${activeTab === 'profile' ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => handleChangeTab('profile')}
                  style={activeTab === 'profile' ? { backgroundColor: '#E6F7EF', borderLeftColor: '#36B37E', color: '#36B37E' } : {}}
                >
                  <BiUser className="flex-shrink-0" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 ${activeTab === 'password' ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => handleChangeTab('password')}
                  style={activeTab === 'password' ? { backgroundColor: '#E6F7EF', borderLeftColor: '#36B37E', color: '#36B37E' } : {}}
                >
                  <BiLock className="flex-shrink-0" />
                  <span>Mật khẩu</span>
                </button>
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 ${activeTab === 'appearance' ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => handleChangeTab('appearance')}
                  style={activeTab === 'appearance' ? { backgroundColor: '#E6F7EF', borderLeftColor: '#36B37E', color: '#36B37E' } : {}}
                >
                  <BiPalette className="flex-shrink-0" />
                  <span>Giao diện</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-3 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50"
                >
                  <BiLock className="flex-shrink-0" />
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