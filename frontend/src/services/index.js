import baseApi from './baseApi';

// Chat Service - tối ưu từ chatService.js
export const chatService = {
  sendMessage: (message, age, conversationId) => 
    baseApi.post('/chat', { message, age, ...(conversationId && { conversation_id: conversationId }) }),

  getConversations: (includeArchived = false, page = 1, perPage = 50) => 
    baseApi.get('/conversations', { include_archived: includeArchived, page, per_page: perPage }),

  getAllConversations: async (includeArchived = false) => {
    let allConversations = [];
    let page = 1;
    const perPage = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await chatService.getConversations(includeArchived, page, perPage);
      if (response.success) {
        allConversations = [...allConversations, ...response.conversations];
        hasMore = page < response.pagination.pages;
        page++;
      } else {
        hasMore = false;
      }
    }

    return { success: true, conversations: allConversations, total: allConversations.length };
  },

  getConversationDetail: (id) => baseApi.get(`/conversations/${id}`),
  createConversation: (title, ageContext) => baseApi.post('/conversations', { title, age_context: ageContext }),
  updateConversation: (id, data) => baseApi.put(`/conversations/${id}`, data),
  deleteConversation: (id) => baseApi.delete(`/conversations/${id}`, { conversation_id: id }),
  archiveConversation: (id) => baseApi.post(`/conversations/${id}/archive`),
  unarchiveConversation: (id) => baseApi.post(`/conversations/${id}/unarchive`),
  
  generateTitle: (conversationId) => baseApi.post(`/conversations/${conversationId}/generate-title`),
  
  bulkDeleteConversations: (ids) => baseApi.post('/conversations/bulk-delete', { conversation_ids: ids }),

  // Message operations
  editMessage: (messageId, conversationId, newContent, age) => 
    baseApi.put(`/messages/${messageId}/edit`, { content: newContent, conversation_id: conversationId, age }),
  switchMessageVersion: (messageId, conversationId, version) => 
    baseApi.put(`/messages/${messageId}/versions/${version}`, { conversation_id: conversationId }),
  regenerateResponse: (messageId, conversationId, age) => 
    baseApi.post(`/messages/${messageId}/regenerate`, { conversation_id: conversationId, age }),
  deleteMessageAndFollowing: (messageId, conversationId) => 
    baseApi.delete(`/messages/${messageId}`, { conversation_id: conversationId }),
};

// Auth Service - tối ưu từ AuthContext
export const authService = {
  login: (email, password, rememberMe) => baseApi.post('/auth/login', { email, password, rememberMe }),
  register: (userData) => baseApi.post('/auth/register', userData),
  logout: () => baseApi.post('/auth/logout'),
  verifyToken: () => baseApi.post('/auth/verify-token'),
  updateProfile: (profileData) => baseApi.put('/auth/profile', profileData),
  changePassword: (passwordData) => baseApi.post('/auth/change-password', passwordData),
};

// Admin Service - tối ưu từ adminService.js
export const adminService = {
  // Stats & Dashboard
  getStats: () => baseApi.get('/admin/stats/overview'),
  getUserStats: () => baseApi.get('/admin/users/stats/summary'),
  getConversationStats: () => baseApi.get('/admin/stats/conversations'),

  // User Management
  getAllUsers: (page = 1, perPage = 20, filters = {}) => 
    baseApi.get('/admin/users', { page, per_page: perPage, ...filters }),
  getUserDetail: (userId) => baseApi.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => baseApi.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => baseApi.delete(`/admin/users/${userId}`),
  bulkDeleteUsers: (userIds) => baseApi.post('/admin/users/bulk-delete', { user_ids: userIds }),

  // Document Management
  getAllDocuments: () => baseApi.get('/admin/documents'),
  uploadDocument: (file, metadata) => baseApi.upload('/admin/documents/upload', file, metadata),
  processDocument: (docId, options) => baseApi.post(`/admin/documents/${docId}/process`, options),
  deleteDocument: (docId) => baseApi.delete(`/admin/documents/${docId}`),
  bulkDeleteDocuments: (docIds) => baseApi.post('/admin/documents/bulk-delete', { doc_ids: docIds }),
  rebuildEmbeddings: (force = false) => baseApi.post('/admin/documents/embeddings/rebuild', { force }),

  // Admin Management
  createAdmin: (adminData) => baseApi.post('/admin/auth/create-admin', adminData),
};

// Storage Service - đã tối ưu
export const storageService = {
  saveUserData: (user, token, storage = localStorage) => {
    if (user) storage.setItem('user', JSON.stringify(user));
    if (token) storage.setItem('access_token', token);
  },
  
  getUserData: () => {
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    return localUser ? JSON.parse(localUser) : sessionUser ? JSON.parse(sessionUser) : null;
  },
  
  getToken: () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token'),
  
  clearUserData: () => {
    ['user', 'access_token', 'user_age'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
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

  clearUserAge: () => {
    console.log('Xóa tuổi khỏi storage');
    localStorage.removeItem('user_age');
  }
};