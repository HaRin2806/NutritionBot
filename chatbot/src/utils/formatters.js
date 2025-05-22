/**
 * Tạo tiêu đề từ nội dung tin nhắn
 * @param {string} message - Nội dung tin nhắn
 * @param {number} maxLength - Độ dài tối đa của tiêu đề
 * @returns {string} - Tiêu đề được tạo ra
 */
export const createTitleFromMessage = (message, maxLength = 50) => {
  // Loại bỏ ký tự xuống dòng và khoảng trắng thừa
  const cleanMessage = message.trim().replace(/\n/g, ' ');

  // Nếu tin nhắn đủ ngắn, sử dụng làm tiêu đề luôn
  if (cleanMessage.length <= maxLength) {
    return cleanMessage;
  }

  // Nếu tin nhắn quá dài, cắt ngắn và thêm dấu "..."
  return cleanMessage.slice(0, maxLength - 3) + "...";
};

/**
 * Tạo ID duy nhất dựa trên timestamp
 * @returns {string} - ID duy nhất
 */
export const generateTempId = () => {
  return 'temp_' + Date.now();
};

/**
 * Xử lý đường dẫn hình ảnh
 * @param {string} src - Đường dẫn gốc
 * @param {string} apiBaseUrl - Đường dẫn API
 * @returns {string} - Đường dẫn đã xử lý
 */
export const processImagePath = (src, apiBaseUrl = 'http://localhost:5000/api') => {
  if (!src) return null;

  // Xử lý đường dẫn tương đối với '../figures/'
  if (src.includes('../figures/')) {
    const relativePath = src.split('../figures/')[1];
    // Lấy tên file từ đường dẫn
    const fileName = relativePath;

    // Tìm mã bài từ tên file (ví dụ: bai1_hinh1.jpg -> bai1)
    let baiId = 'bai1'; // Mặc định là bai1
    const baiMatch = fileName.match(/^(bai\d+)_/);
    if (baiMatch) {
      baiId = baiMatch[1];
    }

    // Tạo URL API chính xác
    return `${apiBaseUrl}/figures/${baiId}/${fileName}`;
  }
  // Trường hợp đường dẫn bình thường
  else {
    // Lấy tên file từ đường dẫn
    const fileName = src.split('/').pop();

    // Tìm mã bài từ tên file (ví dụ: bai1_hinh1.jpg -> bai1)
    let baiId = 'bai1'; // Mặc định là bai1
    const baiMatch = fileName.match(/^(bai\d+)_/);
    if (baiMatch) {
      baiId = baiMatch[1];
    }

    // Tạo URL API chính xác
    return `${apiBaseUrl}/figures/${baiId}/${fileName}`;
  }
};