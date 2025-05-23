import api from './api';

const chatService = {
  sendMessage: async (message, age, conversationId = null) => {
    try {
      const requestData = {
        message,
        age
      };
      
      if (conversationId) {
        requestData.conversation_id = conversationId;
      }
      
      const response = await api.post('/chat', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  getConversations: async (includeArchived = false, page = 1, perPage = 10) => {
    try {
      const response = await api.get('/conversations', {
        params: {
          include_archived: includeArchived,
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  getConversationDetail: async (conversationId) => {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  createConversation: async (title, ageContext) => {
    try {
      const response = await api.post('/conversations', {
        title,
        age_context: ageContext
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  updateConversation: async (conversationId, data) => {
    try {
      const response = await api.put(`/conversations/${conversationId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  archiveConversation: async (conversationId) => {
    try {
      const response = await api.post(`/conversations/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  unarchiveConversation: async (conversationId) => {
    try {
      const response = await api.post(`/conversations/${conversationId}/unarchive`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  bulkDeleteConversations: async (conversationIds) => {
    try {
      const response = await api.post('/conversations/bulk-delete', {
        conversation_ids: conversationIds
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  getFollowUpQuestions: async (query, answer, age) => {
    try {
      const response = await api.post('/follow-up-questions', {
        query,
        answer,
        age
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default chatService;