/**
 * Kiểm tra định dạng email
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} - Kết quả kiểm tra
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Kiểm tra mật khẩu có đủ mạnh
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {boolean} - Kết quả kiểm tra
 */
export const isValidPassword = (password) => {
  // Ít nhất 6 ký tự
  return password && password.length >= 6;
};

/**
 * Kiểm tra form đăng ký
 * @param {Object} formData - Dữ liệu form
 * @returns {Object} - Object chứa lỗi (nếu có)
 */
export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.fullName?.trim()) {
    errors.fullName = 'Vui lòng nhập họ tên';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Vui lòng nhập email';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Email không hợp lệ';
  }

  if (!formData.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  } else if (!isValidPassword(formData.password)) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  if (!formData.gender) {
    errors.gender = 'Vui lòng chọn giới tính';
  }

  if (!formData.agreeTerms) {
    errors.agreeTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
  }

  return errors;
};

/**
 * Kiểm tra form đăng nhập
 * @param {Object} formData - Dữ liệu form
 * @returns {Object} - Object chứa lỗi (nếu có)
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email?.trim()) {
    errors.email = 'Vui lòng nhập email';
  }

  if (!formData.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  }

  return errors;
};

/**
 * Kiểm tra form đổi mật khẩu
 * @param {Object} passwordData - Dữ liệu mật khẩu
 * @returns {Object} - Object chứa lỗi (nếu có)
 */
export const validateChangePasswordForm = (passwordData) => {
  const errors = {};

  if (!passwordData.currentPassword) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
  }

  if (!passwordData.newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới';
  } else if (!isValidPassword(passwordData.newPassword)) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
  }

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  return errors;
};