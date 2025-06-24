// frontend/src/contexts/AppContext.jsx - Fixed useToast function

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authService, chatService, storageService } from '../services';
import { createTitleFromMessage } from '../utils/index';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
// frontend/src/contexts/AppContext.jsx - Fixed useToast function

const useToast = () => {
  const getThemeColor = () => {
    const theme = localStorage.getItem('theme') || 'mint';
    const darkMode = localStorage.getItem('darkMode') === 'true';

    const themeColors = {
      mint: '#36B37E',
      blue: '#2563EB',
      purple: '#8B5CF6',
      pink: '#EC4899',
      orange: '#F97316'
    };

    return {
      primary: themeColors[theme] || themeColors.mint,
      isDark: darkMode
    };
  };

  return {
    showSuccess: (message, timer = 2000) => {
      const { primary, isDark } = getThemeColor();

      return Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: message,
        confirmButtonColor: primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        timer,
        showConfirmButton: timer > 3000,
        timerProgressBar: true,
        customClass: {
          popup: 'swal-simple-popup',
          confirmButton: 'swal-simple-button'
        },
        // ✅ SỬA: Đặt màu icon trực tiếp
        iconColor: primary
      });
    },

    showError: (message) => {
      const { primary, isDark } = getThemeColor();

      return Swal.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra',
        text: message,
        confirmButtonColor: primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        confirmButtonText: 'Đã hiểu',
        customClass: {
          popup: 'swal-simple-popup',
          confirmButton: 'swal-simple-button'
        }
      });
    },

    showConfirm: async (options = {}) => {
      const {
        title = 'Xác nhận',
        text = 'Bạn có chắc chắn?',
        confirmButtonText = 'Xác nhận',
        cancelButtonText = 'Hủy bỏ',
        icon = 'question',
        input = null,
        inputValue = '',
        inputPlaceholder = '',
        showCancelButton = true
      } = options;

      const { primary, isDark } = getThemeColor();

      const swalConfig = {
        title,
        showCancelButton,
        confirmButtonColor: primary,
        cancelButtonColor: '#6b7280',
        confirmButtonText,
        cancelButtonText,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        reverseButtons: true,
        customClass: {
          popup: 'swal-simple-popup',
          confirmButton: 'swal-simple-button',
          cancelButton: 'swal-simple-cancel'
        },
        // ✅ SỬA: Đặt màu icon cho question
        iconColor: primary
      };

      if (!input) {
        swalConfig.text = text;
        swalConfig.icon = icon;
      }

      if (input) {
        swalConfig.input = input;
        swalConfig.inputValue = inputValue;
        swalConfig.inputPlaceholder = inputPlaceholder;

        if (isDark) {
          swalConfig.inputAttributes = {
            style: `
              background-color: #374151;
              color: #ffffff;
              border: 1px solid #4b5563;
              border-radius: 0.5rem;
              padding: 0.75rem;
            `
          };
        }

        swalConfig.preConfirm = (value) => {
          if (!value || !value.trim()) {
            Swal.showValidationMessage('Vui lòng nhập giá trị hợp lệ');
            return false;
          }
          return value.trim();
        };
      }

      return Swal.fire(swalConfig);
    },

    showAgePrompt: (currentAge = null) => {
      const { primary, isDark } = getThemeColor();

      return Swal.fire({
        title: 'Chọn độ tuổi',
        html: `
          <div style="margin-top: 1rem;">
            <p style="color: ${isDark ? '#d1d5db' : '#6b7280'}; font-size: 0.875rem; margin-bottom: 1rem;">
              Chọn độ tuổi để nhận tư vấn dinh dưỡng phù hợp
            </p>
            <select id="swal-age" style="
              width: 100%;
              padding: 0.75rem;
              border-radius: 0.5rem;
              border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
              font-size: 0.875rem;
              background: ${isDark ? '#374151' : '#f9fafb'};
              color: ${isDark ? '#ffffff' : '#111827'};
              outline: none;
            ">
              ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
          `<option value="${age}" ${currentAge === age ? 'selected' : ''}>${age} tuổi</option>`
        ).join('')}
            </select>
          </div>
        `,
        confirmButtonText: 'Lưu lại',
        cancelButtonText: 'Hủy bỏ',
        showCancelButton: true,
        confirmButtonColor: primary,
        cancelButtonColor: '#6b7280',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        allowOutsideClick: false,
        reverseButtons: true,
        customClass: {
          popup: 'swal-simple-popup',
          confirmButton: 'swal-simple-button',
          cancelButton: 'swal-simple-cancel'
        },
        preConfirm: () => {
          const age = parseInt(document.getElementById('swal-age').value);
          if (isNaN(age) || age < 1 || age > 19) {
            Swal.showValidationMessage('Vui lòng chọn tuổi từ 1-19');
            return false;
          }
          return age;
        }
      });
    }
  };
};

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [state, setState] = useState(() => {
    const storedUser = storageService.getUserData();
    return {
      userData: storedUser,
      isLoading: false,
      isVerified: !storedUser,
      activeConversation: null,
      conversations: [],
      isLoadingConversations: false,
      userAge: storageService.getUserAge(),
      selectedConversations: [],
      searchTerm: '',
      filters: { date: 'all', age: 'all', archived: false }
    };
  });

  // ✅ SỬA: Sử dụng useRef để track việc đã load conversations chưa
  const conversationsLoadedRef = useRef(false);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ✅ SỬA: Cải thiện fetchConversations để luôn lấy được data mới nhất
  const fetchConversations = useCallback(async (force = false) => {
    if (!state.userData) {
      console.log('❌ No userData, skipping fetchConversations');
      return { success: false, conversations: [] };
    }

    // Nếu đã load và không force, skip
    if (conversationsLoadedRef.current && !force) {
      console.log('✅ Conversations already loaded and not forcing, skipping');
      return { success: true, conversations: state.conversations };
    }

    try {
      updateState({ isLoadingConversations: true });
      console.log('🔄 fetchConversations: Starting to load conversations...');

      // ✅ SỬA: Sử dụng getAllConversations để lấy tất cả
      const response = await chatService.getAllConversations(false); // false = không lấy archived

      if (response.success) {
        const conversations = response.conversations || [];
        updateState({
          conversations,
          isLoadingConversations: false
        });

        conversationsLoadedRef.current = true;
        console.log(`✅ fetchConversations: Loaded ${conversations.length} conversations`);

        return { success: true, conversations };
      } else {
        updateState({
          conversations: [],
          isLoadingConversations: false
        });
        console.error('❌ fetchConversations failed:', response.error);
        return { success: false, conversations: [] };
      }
    } catch (error) {
      console.error("❌ fetchConversations error:", error);
      updateState({
        conversations: [],
        isLoadingConversations: false
      });
      return { success: false, conversations: [] };
    }
  }, [state.userData, updateState, state.conversations]);

  const fetchConversationDetail = useCallback(async (id) => {
    if (!id) return null;

    try {
      console.log('fetchConversationDetail:', id);
      const response = await chatService.getConversationDetail(id);

      if (response.success) {
        updateState({ activeConversation: response.conversation });
        console.log('fetchConversationDetail: Loaded conversation detail:', response.conversation.id);
        return response.conversation; // Return conversation data
      }
      return null;
    } catch (error) {
      console.error("fetchConversationDetail error:", error);
      return null;
    }
  }, [updateState]);

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

          // ✅ SỬA: Reset conversations loaded flag khi login
          conversationsLoadedRef.current = false;

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
          updateState({ userData: null, isLoading: false, isVerified: true, conversations: [] });
          conversationsLoadedRef.current = false; // ✅ SỬA: Reset flag
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
            storageService.saveUserData(updatedUser, storageService.getToken(), storage);
          }

          return { success: true };
        }

        throw new Error(response.error);
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      try {
        const response = await authService.changePassword(currentPassword, newPassword);

        if (response.success) {
          return { success: true };
        }

        throw new Error(response.error);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  // ✅ SỬA: Cải thiện sendMessage để đảm bảo conversations được reload
  const sendMessage = useCallback(async (messageContent, conversationId = null) => {
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
          // ✅ SỬA: Force reload conversations để đảm bảo có conversation mới
          console.log('🔄 Message sent, forcing conversations reload...');
          conversationsLoadedRef.current = false; // Reset flag để force load
          await fetchConversations(true);

          await fetchConversationDetail(response.conversation_id);

          console.log('✅ Message sent and data reloaded');

          if (!conversationId) {
            navigate(`/chat/${response.conversation_id}`);
          }
        }
        return { success: true, response };
      }
      throw new Error(response.error);
    } catch (error) {
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
  }, [state.activeConversation, state.userAge, toast, updateState, navigate, fetchConversationDetail, fetchConversations]);

  // ✅ SỬA: Cải thiện startNewConversation
  const startNewConversation = useCallback(async (ageToUse = null) => {
    if (!state.userData?.id) {
      navigate('/login');
      return { success: false };
    }

    let currentAge = ageToUse || state.userAge;
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
      console.log('🔄 Creating new conversation...');
      const response = await chatService.createConversation('Cuộc trò chuyện mới', currentAge);

      if (response.success && response.conversation_id) {
        console.log(`✅ Created conversation: ${response.conversation_id}`);

        // ✅ SỬA: Force reload conversations
        conversationsLoadedRef.current = false;
        await fetchConversations(true);

        const conversation = await fetchConversationDetail(response.conversation_id);

        console.log('✅ New conversation ready:', conversation?.id);
        return conversation;
      }

      throw new Error(response.error || 'Failed to create conversation');
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      return { success: false, error: error.message };
    }
  }, [state.userData, state.userAge, navigate, toast, updateState, fetchConversationDetail, fetchConversations]);

  const deleteConversation = useCallback(async (id) => {
    try {
      const response = await chatService.deleteConversation(id);
      if (response.success) {
        updateState({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversation: state.activeConversation?.id === id ? null : state.activeConversation
        });

        // ✅ SỬA: Force reload conversations sau khi delete
        conversationsLoadedRef.current = false;

        return { success: true };
      }
      throw new Error(response.error);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }, [state.conversations, state.activeConversation, updateState]);

  const renameConversation = useCallback(async (id, newTitle) => {
    try {
      console.log('🔄 AppContext: Renaming conversation:', id, 'to:', newTitle);

      const response = await chatService.updateConversation(id, { title: newTitle });
      if (response.success) {
        // Cập nhật state trong context
        updateState({
          conversations: state.conversations.map(conv =>
            conv.id === id ? { ...conv, title: newTitle } : conv
          )
        });

        // Cập nhật activeConversation nếu đang rename conversation hiện tại
        if (state.activeConversation && state.activeConversation.id === id) {
          updateState({
            activeConversation: {
              ...state.activeConversation,
              title: newTitle
            }
          });
        }

        console.log('AppContext: Conversation renamed successfully');
        return { success: true };
      }
      throw new Error(response.error);
    } catch (error) {
      console.error("AppContext: Error renaming conversation:", error);
      throw error;
    }
  }, [state.conversations, state.activeConversation, updateState]);

  const editMessage = useCallback(async (messageId, conversationId, newContent) => {
    try {
      const tempEdit = { ...state.activeConversation };
      const messageIndex = tempEdit.messages.findIndex(m =>
        (m._id || m.id) === messageId
      );

      if (messageIndex !== -1) {
        tempEdit.messages[messageIndex] = {
          ...tempEdit.messages[messageIndex],
          content: newContent,
          isEditing: true
        };

        updateState({ activeConversation: tempEdit });

        const ageToUse = state.activeConversation.age_context || state.userAge;
        const response = await chatService.editMessage(messageId, conversationId, newContent, ageToUse);

        if (response.success) {
          await fetchConversationDetail(conversationId);
          return { success: true };
        }
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      await fetchConversationDetail(conversationId);
      throw error;
    }
  }, [state.activeConversation, state.userAge, updateState, fetchConversationDetail]);

  const switchMessageVersion = useCallback(async (messageId, conversationId, version) => {
    try {
      console.log('Switching to version:', version, 'for message:', messageId);
      const response = await chatService.switchMessageVersion(messageId, conversationId, version);

      if (response.success) {
        await fetchConversationDetail(conversationId);
        console.log('Version switched successfully');
        return { success: true };
      }
      throw new Error(response.error);
    } catch (error) {
      console.error("Error switching version:", error);
      throw error;
    }
  }, [fetchConversationDetail]);

  const regenerateResponse = useCallback(async (messageId, conversationId, age) => {
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
        await fetchConversationDetail(conversationId);
        return { success: true };
      }
      throw new Error(response.error);
    } catch (error) {
      console.error("Error regenerating:", error);
      await fetchConversationDetail(conversationId);
      throw error;
    }
  }, [state.activeConversation, updateState, fetchConversationDetail]);

  const deleteMessageAndFollowing = useCallback(async (messageId, conversationId) => {
    try {
      const response = await chatService.deleteMessageAndFollowing(messageId, conversationId);
      if (response.success) {
        await fetchConversationDetail(conversationId);
        return { success: true };
      }
      throw new Error(response.error);
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }, [fetchConversationDetail]);


  const helpers = {
    isAuthenticated: () => !!state.userData,

    requireAuth: (callback) => {
      if (!helpers.isAuthenticated()) {
        const { primary, isDark } = (() => {
          const theme = localStorage.getItem('theme') || 'mint';
          const darkMode = localStorage.getItem('darkMode') === 'true';

          const themeColors = {
            mint: '#36B37E',
            blue: '#2563EB',
            purple: '#8B5CF6',
            pink: '#EC4899',
            orange: '#F97316'
          };

          return {
            primary: themeColors[theme] || themeColors.mint,
            isDark: darkMode
          };
        })();

        Swal.fire({
          icon: 'info',
          title: 'Cần đăng nhập',
          text: 'Vui lòng đăng nhập để tiếp tục sử dụng',
          confirmButtonColor: primary,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#111827',
          confirmButtonText: 'Đăng nhập',
          allowOutsideClick: false,
          customClass: {
            popup: 'swal-simple-popup',
            confirmButton: 'swal-simple-button'
          },
          iconColor: primary
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
            conversationsLoadedRef.current = false; // ✅ SỬA: Reset flag
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          storageService.clearUserData();
          updateState({ userData: null, isVerified: true });
          conversationsLoadedRef.current = false; // ✅ SỬA: Reset flag
        }
      }
    };

    verifyToken();
  }, [state.userData, state.isVerified, updateState]);

  const value = {
    ...state,
    login: authOps.login,
    register: authOps.register,
    logout: authOps.logout,
    updateProfile: authOps.updateProfile,
    changePassword: authOps.changePassword,
    fetchConversations,
    fetchConversationDetail,
    sendMessage,
    startNewConversation,
    deleteConversation,
    renameConversation,
    editMessage,
    switchMessageVersion,
    regenerateResponse,
    deleteMessageAndFollowing,
    isAuthenticated: helpers.isAuthenticated,
    requireAuth: helpers.requireAuth,
    setUserAge: helpers.setUserAge,
    ...toast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};