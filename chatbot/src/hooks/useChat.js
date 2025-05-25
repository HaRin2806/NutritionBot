import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import chatService from '../services/chatService';
import storageService from '../services/storageService';
import { createTitleFromMessage, generateTempId } from '../utils/formatters';

const useChat = () => {
    const [activeConversation, setActiveConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [userAge, setUserAge] = useState(null);
    const navigate = useNavigate();
    const fetchingDetailRef = useRef(false);
    const hasInitializedAge = useRef(false);

    /**
     * Lấy danh sách cuộc hội thoại và xử lý tuổi
     */
    const fetchConversations = useCallback(async (includeArchived = false) => {
        try {
            setIsLoadingConversations(true);
            const response = await chatService.getConversations(includeArchived);

            if (response.success) {
                const fetchedConversations = response.conversations;
                setConversations(fetchedConversations);

                if (!hasInitializedAge.current) {
                    hasInitializedAge.current = true;

                    const storedAge = storageService.getUserAge();

                    if (storedAge) {
                        console.log('Người dùng cũ - lấy tuổi từ storage:', storedAge);
                        setUserAge(storedAge);
                    } else if (fetchedConversations.length > 0) {
                        const lastConversationWithAge = fetchedConversations
                            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                            .find(conv => conv.age_context);

                        if (lastConversationWithAge && lastConversationWithAge.age_context) {
                            console.log('Lấy tuổi từ cuộc hội thoại gần nhất:', lastConversationWithAge.age_context);
                            setUserAge(lastConversationWithAge.age_context);
                            storageService.saveUserAge(lastConversationWithAge.age_context);
                        } else {
                            console.log('Người dùng mới - không có tuổi');
                            setUserAge(null);
                        }
                    } else {
                        console.log('Người dùng hoàn toàn mới');
                        setUserAge(null);
                    }
                }

                return fetchedConversations;
            }

            return [];
        } catch (error) {
            console.error("Lỗi khi lấy danh sách cuộc hội thoại:", error);
            return [];
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    /**
     * Lấy chi tiết cuộc hội thoại
     */
    const fetchConversationDetail = useCallback(async (id) => {
        if (!id || fetchingDetailRef.current) return null;

        fetchingDetailRef.current = true;
        try {
            const response = await chatService.getConversationDetail(id);

            if (response.success) {
                const conversation = response.conversation;
                setActiveConversation(conversation);
                return conversation;
            }

            return null;
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết cuộc hội thoại:", error);
            return null;
        } finally {
            fetchingDetailRef.current = false;
        }
    }, []);

    /**
     * Nhắc người dùng thiết lập tuổi
     */
    const promptUserForAge = useCallback(() => {
        return new Promise((resolve) => {
            Swal.fire({
                title: 'Chào mừng bạn đến với Nutribot!',
                html: `
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-3">Để nhận được thông tin dinh dưỡng phù hợp, vui lòng cho biết độ tuổi của bạn</p>
                        <select id="swal-age" class="swal2-input w-full">
                            <option value="">-- Chọn độ tuổi --</option>
                            ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
                    `<option value="${age}">${age} tuổi</option>`
                ).join('')}
                        </select>
                    </div>
                `,
                confirmButtonText: 'Bắt đầu trò chuyện',
                confirmButtonColor: '#36B37E',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showCancelButton: false,
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
                    console.log('Người dùng đã chọn tuổi:', selectedAge);
                    setUserAge(selectedAge);
                    storageService.saveUserAge(selectedAge);
                    resolve(selectedAge);
                }
            });
        });
    }, []);

    /**
     * Đảm bảo có tuổi trước khi thực hiện hành động
     */
    const ensureUserAge = useCallback(async () => {
        console.log('ensureUserAge - Current userAge:', userAge);

        if (!userAge) {
            const storedAge = storageService.getUserAge();
            console.log('ensureUserAge - Stored age:', storedAge);

            if (storedAge) {
                setUserAge(storedAge);
                return storedAge;
            } else {
                console.log('Bắt buộc chọn tuổi');
                return await promptUserForAge();
            }
        }
        return userAge;
    }, [userAge, promptUserForAge]);

    /**
     * Tạo cuộc hội thoại mới
     */
    const startNewConversation = useCallback(async () => {
        const user = storageService.getUserData();

        if (!user || !user.id) {
            navigate('/login');
            return { success: false, error: 'Bạn cần đăng nhập để tạo cuộc hội thoại mới' };
        }

        const currentAge = await ensureUserAge();
        if (!currentAge) {
            return { success: false, error: 'Cần thiết lập tuổi trước khi tạo cuộc hội thoại' };
        }

        try {
            const response = await chatService.createConversation('Cuộc trò chuyện mới', currentAge);

            if (response.success) {
                await fetchConversations();

                const conversationId = response.conversation_id;
                if (conversationId) {
                    await fetchConversationDetail(conversationId);
                    navigate(`/chat/${conversationId}`);
                }

                return { success: true, conversationId };
            }

            throw new Error(response.error || 'Không thể tạo cuộc hội thoại mới');
        } catch (error) {
            console.error("Lỗi khi tạo cuộc hội thoại mới:", error);

            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tạo cuộc hội thoại mới',
                confirmButtonColor: '#36B37E'
            });

            return { success: false, error: error.message || 'Không thể tạo cuộc hội thoại mới' };
        }
    }, [navigate, fetchConversationDetail, fetchConversations, ensureUserAge]);

    /**
     * Gửi tin nhắn
     */
    const sendMessage = useCallback(async (messageContent, conversationId = null) => {
        const currentAge = await ensureUserAge();
        if (!currentAge) {
            return { success: false, error: 'Cần thiết lập tuổi trước khi gửi tin nhắn' };
        }

        if (activeConversation && activeConversation.id &&
            activeConversation.age_context &&
            activeConversation.age_context !== currentAge) {
            const result = await Swal.fire({
                title: 'Độ tuổi không khớp',
                text: 'Cuộc trò chuyện này đã được thiết lập cho độ tuổi khác. Vui lòng tạo cuộc trò chuyện mới nếu muốn sử dụng độ tuổi hiện tại.',
                icon: 'warning',
                confirmButtonText: 'Tạo cuộc trò chuyện mới',
                cancelButtonText: 'Đóng',
                showCancelButton: true,
                confirmButtonColor: '#36B37E'
            });

            if (result.isConfirmed) {
                await startNewConversation();
            } else {
                setUserAge(activeConversation.age_context);
                storageService.saveUserAge(activeConversation.age_context);
            }
            return { success: false, error: 'Độ tuổi không khớp với cuộc trò chuyện' };
        }

        const tempUserId = generateTempId();
        const userMessage = {
            id: tempUserId,
            role: 'user',
            content: messageContent,
            timestamp: new Date().toISOString()
        };

        const isNewConversation = activeConversation &&
            activeConversation.id &&
            (!activeConversation.messages || activeConversation.messages.length === 0);

        if (isNewConversation) {
            const newTitle = createTitleFromMessage(messageContent);

            setActiveConversation(prev => ({
                ...prev,
                title: newTitle
            }));

            setConversations(prevConversations =>
                prevConversations.map(conv =>
                    conv.id === activeConversation.id
                        ? { ...conv, title: newTitle }
                        : conv
                )
            );

            try {
                chatService.updateConversation(activeConversation.id, { title: newTitle });
            } catch (error) {
                console.error("Lỗi khi cập nhật tiêu đề cuộc hội thoại:", error);
            }
        }

        if (activeConversation) {
            setActiveConversation(prev => {
                const updatedConversation = { ...prev };
                if (!updatedConversation.messages) {
                    updatedConversation.messages = [];
                }
                updatedConversation.messages = [...updatedConversation.messages, userMessage];
                return updatedConversation;
            });
        } else {
            setActiveConversation({
                id: null,
                title: createTitleFromMessage(messageContent),
                messages: [userMessage],
                age_context: currentAge
            });
        }

        setIsLoading(true);

        try {
            const response = await chatService.sendMessage(
                messageContent,
                currentAge,
                conversationId || activeConversation?.id
            );

            if (response.success) {
                if (response.conversation_id && (!activeConversation?.id || conversationId !== activeConversation?.id)) {
                    await fetchConversationDetail(response.conversation_id);
                    await fetchConversations();
                    navigate(`/chat/${response.conversation_id}`);
                } else if (activeConversation && activeConversation.id) {
                    await fetchConversationDetail(activeConversation.id);
                } else {
                    const botMessage = {
                        id: generateTempId(),
                        role: 'bot',
                        content: response.reply,
                        timestamp: new Date().toISOString(),
                        sources: response.sources || []
                    };

                    setActiveConversation(prev => {
                        const updatedConversation = { ...prev };
                        updatedConversation.messages = [...updatedConversation.messages, botMessage];
                        return updatedConversation;
                    });
                }

                return { success: true, response };
            }

            throw new Error(response.error || 'Có lỗi xảy ra');
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);

            if (activeConversation) {
                setActiveConversation(prev => {
                    const updatedConversation = { ...prev };
                    updatedConversation.messages = updatedConversation.messages.filter(m => m.id !== tempUserId);
                    return updatedConversation;
                });
            }

            Swal.fire({
                icon: 'error',
                title: 'Lỗi kết nối',
                text: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
                confirmButtonText: 'Đóng',
                confirmButtonColor: '#36B37E'
            });

            return { success: false, error: error.message || 'Lỗi khi gửi tin nhắn' };
        } finally {
            setIsLoading(false);
        }
    }, [activeConversation, navigate, fetchConversationDetail, fetchConversations, ensureUserAge, startNewConversation]);

    /**
     * Chỉnh sửa tin nhắn - Sửa lại flow để đúng
     */
    const editMessage = useCallback(async (messageId, conversationId, newContent) => {
        try {
            const currentAge = userAge || storageService.getUserAge();
            if (!currentAge) {
                throw new Error('Thiếu thông tin độ tuổi');
            }

            // Bước 1: Cập nhật tin nhắn user ngay lập tức
            setActiveConversation(prev => {
                if (!prev) return prev;

                const updatedMessages = prev.messages.map(msg => {
                    if ((msg._id || msg.id) === messageId) {
                        return {
                            ...msg,
                            content: newContent,
                            is_edited: true
                        };
                    }
                    return msg;
                });

                return {
                    ...prev,
                    messages: updatedMessages
                };
            });

            // Bước 2: Set bot message thành typing indicator
            setActiveConversation(prev => {
                if (!prev) return prev;

                const messageIndex = prev.messages.findIndex(msg =>
                    (msg._id || msg.id) === messageId
                );

                if (messageIndex >= 0) {
                    const botMessageIndex = messageIndex + 1;
                    if (botMessageIndex < prev.messages.length &&
                        prev.messages[botMessageIndex].role === 'bot') {

                        const updatedMessages = [...prev.messages];
                        updatedMessages[botMessageIndex] = {
                            ...updatedMessages[botMessageIndex],
                            isRegenerating: true
                        };

                        return {
                            ...prev,
                            messages: updatedMessages
                        };
                    }
                }

                return prev;
            });

            // Bước 3: Gọi API edit
            const response = await chatService.editMessage(messageId, conversationId, newContent, currentAge);

            if (response.success && response.bot_message_exists) {
                // Bước 4: Polling để check khi nào regenerate xong
                const pollForCompletion = async () => {
                    const maxAttempts = 30; // Tối đa 30 lần (15 giây)
                    let attempts = 0;

                    const checkCompletion = async () => {
                        attempts++;

                        try {
                            // Lấy conversation mới nhất
                            const latestConversation = await chatService.getConversationDetail(conversationId);

                            if (latestConversation.success) {
                                const botMessage = latestConversation.conversation.messages.find(msg =>
                                    (msg._id || msg.id) === response.bot_message_id
                                );

                                // Check xem bot message có còn flag isRegenerating không
                                if (botMessage && !botMessage.isRegenerating) {
                                    // Regenerate đã xong, cập nhật UI
                                    setActiveConversation(latestConversation.conversation);
                                    return true;
                                }
                            }

                            // Chưa xong, thử lại sau 500ms
                            if (attempts < maxAttempts) {
                                setTimeout(checkCompletion, 500);
                            } else {
                                // Timeout, refresh anyway
                                await fetchConversationDetail(conversationId);
                            }

                        } catch (error) {
                            console.error('Error polling for completion:', error);
                            if (attempts < maxAttempts) {
                                setTimeout(checkCompletion, 500);
                            }
                        }
                    };

                    // Bắt đầu polling sau 1 giây
                    setTimeout(checkCompletion, 1000);
                };

                pollForCompletion();
            }

            return { success: true };

        } catch (error) {
            console.error('Error editing message:', error);
            // Rollback nếu có lỗi
            await fetchConversationDetail(conversationId);
            throw error;
        }
    }, [fetchConversationDetail, userAge]);

    /**
     * Chuyển đổi version tin nhắn
     */
    const switchMessageVersion = useCallback(async (messageId, conversationId, version) => {
        try {
            const response = await chatService.switchMessageVersion(messageId, conversationId, version);

            if (response.success) {
                await fetchConversationDetail(conversationId);
                return { success: true };
            } else {
                throw new Error(response.error || 'Không thể chuyển đổi version');
            }
        } catch (error) {
            console.error('Error switching version:', error);

            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể chuyển đổi version: ' + (error.error || error.message),
                confirmButtonColor: '#36B37E'
            });

            throw error;
        }
    }, [fetchConversationDetail]);

    /**
     * Tạo lại phản hồi của bot
     */
    const regenerateResponse = useCallback(async (messageId, conversationId, age) => {
        try {
            const response = await chatService.regenerateResponse(messageId, conversationId, age);

            if (response.success) {
                await fetchConversationDetail(conversationId);

                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Đã tạo lại phản hồi thành công',
                    confirmButtonColor: '#36B37E',
                    timer: 1500,
                    showConfirmButton: false
                });

                return { success: true };
            } else {
                throw new Error(response.error || 'Không thể tạo lại phản hồi');
            }
        } catch (error) {
            console.error('Error regenerating response:', error);

            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tạo lại phản hồi: ' + (error.error || error.message),
                confirmButtonColor: '#36B37E'
            });

            throw error;
        }
    }, [fetchConversationDetail]);

    /**
     * Xóa tin nhắn và tất cả tin nhắn sau nó
     */
    const deleteMessageAndFollowing = useCallback(async (messageId, conversationId) => {
        try {
            const response = await chatService.deleteMessageAndFollowing(messageId, conversationId);

            if (response.success) {
                await fetchConversationDetail(conversationId);

                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Đã xóa tin nhắn và các tin nhắn sau nó',
                    confirmButtonColor: '#36B37E',
                    timer: 1500,
                    showConfirmButton: false
                });

                return { success: true };
            } else {
                throw new Error(response.error || 'Không thể xóa tin nhắn');
            }
        } catch (error) {
            console.error('Error deleting message:', error);

            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể xóa tin nhắn: ' + (error.error || error.message),
                confirmButtonColor: '#36B37E'
            });

            throw error;
        }
    }, [fetchConversationDetail]);

    // Các hàm khác giữ nguyên...
    const deleteConversation = useCallback(async (conversationId) => {
        try {
            const response = await chatService.deleteConversation(conversationId);

            if (response.success) {
                const updatedConversations = conversations.filter(c => c.id !== conversationId);
                setConversations(updatedConversations);

                if (activeConversation && activeConversation.id === conversationId) {
                    if (updatedConversations.length > 0) {
                        await fetchConversationDetail(updatedConversations[0].id);
                        navigate(`/chat/${updatedConversations[0].id}`);
                    } else {
                        setActiveConversation(null);
                        navigate('/chat');
                    }
                }

                return { success: true };
            }

            throw new Error(response.error || 'Không thể xóa cuộc hội thoại');
        } catch (error) {
            console.error("Lỗi khi xóa cuộc hội thoại:", error);
            return { success: false, error: error.message || 'Không thể xóa cuộc hội thoại' };
        }
    }, [activeConversation, conversations, navigate, fetchConversationDetail]);

    const renameConversation = useCallback(async (conversationId, currentTitle) => {
        try {
            const result = await Swal.fire({
                title: 'Đổi tên cuộc trò chuyện',
                input: 'text',
                inputValue: currentTitle,
                inputAttributes: {
                    autocapitalize: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Lưu',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#36B37E',
                preConfirm: (title) => {
                    if (!title.trim()) {
                        Swal.showValidationMessage('Tên cuộc trò chuyện không được để trống');
                    }
                    return title;
                }
            });

            if (result.isConfirmed) {
                const response = await chatService.updateConversation(conversationId, {
                    title: result.value
                });

                if (response.success) {
                    setConversations(prevConversations =>
                        prevConversations.map(conv =>
                            conv.id === conversationId
                                ? { ...conv, title: result.value }
                                : conv
                        )
                    );

                    if (activeConversation && activeConversation.id === conversationId) {
                        setActiveConversation(prev => ({
                            ...prev,
                            title: result.value
                        }));
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Đã đổi tên',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    return { success: true };
                }

                throw new Error(response.error || 'Không thể đổi tên cuộc hội thoại');
            }

            return { success: false, cancelled: true };
        } catch (error) {
            console.error("Lỗi khi đổi tên cuộc hội thoại:", error);
            return { success: false, error: error.message || 'Không thể đổi tên cuộc hội thoại' };
        }
    }, [activeConversation]);

    const updateUserAge = useCallback(async (age, conversationId = null) => {
        setUserAge(age);
        storageService.saveUserAge(age);

        if (conversationId && activeConversation) {
            try {
                await chatService.updateConversation(conversationId, {
                    age_context: age
                });

                if (activeConversation.id === conversationId) {
                    setActiveConversation(prev => ({
                        ...prev,
                        age_context: age
                    }));
                }

                setConversations(prevConversations =>
                    prevConversations.map(conv =>
                        conv.id === conversationId
                            ? { ...conv, age_context: age }
                            : conv
                    )
                );

                return { success: true };
            } catch (error) {
                console.error("Lỗi khi cập nhật tuổi cho cuộc hội thoại:", error);
                return { success: false, error: error.message || 'Không thể cập nhật độ tuổi' };
            }
        }

        return { success: true };
    }, [activeConversation]);

    useEffect(() => {
        return () => {
            setActiveConversation(null);
        };
    }, []);

    return {
        activeConversation,
        conversations,
        isLoading,
        isLoadingConversations,
        userAge,
        setActiveConversation,
        setUserAge,
        fetchConversations,
        fetchConversationDetail,
        sendMessage,
        startNewConversation,
        deleteConversation,
        renameConversation,
        updateUserAge,
        promptUserForAge,
        ensureUserAge,
        editMessage,
        switchMessageVersion,
        regenerateResponse,
        deleteMessageAndFollowing
    };
};

export default useChat;