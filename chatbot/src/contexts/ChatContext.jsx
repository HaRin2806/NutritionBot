import React, { createContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import chatService from '../services/chatService';
import storageService from '../services/storageService';
import { createTitleFromMessage, generateTempId } from '../utils/formatters';
import { groupConversationsByTime } from '../utils/dateUtils';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [state, setState] = useState({
        activeConversation: null,
        conversations: [],
        isLoading: false,
        isLoadingConversations: false,
        userAge: null,
        selectedConversations: [],
        searchTerm: '',
        filters: {
            date: 'all',
            age: 'all',
            archived: false
        },
        pagination: {
            page: 1,
            itemsPerPage: 10
        }
    });

    const navigate = useNavigate();
    const refs = useRef({
        fetchingDetail: false,
        hasInitializedAge: false
    });

    const updateState = useCallback((updates) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const ensureUserAge = useCallback(async () => {
        if (!state.userAge) {
            const storedAge = storageService.getUserAge();
            if (storedAge) {
                updateState({ userAge: storedAge });
                return storedAge;
            }
            return await promptUserForAge();
        }
        return state.userAge;
    }, [state.userAge]);

    const promptUserForAge = useCallback(() => {
        return new Promise((resolve) => {
            Swal.fire({
                title: 'Chào mừng bạn đến với Nutribot!',
                html: `
                    <select id="swal-age" class="swal2-input w-full">
                        <option value="">-- Chọn độ tuổi --</option>
                        ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
                            `<option value="${age}">${age} tuổi</option>`
                        ).join('')}
                    </select>
                `,
                confirmButtonText: 'Bắt đầu trò chuyện',
                confirmButtonColor: '#36B37E',
                allowOutsideClick: false,
                preConfirm: () => {
                    const age = parseInt(document.getElementById('swal-age').value);
                    if (isNaN(age) || age < 1 || age > 19) {
                        Swal.showValidationMessage('Vui lòng chọn độ tuổi từ 1-19');
                        return false;
                    }
                    return age;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const selectedAge = result.value;
                    updateState({ userAge: selectedAge });
                    storageService.saveUserAge(selectedAge);
                    resolve(selectedAge);
                }
            });
        });
    }, [updateState]);

    const fetchConversations = useCallback(async (includeArchived = false) => {
        try {
            updateState({ isLoadingConversations: true });
            const response = await chatService.getConversations(includeArchived);

            if (response.success) {
                const conversations = response.conversations;
                updateState({ conversations });

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
    }, [updateState]);

    const fetchConversationDetail = useCallback(async (id) => {
        if (!id || refs.current.fetchingDetail) return null;

        refs.current.fetchingDetail = true;
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
        } finally {
            refs.current.fetchingDetail = false;
        }
    }, [updateState]);

    // SỬA: sendMessage không navigate nữa
    const sendMessage = useCallback(async (messageContent, conversationId = null) => {
        const currentAge = await ensureUserAge();
        if (!currentAge) return { success: false, error: 'Cần thiết lập tuổi' };

        if (state.activeConversation?.age_context && 
            state.activeConversation.age_context !== currentAge) {
            const result = await Swal.fire({
                title: 'Độ tuổi không khớp',
                text: 'Tạo cuộc trò chuyện mới?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#36B37E'
            });

            if (result.isConfirmed) {
                await startNewConversation();
            }
            return { success: false, error: 'Độ tuổi không khớp' };
        }

        const tempMessage = {
            id: generateTempId(),
            role: 'user',
            content: messageContent,
            timestamp: new Date().toISOString()
        };

        if (state.activeConversation) {
            updateState({
                activeConversation: {
                    ...state.activeConversation,
                    messages: [...(state.activeConversation.messages || []), tempMessage]
                }
            });
        }

        updateState({ isLoading: true });

        try {
            const response = await chatService.sendMessage(messageContent, currentAge, conversationId);
            
            if (response.success) {
                if (response.conversation_id) {
                    // CHỈ fetch detail, KHÔNG navigate
                    await fetchConversationDetail(response.conversation_id);
                    // Chỉ navigate nếu đây là conversation mới hoàn toàn
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
                        messages: state.activeConversation.messages.filter(m => m.id !== tempMessage.id)
                    }
                });
            }
            return { success: false, error: error.message };
        } finally {
            updateState({ isLoading: false });
        }
    }, [state.activeConversation, state.userAge, ensureUserAge, updateState, navigate, fetchConversationDetail]);

    const conversationOperations = {
        create: async () => {
            const user = storageService.getUserData();
            if (!user?.id) {
                navigate('/login');
                return { success: false };
            }

            const currentAge = await ensureUserAge();
            if (!currentAge) return { success: false };

            try {
                const response = await chatService.createConversation('Cuộc trò chuyện mới', currentAge);
                if (response.success) {
                    if (response.conversation_id) {
                        await fetchConversationDetail(response.conversation_id);
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

        delete: async (conversationId) => {
            try {
                const response = await chatService.deleteConversation(conversationId);
                if (response.success) {
                    const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
                    updateState({ conversations: updatedConversations });

                    if (state.activeConversation?.id === conversationId) {
                        if (updatedConversations.length > 0) {
                            await fetchConversationDetail(updatedConversations[0].id);
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

        rename: async (conversationId, currentTitle) => {
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

        bulkDelete: async (conversationIds) => {
            try {
                const response = await chatService.bulkDeleteConversations(conversationIds);
                if (response.success) {
                    updateState({
                        conversations: state.conversations.filter(c => !conversationIds.includes(c.id)),
                        selectedConversations: []
                    });
                    return { success: true, deletedCount: response.deleted_count };
                }
                throw new Error(response.error);
            } catch (error) {
                console.error("Error bulk deleting:", error);
                return { success: false };
            }
        }
    };

    const messageOperations = {
        edit: async (messageId, conversationId, newContent) => {
            try {
                const response = await chatService.editMessage(messageId, conversationId, newContent, state.userAge);
                if (response.success) {
                    updateState({
                        activeConversation: {
                            ...state.activeConversation,
                            messages: state.activeConversation.messages.map(msg =>
                                (msg._id || msg.id) === messageId 
                                    ? { ...msg, content: newContent, is_edited: true }
                                    : msg
                            )
                        }
                    });
                    return { success: true };
                }
                throw new Error(response.error);
            } catch (error) {
                console.error("Error editing message:", error);
                throw error;
            }
        },

        switchVersion: async (messageId, conversationId, version) => {
            try {
                const response = await chatService.switchMessageVersion(messageId, conversationId, version);
                if (response.success) {
                    await fetchConversationDetail(conversationId);
                    return { success: true };
                }
                throw new Error(response.error);
            } catch (error) {
                console.error("Error switching version:", error);
                throw error;
            }
        },

        regenerate: async (messageId, conversationId, age) => {
            try {
                const response = await chatService.regenerateResponse(messageId, conversationId, age);
                if (response.success) {
                    await fetchConversationDetail(conversationId);
                    return { success: true };
                }
                throw new Error(response.error);
            } catch (error) {
                console.error("Error regenerating:", error);
                throw error;
            }
        },

        delete: async (messageId, conversationId) => {
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
        }
    };

    const utilities = {
        filterConversations: (conversations) => {
            let filtered = conversations;

            if (!state.filters.archived) {
                filtered = filtered.filter(conv => !conv.is_archived);
            }

            if (state.searchTerm) {
                filtered = filtered.filter(conv => 
                    conv.title.toLowerCase().includes(state.searchTerm.toLowerCase())
                );
            }

            if (state.filters.age !== 'all') {
                filtered = filtered.filter(conv => conv.age_context === parseInt(state.filters.age));
            }

            return filtered;
        },

        groupConversations: (conversations) => groupConversationsByTime(conversations),

        updateFilters: (newFilters) => {
            updateState({
                filters: { ...state.filters, ...newFilters },
                pagination: { ...state.pagination, page: 1 }
            });
        },

        updatePagination: (newPagination) => {
            updateState({
                pagination: { ...state.pagination, ...newPagination }
            });
        },

        selectConversations: (ids) => {
            updateState({ selectedConversations: ids });
        }
    };

    const value = {
        ...state,
        fetchConversations,
        fetchConversationDetail,
        sendMessage,
        ensureUserAge,
        promptUserForAge,
        startNewConversation: conversationOperations.create,
        deleteConversation: conversationOperations.delete,
        renameConversation: conversationOperations.rename,
        bulkDeleteConversations: conversationOperations.bulkDelete,
        editMessage: messageOperations.edit,
        switchMessageVersion: messageOperations.switchVersion,
        regenerateResponse: messageOperations.regenerate,
        deleteMessageAndFollowing: messageOperations.delete,
        filterConversations: utilities.filterConversations,
        groupConversations: utilities.groupConversations,
        updateFilters: utilities.updateFilters,
        updatePagination: utilities.updatePagination,
        selectConversations: utilities.selectConversations,
        updateState,
        setUserAge: (age) => {
            updateState({ userAge: age });
            storageService.saveUserAge(age);
        }
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};