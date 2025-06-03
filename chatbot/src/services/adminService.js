import api from './api';

const adminService = {
  // === DASHBOARD APIs ===
  getOverviewStats: async () => {
    try {
      const response = await api.get('/admin/stats/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await api.get('/admin/stats/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getConversationStats: async () => {
    try {
      const response = await api.get('/admin/stats/conversations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getSystemStats: async () => {
    try {
      const response = await api.get('/admin/stats/system');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getRecentActivities: async (limit = 20) => {
    try {
      const response = await api.get('/admin/recent-activities', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getSystemAlerts: async () => {
    try {
      const response = await api.get('/admin/alerts');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // === USER MANAGEMENT APIs ===
  getAllUsers: async (page = 1, perPage = 20, filters = {}) => {
    try {
      const response = await api.get('/admin/users', {
        params: {
          page,
          per_page: perPage,
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserDetail: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  bulkDeleteUsers: async (userIds) => {
    try {
      const response = await api.post('/admin/users/bulk-delete', {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserConversations: async (userId, page = 1, perPage = 20) => {
    try {
      const response = await api.get(`/admin/users/${userId}/conversations`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteUserConversation: async (userId, conversationId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  exportUsers: async (format = 'json', includeStats = false) => {
    try {
      const response = await api.get('/admin/users/export', {
        params: {
          format,
          include_stats: includeStats
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUsersSummaryStats: async () => {
    try {
      const response = await api.get('/admin/users/stats/summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchUsers: async (searchParams) => {
    try {
      const response = await api.get('/admin/users/search', {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // === DOCUMENT MANAGEMENT APIs ===
  getAllDocuments: async () => {
    try {
      const response = await api.get('/admin/documents');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDocumentDetail: async (docId) => {
    try {
      const response = await api.get(`/admin/documents/${docId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadDocument: async (file, metadata = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Thêm metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await api.post('/admin/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  processDocument: async (docId, options = {}) => {
    try {
      const response = await api.post(`/admin/documents/${docId}/process`, options);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteDocument: async (docId) => {
    try {
      const response = await api.delete(`/admin/documents/${docId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  bulkDeleteDocuments: async (docIds) => {
    try {
      const response = await api.post('/admin/documents/bulk-delete', {
        doc_ids: docIds
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  rebuildEmbeddings: async (force = false) => {
    try {
      const response = await api.post('/admin/documents/embeddings/rebuild', {
        force
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getEmbeddingsStats: async () => {
    try {
      const response = await api.get('/admin/documents/embeddings/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchDocuments: async (query, type = 'all', limit = 50) => {
    try {
      const response = await api.get('/admin/documents/search', {
        params: { q: query, type, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  exportDocuments: async (format = 'json') => {
    try {
      const response = await api.get('/admin/documents/export', {
        params: { format }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // === AUTH APIs (sử dụng auth hiện tại với role check) ===
  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/auth/admin/create-admin', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  initDefaultAdmin: async () => {
    try {
      const response = await api.post('/auth/init-admin');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default adminService;