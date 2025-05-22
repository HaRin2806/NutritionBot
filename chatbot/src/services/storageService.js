const storageService = {
  saveUserData: (user, token, storage = localStorage) => {
    if (user) {
      storage.setItem('user', JSON.stringify(user));
    }
    if (token) {
      storage.setItem('access_token', token);
    }
  },
  
  getUserData: () => {
    // Thử lấy từ localStorage trước, sau đó từ sessionStorage
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    
    return localUser 
      ? JSON.parse(localUser) 
      : sessionUser 
        ? JSON.parse(sessionUser) 
        : null;
  },
  
  getToken: () => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  },
  
  clearUserData: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    // XÓA LUÔN TUỔI KHI ĐĂNG XUẤT
    localStorage.removeItem('user_age');
  },
  
  saveUserAge: (age) => {
    console.log('Lưu tuổi vào storage:', age);
    localStorage.setItem('user_age', age.toString());
  },
  
  getUserAge: () => {
    const age = localStorage.getItem('user_age');
    console.log('Lấy tuổi từ storage:', age);
    return age ? parseInt(age, 10) : null;
  },

  // Thêm function để clear tuổi riêng
  clearUserAge: () => {
    console.log('Xóa tuổi khỏi storage');
    localStorage.removeItem('user_age');
  }
};

export default storageService;