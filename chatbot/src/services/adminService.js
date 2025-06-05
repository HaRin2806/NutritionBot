import api from './api';

// Helper function to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
});

const adminService = {
  // === STATS & DASHBOARD ===
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await api.get('/admin/users/stats/summary');
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

  // === USER MANAGEMENT ===
  getAllUsers: async (page = 1, perPage = 20, filters = {}) => {
    try {
      const response = await api.get('/admin/users', {
        params: { page, per_page: perPage, ...filters }
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
      const response = await api.post('/admin/users/bulk-delete', { user_ids: userIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // === DOCUMENT MANAGEMENT ===
  getAllDocuments: async () => {
    try {
      const response = await api.get('/admin/documents');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadDocument: async (file, metadata = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await api.post('/admin/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      const response = await api.post('/admin/documents/bulk-delete', { doc_ids: docIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  rebuildEmbeddings: async (force = false) => {
    try {
      const response = await api.post('/admin/documents/embeddings/rebuild', { force });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // === ADMIN AUTH ===
  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/admin/auth/create-admin', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default adminService;