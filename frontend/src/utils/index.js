// Consolidate all utilities into one file

// Date utilities
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getRelativeDate = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `Hôm nay, ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  } else if (diffDays === 1) {
    return "Hôm qua";
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} tuần trước`;
  } else {
    return formatDate(timestamp);
  }
};

export const groupConversationsByTime = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const last7Days = today - 86400000 * 7;

  const groups = {
    'Hôm nay': [],
    'Hôm qua': [],
    '7 ngày qua': [],
    'Cũ hơn': []
  };

  conversations.forEach(conversation => {
    const conversationDate = new Date(conversation.updated_at).getTime();

    if (conversationDate >= today) {
      groups['Hôm nay'].push(conversation);
    } else if (conversationDate >= yesterday) {
      groups['Hôm qua'].push(conversation);
    } else if (conversationDate >= last7Days) {
      groups['7 ngày qua'].push(conversation);
    } else {
      groups['Cũ hơn'].push(conversation);
    }
  });

  return groups;
};

// Formatters
export const createTitleFromMessage = (message, maxLength = 50) => {
  const cleanMessage = message.trim().replace(/\n/g, ' ');
  if (cleanMessage.length <= maxLength) {
    return cleanMessage;
  }
  return cleanMessage.slice(0, maxLength - 3) + "...";
};

export const generateTempId = () => 'temp_' + Date.now();

export const processImagePath = (src, apiBaseUrl = 'http://localhost:5000/api') => {
  if (!src) return null;

  if (src.includes('../figures/')) {
    const relativePath = src.split('../figures/')[1];
    const fileName = relativePath;
    let baiId = 'bai1';
    const baiMatch = fileName.match(/^(bai\d+)_/);
    if (baiMatch) {
      baiId = baiMatch[1];
    }
    return `${apiBaseUrl}/figures/${baiId}/${fileName}`;
  } else {
    const fileName = src.split('/').pop();
    let baiId = 'bai1';
    const baiMatch = fileName.match(/^(bai\d+)_/);
    if (baiMatch) {
      baiId = baiMatch[1];
    }
    return `${apiBaseUrl}/figures/${baiId}/${fileName}`;
  }
};

// Validators
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password) => password && password.length >= 6;

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

// Constants
export const COLORS = {
  MINT: '#36B37E',
  MINT_LIGHT: '#E6F7EF',
  MINT_DARK: '#2FAB76'
};

export const AGE_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 1);

export const THEME_CONFIG = {
  mint: { primary: '#36B37E', light: '#E6F7EF', dark: '#2FAB76' },
  blue: { primary: '#2563EB', light: '#EFF6FF', dark: '#1D4ED8' },
  purple: { primary: '#8B5CF6', light: '#F5F3FF', dark: '#7C3AED' },
  pink: { primary: '#EC4899', light: '#FCE7F3', dark: '#DB2777' },
  orange: { primary: '#F97316', light: '#FFF7ED', dark: '#EA580C' }
};