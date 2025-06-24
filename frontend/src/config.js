// Cấu hình toàn cục cho ứng dụng
const config = {
  // API URLs
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  
  // Các tùy chọn mặc định
  defaultPageSize: 10,
  
  // Các giá trị tuổi có sẵn
  ageOptions: Array.from({ length: 19 }, (_, i) => i + 1),
  
  // Các theme màu sắc - sửa lại cho đúng
  themes: {
    mint: {
      primary: '#36B37E',
      light: '#E6F7EF',
      dark: '#2FAB76',
    },
    blue: {
      primary: '#3B82F6',
      light: '#EBF8FF',
      dark: '#2563EB',
    },
    purple: {
      primary: '#8B5CF6',
      light: '#F3E8FF',
      dark: '#7C3AED',
    },
    pink: {
      primary: '#EC4899',
      light: '#FCE7F3',
      dark: '#DB2777',
    },
    orange: {
      primary: '#F97316',
      light: '#FFF7ED',
      dark: '#EA580C',
    },
  }
};

export default config;