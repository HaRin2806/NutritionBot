import baseApi from './baseApi';

// Chat Service - tối ưu từ chatService.js
export const chatService = {
  sendMessage: (message, age, conversationId) =>
    baseApi.post('/chat', { message, age, ...(conversationId && { conversation_id: conversationId }) }),

  // ✅ SỬA: Tăng per_page mặc định và fix logic
  getConversations: (includeArchived = false, page = 1, perPage = 100) => {
    console.log(`🔄 API Call: getConversations(includeArchived: ${includeArchived}, page: ${page}, perPage: ${perPage})`);
    return baseApi.get('/conversations', { include_archived: includeArchived, page, per_page: perPage });
  },

  // ✅ SỬA: Cải thiện logic getAllConversations
  getAllConversations: async (includeArchived = false) => {
    console.log(`🔄 getAllConversations: Starting with includeArchived=${includeArchived}`);

    let allConversations = [];
    let page = 1;
    const perPage = 100; // Tăng size để giảm số lần gọi API
    let hasMore = true;

    try {
      while (hasMore) {
        console.log(`🔄 Loading page ${page}...`);
        const response = await chatService.getConversations(includeArchived, page, perPage);

        if (response.success && response.conversations) {
          const newConversations = response.conversations;
          allConversations = [...allConversations, ...newConversations];

          console.log(`📄 Page ${page}: Got ${newConversations.length} conversations, total so far: ${allConversations.length}`);

          // Check if we have more pages
          const pagination = response.pagination;
          if (pagination && page < pagination.pages) {
            page++;
          } else {
            hasMore = false;
          }

          // Safety check: if we got less than perPage, probably last page
          if (newConversations.length < perPage) {
            hasMore = false;
          }
        } else {
          console.error(`❌ Error on page ${page}:`, response.error);
          hasMore = false;
        }
      }

      console.log(`✅ getAllConversations completed: ${allConversations.length} total conversations`);
      return { success: true, conversations: allConversations, total: allConversations.length };

    } catch (error) {
      console.error('❌ getAllConversations error:', error);
      return { success: false, conversations: allConversations, error: error.message };
    }
  },

  getConversationDetail: (id) => {
    console.log(`🔄 Getting conversation detail: ${id}`);
    return baseApi.get(`/conversations/${id}`);
  },

  createConversation: (title, ageContext) => {
    console.log(`🔄 Creating conversation: ${title}, age: ${ageContext}`);
    return baseApi.post('/conversations', { title, age_context: ageContext });
  },

  updateConversation: (id, data) => {
    console.log(`🔄 Updating conversation ${id}:`, data);
    return baseApi.put(`/conversations/${id}`, data);
  },

  deleteConversation: (id) => {
    console.log(`🔄 Deleting conversation: ${id}`);
    return baseApi.delete(`/conversations/${id}`, { conversation_id: id });
  },

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

// Auth Service - giữ nguyên
export const authService = {
  login: (email, password, rememberMe) => baseApi.post('/auth/login', { email, password, rememberMe }),
  register: (userData) => baseApi.post('/auth/register', userData),
  logout: () => baseApi.post('/auth/logout'),
  verifyToken: () => baseApi.post('/auth/verify-token'),
  updateProfile: (profileData) => baseApi.put('/auth/profile', profileData),
  changePassword: (passwordData) => baseApi.post('/auth/change-password', passwordData),
};

// Admin Service - cập nhật
export const adminService = {
  // Stats & Dashboard
  getStats: () => baseApi.get('/admin/stats/overview'),
  getSystemInfo: () => baseApi.get('/admin/system-info'),

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
    console.log('💾 Saving age to storage:', age);
    localStorage.setItem('user_age', age.toString());
  },

  getUserAge: () => {
    const age = localStorage.getItem('user_age');
    console.log('📖 Getting age from storage:', age);
    return age ? parseInt(age, 10) : null;
  },

  clearUserAge: () => {
    console.log('🗑️ Clearing age from storage');
    localStorage.removeItem('user_age');
  }
};