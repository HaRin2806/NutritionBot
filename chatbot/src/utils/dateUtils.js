/**
 * Format thời gian từ ISO string thành giờ:phút
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Chuỗi giờ:phút định dạng
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format ngày từ ISO string thành dd/mm/yyyy
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Chuỗi ngày định dạng dd/mm/yyyy
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Lấy ngày tương đối (hôm nay, hôm qua, x ngày trước...)
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Chuỗi mô tả ngày tương đối
 */
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

/**
 * Nhóm các cuộc trò chuyện theo thời gian
 * @param {Array} conversations - Mảng các cuộc trò chuyện
 * @returns {Object} - Object chứa các nhóm
 */
export const groupConversationsByTime = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000; // Trừ đi 1 ngày
  const last7Days = today - 86400000 * 7; // Trừ đi 7 ngày
  const last30Days = today - 86400000 * 30; // Trừ đi 30 ngày

  const groups = {
    today: [],
    yesterday: [],
    last7Days: [],
    older: []
  };

  conversations.forEach(conversation => {
    const conversationDate = new Date(conversation.updated_at).getTime();

    if (conversationDate >= today) {
      groups.today.push(conversation);
    } else if (conversationDate >= yesterday) {
      groups.yesterday.push(conversation);
    } else if (conversationDate >= last7Days) {
      groups.last7Days.push(conversation);
    } else {
      groups.older.push(conversation);
    }
  });

  return groups;
};