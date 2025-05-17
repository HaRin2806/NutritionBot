import React, { useState } from 'react';
import { BiUser, BiLock, BiPalette, BiCheckCircle, BiEdit, BiShield, BiLogOut } from 'react-icons/bi';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    avatar: null,
    phone: '0987654321'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profileData });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [theme, setTheme] = useState('mint');

  useEffect(() => {
    // Lấy thông tin người dùng từ API
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
          withCredentials: true
        });

        if (response.data.success) {
          const userData = response.data.user;
          setProfileData({
            fullName: userData.name,
            email: userData.email,
            avatar: null, // API không trả về avatar
            phone: userData.phone || ''
          });
          setFormData({
            fullName: userData.name,
            email: userData.email,
            avatar: null,
            phone: userData.phone || ''
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        // Nếu lỗi xác thực, chuyển hướng về trang đăng nhập
        if (error.response && error.response.status === 401) {
          window.location.href = '/login';
        }
      }
    };

    fetchUserProfile();
  }, []);

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
    try {
      // Gọi API cập nhật thông tin cá nhân
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, {
        name: formData.fullName,
        gender: formData.gender
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setProfileData(formData);
        setIsEditing(false);
        // Thông báo lưu thành công
        Swal.fire({
          icon: 'success',
          title: 'Lưu thành công',
          text: 'Thông tin cá nhân đã được cập nhật',
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể cập nhật thông tin cá nhân',
        confirmButtonColor: '#36B37E'
      });
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    // Kiểm tra xác nhận mật khẩu
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Mật khẩu xác nhận không khớp',
        confirmButtonColor: '#36B37E'
      });
      return;
    }

    try {
      // Gọi API đổi mật khẩu
      const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Mật khẩu đã được cập nhật',
          confirmButtonColor: '#36B37E',
          timer: 1500,
          showConfirmButton: false
        });

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.error || 'Không thể cập nhật mật khẩu',
        confirmButtonColor: '#36B37E'
      });
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Thông tin cá nhân</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center text-mint-600 hover:text-mint-700"
                style={{ color: '#36B37E' }}
              >
                <BiEdit className="mr-1" />
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
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
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        className="focus:ring-mint-500 focus:border-mint-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.fullName}
                        onChange={handleProfileChange}
                        style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="focus:ring-mint-500 focus:border-mint-500 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        value={formData.email}
                        onChange={handleProfileChange}
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="focus:ring-mint-500 focus:border-mint-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.phone}
                        onChange={handleProfileChange}
                        style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                      />
                    </div>
                    <div className="pt-3">
                      <button
                        onClick={handleSaveProfile}
                        className="bg-mint-600 text-white px-4 py-2 rounded-md hover:bg-mint-700 mr-2"
                        style={{ backgroundColor: '#36B37E' }}
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={() => {
                          setFormData({ ...profileData });
                          setIsEditing(false);
                        }}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                      >
                        Hủy
                      </button>
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
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  className="focus:ring-mint-500 focus:border-mint-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="focus:ring-mint-500 focus:border-mint-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                />
                <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 8 ký tự</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="focus:ring-mint-500 focus:border-mint-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  style={{ boxShadow: '0 0 0 2px rgba(54, 179, 126, 0.05)' }}
                />
              </div>
              <div className="pt-3">
                <button
                  type="submit"
                  className="bg-mint-600 text-white px-4 py-2 rounded-md hover:bg-mint-700"
                  style={{ backgroundColor: '#36B37E' }}
                >
                  Cập nhật mật khẩu
                </button>
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
                  {['mint', 'blue', 'purple', 'pink', 'orange'].map(color => (
                    <div
                      key={color}
                      className={`cursor-pointer rounded-lg p-4 h-16 flex items-center justify-center transition-all ${theme === color ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}`}
                      style={{
                        backgroundColor:
                          color === 'mint' ? '#36B37E' :
                            color === 'blue' ? '#2563EB' :
                              color === 'purple' ? '#8B5CF6' :
                                color === 'pink' ? '#EC4899' :
                                  '#F97316',
                        color: 'white',
                        boxShadow: theme === color ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
                        ringColor:
                          color === 'mint' ? '#36B37E' :
                            color === 'blue' ? '#2563EB' :
                              color === 'purple' ? '#8B5CF6' :
                                color === 'pink' ? '#EC4899' :
                                  '#F97316',
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
                <button
                  className="bg-mint-600 text-white px-4 py-2 rounded-md hover:bg-mint-700"
                  style={{ backgroundColor: '#36B37E' }}
                  onClick={() => alert('Cài đặt giao diện đã được lưu!')}
                >
                  Lưu cài đặt
                </button>
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
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt tài khoản</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <nav className="flex flex-col">
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 ${activeTab === 'profile' ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('profile')}
                  style={activeTab === 'profile' ? { backgroundColor: '#E6F7EF', borderLeftColor: '#36B37E', color: '#36B37E' } : {}}
                >
                  <BiUser className="flex-shrink-0" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 ${activeTab === 'password' ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('password')}
                  style={activeTab === 'password' ? { backgroundColor: '#E6F7EF', borderLeftColor: '#36B37E', color: '#36B37E' } : {}}
                >
                  <BiLock className="flex-shrink-0" />
                  <span>Mật khẩu</span>
                </button>
                <button
                  className={`px-4 py-3 text-left flex items-center space-x-2 ${activeTab === 'appearance' ? 'bg-mint-50 border-l-4 border-mint-600 text-mint-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('appearance')}
                  style={activeTab === 'appearance' ? { backgroundColor: '#E6F7EF', borderLeftColor: '#36B37E', color: '#36B37E' } : {}}
                >
                  <BiPalette className="flex-shrink-0" />
                  <span>Giao diện</span>
                </button>
                <button
                  className="px-4 py-3 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50"
                >
                  <BiLogOut className="flex-shrink-0" />
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