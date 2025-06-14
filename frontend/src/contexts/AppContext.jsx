import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authService, chatService, storageService } from '../services';
import { createTitleFromMessage } from '../utils/index';

const AppContext = createContext();

// Custom hook để sử dụng context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Toast utilities
const useToast = () => ({
  showSuccess: (message, timer = 1500) => Swal.fire({
    icon: 'success',
    title: 'Thành công',
    text: message,
    confirmButtonColor: '#36B37E',
    timer,
    showConfirmButton: timer > 2000
  }),

  showError: (message) => Swal.fire({
    icon: 'error',
    title: 'Lỗi',
    text: message,
    confirmButtonColor: '#36B37E'
  }),

  showConfirm: async (options = {}) => {
    const {
      title = 'Xác nhận',
      text = 'Bạn có chắc chắn?',
      confirmButtonText = 'Xác nhận',
      cancelButtonText = 'Hủy',
      icon = 'question'
    } = options;

    return Swal.fire({
      title, text, icon,
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText,
      cancelButtonText
    });
  },

  showAgePrompt: (currentAge = null) => Swal.fire({
    title: 'Thiết lập độ tuổi',
    html: `
      <select id="swal-age" class="swal2-input">
        ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
          `<option value="${age}" ${currentAge === age ? 'selected' : ''}>${age} tuổi</option>`
        ).join('')}
      </select>
    `,
    confirmButtonText: 'Lưu',
    confirmButtonColor: '#36B37E',
    allowOutsideClick: false,
    preConfirm: () => {
      const age = parseInt(document.getElementById('swal-age').value);
      if (isNaN(age) || age < 1 || age > 19) {
        Swal.showValidationMessage('Vui lòng chọn tuổi từ 1-19');
      }
      return age;
    }
  })
});

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Unified state
  const [state, setState] = useState(() => {
    const storedUser = storageService.getUserData();
    const token = storageService.getToken();
    
    return {
      // Auth state
      userData: storedUser,
      isLoading: false,
      isVerified: !storedUser, // True if no user to verify
      
      // Chat state
      activeConversation: null,
      conversations: [],
      isLoadingConversations: false,
      userAge: storageService.getUserAge(),
      
      // UI state
      selectedConversations: [],
      searchTerm: '',
      filters: { date: 'all', age: 'all', archived: false }
    };
  });

  const refs = useRef({ hasInitializedAge: false });

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Auth operations
  const authOps = {
    login: async (email, password, rememberMe = false) => {
      updateState({ isLoading: true });
      
      try {
        const response = await authService.login(email, password, rememberMe);
        
        if (response.success) {
          const storage = rememberMe ? localStorage : sessionStorage;
          storageService.saveUserData(response.user, response.access_token, storage);
          
          updateState({
            userData: response.user,
            isLoading: false,
            isVerified: true
          });
          
          toast.showSuccess('Đăng nhập thành công!');
          return { success: true };
        }
        
        throw new Error(response.error);
      } catch (error) {
        updateState({ isLoading: false });
        
        const errorMessage = error.response?.data?.error || 'Email hoặc mật khẩu không chính xác';
        
        setTimeout(() => {
          toast.showError(errorMessage);
        }, 100);
        
        return { success: false, error: errorMessage };
      }
    },

    register: async (userData) => {
      updateState({ isLoading: true });
      
      try {
        const response = await authService.register(userData);
        
        if (response.success) {
          updateState({ isLoading: false });
          
          Swal.fire({
            title: 'Đăng ký thành công!',
            text: 'Bạn đã tạo tài khoản thành công.',
            confirmButtonText: 'Đăng nhập ngay',
            confirmButtonColor: '#36B37E',
            allowOutsideClick: false
          }).then(() => {
            navigate('/login');
          });
          
          return { success: true };
        }
        
        throw new Error(response.error);
      } catch (error) {
        updateState({ isLoading: false });
        return { success: false, error: error.message };
      }
    },

    logout: async () => {
      const result = await toast.showConfirm({
        title: 'Đăng xuất?',
        text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?'
      });

      if (result.isConfirmed) {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout API error:', error);
        } finally {
          updateState({ userData: null, isLoading: false, isVerified: true });
          storageService.clearUserData();
          navigate('/login');
        }
      }
    },

    updateProfile: async (profileData) => {
      try {
        const response = await authService.updateProfile(profileData);
        
        if (response.success) {
          const updatedUser = { ...state.userData, ...profileData };
          updateState({ userData: updatedUser });
          
          const currentUser = storageService.getUserData();
          if (currentUser) {
            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(updatedUser));
          }
          
          return { success: true };
        }
        
        throw new Error(response.error);
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    changePassword: async (passwordData) => {
      try {
        const response = await authService.changePassword(passwordData);
        return { success: response.success };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  // Chat operations
  const chatOps = {
    fetchConversations: async (includeArchived = false) => {
      try {
        updateState({ isLoadingConversations: true });
        const response = await chatService.getConversations(includeArchived);

        if (response.success) {
          const conversations = response.conversations;
          updateState({ conversations });

          // Initialize age from storage or latest conversation
          if (!refs.current.hasInitializedAge) {
            refs.current.hasInitializedAge = true;
            const storedAge = storageService.getUserAge();

            if (storedAge) {
              updateState({ userAge: storedAge });
            } else if (conversations.length > 0) {
              const lastConversationWithAge = conversations
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                .find(conv => conv.age_context);

              if (lastConversationWithAge?.age_context) {
                updateState({ userAge: lastConversationWithAge.age_context });
                storageService.saveUserAge(lastConversationWithAge.age_context);
              }
            }
          }
          return conversations;
        }
        return [];
      } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
      } finally {
        updateState({ isLoadingConversations: false });
      }
    },

    fetchConversationDetail: async (id) => {
      if (!id) return null;

      try {
        const response = await chatService.getConversationDetail(id);
        if (response.success) {
          updateState({ activeConversation: response.conversation });
          return response.conversation;
        }
        return null;
      } catch (error) {
        console.error("Error fetching conversation detail:", error);
        return null;
      }
    },

    sendMessage: async (messageContent, conversationId = null) => {
      let currentAge = state.activeConversation?.age_context || state.userAge;

      if (!currentAge) {
        const result = await toast.showAgePrompt();
        if (result.isConfirmed) {
          currentAge = result.value;
          updateState({ userAge: currentAge });
          storageService.saveUserAge(currentAge);
        } else {
          return { success: false, error: 'Cần thiết lập tuổi' };
        }
      }

      // Create temp messages
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const tempUserMessage = {
        _id: `temp_user_${uniqueId}`,
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString()
      };

      const tempBotMessage = {
        _id: `temp_bot_${uniqueId}`,
        role: 'bot',
        content: '',
        timestamp: new Date().toISOString(),
        isRegenerating: true
      };

      // Add temp messages
      if (state.activeConversation) {
        updateState({
          activeConversation: {
            ...state.activeConversation,
            messages: [...(state.activeConversation.messages || []), tempUserMessage, tempBotMessage]
          }
        });
      } else {
        updateState({
          activeConversation: {
            id: `temp_conv_${uniqueId}`,
            messages: [tempUserMessage, tempBotMessage]
          }
        });
      }

      try {
        const response = await chatService.sendMessage(messageContent, currentAge, conversationId);

        if (response.success) {
          if (response.conversation_id) {
            await chatOps.fetchConversationDetail(response.conversation_id);
            if (!conversationId) {
              navigate(`/chat/${response.conversation_id}`);
            }
          }
          return { success: true, response };
        }
        throw new Error(response.error);
      } catch (error) {
        // Remove temp messages on error
        if (state.activeConversation) {
          updateState({
            activeConversation: {
              ...state.activeConversation,
              messages: state.activeConversation.messages.filter(m =>
                m._id !== tempUserMessage._id && m._id !== tempBotMessage._id
              )
            }
          });
        }
        return { success: false, error: error.message };
      }
    },

    // Conversation management
    startNewConversation: async () => {
      if (!state.userData?.id) {
        navigate('/login');
        return { success: false };
      }

      let currentAge = state.userAge;
      if (!currentAge) {
        const result = await toast.showAgePrompt();
        if (result.isConfirmed) {
          currentAge = result.value;
          updateState({ userAge: currentAge });
          storageService.saveUserAge(currentAge);
        } else {
          return { success: false };
        }
      }

      try {
        const response = await chatService.createConversation('Cuộc trò chuyện mới', currentAge);
        if (response.success) {
          if (response.conversation_id) {
            await chatOps.fetchConversationDetail(response.conversation_id);
            navigate(`/chat/${response.conversation_id}`);
          }
          return { success: true };
        }
        throw new Error(response.error);
      } catch (error) {
        console.error("Error creating conversation:", error);
        return { success: false, error: error.message };
      }
    },

    deleteConversation: async (conversationId) => {
      try {
        const response = await chatService.deleteConversation(conversationId);
        if (response.success) {
          const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
          updateState({ conversations: updatedConversations });

          if (state.activeConversation?.id === conversationId) {
            if (updatedConversations.length > 0) {
              await chatOps.fetchConversationDetail(updatedConversations[0].id);
              navigate(`/chat/${updatedConversations[0].id}`);
            } else {
              updateState({ activeConversation: null });
              navigate('/chat');
            }
          }
          return { success: true };
        }
        throw new Error(response.error);
      } catch (error) {
        console.error("Error deleting conversation:", error);
        return { success: false, error: error.message };
      }
    },

    renameConversation: async (conversationId, currentTitle) => {
      const result = await Swal.fire({
        title: 'Đổi tên cuộc trò chuyện',
        input: 'text',
        inputValue: currentTitle,
        showCancelButton: true,
        confirmButtonColor: '#36B37E',
        preConfirm: (title) => {
          if (!title.trim()) {
            Swal.showValidationMessage('Tên không được để trống');
          }
          return title;
        }
      });

      if (result.isConfirmed) {
        try {
          const response = await chatService.updateConversation(conversationId, { title: result.value });
          if (response.success) {
            updateState({
              conversations: state.conversations.map(conv =>
                conv.id === conversationId ? { ...conv, title: result.value } : conv
              ),
              activeConversation: state.activeConversation?.id === conversationId
                ? { ...state.activeConversation, title: result.value }
                : state.activeConversation
            });
            return { success: true };
          }
          throw new Error(response.error);
        } catch (error) {
          console.error("Error renaming conversation:", error);
          return { success: false };
        }
      }
      return { success: false, cancelled: true };
    },

    // Message operations
    editMessage: async (messageId, conversationId, newContent) => {
      try {
        const currentMessages = state.activeConversation.messages;
        const userMessageIndex = currentMessages.findIndex(msg =>
          (msg._id || msg.id) === messageId && msg.role === 'user'
        );

        if (userMessageIndex === -1) {
          throw new Error('Không tìm thấy tin nhắn user');
        }

        const messagesBeforeEdit = currentMessages.slice(0, userMessageIndex + 1);
        messagesBeforeEdit[userMessageIndex] = {
          ...messagesBeforeEdit[userMessageIndex],
          content: newContent,
          is_edited: true
        };

        const tempBotMessage = {
          _id: `temp_bot_${Date.now()}`,
          role: 'bot',
          content: '',
          timestamp: new Date().toISOString(),
          isRegenerating: true
        };

        updateState({
          activeConversation: {
            ...state.activeConversation,
            messages: [...messagesBeforeEdit, tempBotMessage]
          }
        });

        const ageToUse = state.activeConversation.age_context || state.userAge;
        const response = await chatService.editMessage(messageId, conversationId, newContent, ageToUse);

        if (response.success) {
          await chatOps.fetchConversationDetail(conversationId);
          return { success: true };
        }
        throw new Error(response.error);

      } catch (error) {
        console.error("Error editing message:", error);
        await chatOps.fetchConversationDetail(conversationId);
        throw error;
      }
    },

    switchMessageVersion: async (messageId, conversationId, version) => {
      try {
        const response = await chatService.switchMessageVersion(messageId, conversationId, version);
        if (response.success) {
          await chatOps.fetchConversationDetail(conversationId);
          return { success: true };
        }
        throw new Error(response.error);
      } catch (error) {
        console.error("Error switching version:", error);
        throw error;
      }
    },

    regenerateResponse: async (messageId, conversationId, age) => {
      try {
        const currentMessages = state.activeConversation.messages;
        const botMessageIndex = currentMessages.findIndex(msg =>
          (msg._id || msg.id) === messageId && msg.role === 'bot'
        );

        if (botMessageIndex === -1) {
          throw new Error('Không tìm thấy tin nhắn bot');
        }

        const updatedMessages = [...currentMessages];
        updatedMessages[botMessageIndex] = {
          ...updatedMessages[botMessageIndex],
          isRegenerating: true,
          content: ''
        };

        updateState({
          activeConversation: {
            ...state.activeConversation,
            messages: updatedMessages
          }
        });

        const response = await chatService.regenerateResponse(messageId, conversationId, age);
        if (response.success) {
          await chatOps.fetchConversationDetail(conversationId);
          return { success: true };
        }
        throw new Error(response.error);
      } catch (error) {
        console.error("Error regenerating:", error);
        await chatOps.fetchConversationDetail(conversationId);
        throw error;
      }
    },

    deleteMessageAndFollowing: async (messageId, conversationId) => {
      try {
        const response = await chatService.deleteMessageAndFollowing(messageId, conversationId);
        if (response.success) {
          await chatOps.fetchConversationDetail(conversationId);
          return { success: true };
        }
        throw new Error(response.error);
      } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
      }
    }
  };

  // Helpers
  const helpers = {
    isAuthenticated: () => !!state.userData,
    requireAuth: (callback) => {
      if (!helpers.isAuthenticated()) {
        Swal.fire({
          title: 'Cần đăng nhập',
          text: 'Vui lòng đăng nhập để tiếp tục',
          confirmButtonColor: '#36B37E',
          confirmButtonText: 'Đăng nhập'
        }).then(() => {
          if (callback) callback();
          else navigate('/login');
        });
        return false;
      }
      return true;
    },
    setUserAge: (age) => {
      updateState({ userAge: age });
      storageService.saveUserAge(age);
    }
  };

  // Token verification effect
  useEffect(() => {
    const verifyToken = async () => {
      if (state.userData && !state.isVerified) {
        try {
          const response = await authService.verifyToken();
          if (response.success) {
            updateState({ isVerified: true });
          } else {
            storageService.clearUserData();
            updateState({ userData: null, isVerified: true });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          storageService.clearUserData();
          updateState({ userData: null, isVerified: true });
        }
      }
    };

    verifyToken();
  }, [state.userData, state.isVerified]);

  const value = {
    // State
    ...state,
    
    // Auth operations
    login: authOps.login,
    register: authOps.register,
    logout: authOps.logout,
    updateProfile: authOps.updateProfile,
    changePassword: authOps.changePassword,
    
    // Chat operations
    fetchConversations: chatOps.fetchConversations,
    fetchConversationDetail: chatOps.fetchConversationDetail,
    sendMessage: chatOps.sendMessage,
    startNewConversation: chatOps.startNewConversation,
    deleteConversation: chatOps.deleteConversation,
    renameConversation: chatOps.renameConversation,
    editMessage: chatOps.editMessage,
    switchMessageVersion: chatOps.switchMessageVersion,
    regenerateResponse: chatOps.regenerateResponse,
    deleteMessageAndFollowing: chatOps.deleteMessageAndFollowing,
    
    // Helpers
    isAuthenticated: helpers.isAuthenticated,
    requireAuth: helpers.requireAuth,
    setUserAge: helpers.setUserAge,
    
    // Toast
    ...toast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};