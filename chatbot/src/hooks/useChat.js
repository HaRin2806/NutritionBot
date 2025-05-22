import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ChatContext } from '../contexts/ChatContext';
import chatService from '../services/chatService';
import storageService from '../services/storageService';
import { createTitleFromMessage, generateTempId } from '../utils/formatters';

/**
 * Hook quản lý các chức năng chat
 * @returns {Object} Các hàm và state quản lý chat
 */
const useChat = () => {
    // State
    const [activeConversation, setActiveConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [userAge, setUserAge] = useState(storageService.getUserAge());
    const navigate = useNavigate();
    const fetchingDetailRef = useRef(false); // Prevent redundant API calls

    /**
     * Lấy danh sách cuộc hội thoại
     * @param {boolean} includeArchived - Có lấy cuộc hội thoại đã lưu trữ
     * @returns {Promise<Array>} Danh sách cuộc hội thoại
     */
    const fetchConversations = useCallback(async (includeArchived = false) => {
        try {
            setIsLoadingConversations(true);
            const response = await chatService.getConversations(includeArchived);

            if (response.success) {
                const fetchedConversations = response.conversations;
                setConversations(fetchedConversations);

                // Lấy tuổi từ cuộc hội thoại gần đây nhất có age_context
                if (!userAge && fetchedConversations.length > 0) {
                    const lastConversationWithAge = fetchedConversations.find(conv => conv.age_context);
                    if (lastConversationWithAge && lastConversationWithAge.age_context) {
                        setUserAge(lastConversationWithAge.age_context);
                        storageService.saveUserAge(lastConversationWithAge.age_context);
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
    }, [userAge]);

    /**
     * Lấy chi tiết cuộc hội thoại
     * @param {string} id - ID cuộc hội thoại
     * @returns {Promise<Object>} Chi tiết cuộc hội thoại
     */
    const fetchConversationDetail = useCallback(async (id) => {
        if (!id || fetchingDetailRef.current) return null;

        fetchingDetailRef.current = true;
        try {
            const response = await chatService.getConversationDetail(id);

            if (response.success) {
                const conversation = response.conversation;
                setActiveConversation(conversation);

                // Cập nhật userAge từ age_context nếu có
                if (conversation.age_context && !userAge) {
                    setUserAge(conversation.age_context);
                    storageService.saveUserAge(conversation.age_context);
                }

                return conversation;
            }

            return null;
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết cuộc hội thoại:", error);
            return null;
        } finally {
            fetchingDetailRef.current = false;
        }
    }, [userAge]);

    /**
     * Nhắc người dùng thiết lập tuổi
     */
    const promptUserForAge = useCallback(() => {
        if (!userAge) {
            setTimeout(() => {
                Swal.fire({
                    title: 'Thiết lập độ tuổi',
                    text: 'Vui lòng thiết lập độ tuổi để nhận được thông tin dinh dưỡng phù hợp',
                    icon: 'info',
                    html: `
            <select id="swal-age" class="swal2-input">
              ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
                        `<option value="${age}" ${userAge === age ? 'selected' : ''}>${age} tuổi</option>`
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
                }).then((result) => {
                    if (result.isConfirmed) {
                        setUserAge(result.value);
                        storageService.saveUserAge(result.value);
                    }
                });
            }, 1000);
        }
    }, [userAge]);

    /**
     * Tạo cuộc hội thoại mới
     * @returns {Promise<Object>} Kết quả tạo cuộc hội thoại
     */
    const startNewConversation = useCallback(async () => {
        const user = storageService.getUserData();

        if (!user || !user.id) {
            navigate('/login');
            return { success: false, error: 'Bạn cần đăng nhập để tạo cuộc hội thoại mới' };
        }

        try {
            const response = await chatService.createConversation('Cuộc trò chuyện mới', userAge);

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

            // Hiển thị thông báo lỗi
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tạo cuộc hội thoại mới',
                confirmButtonColor: '#36B37E'
            });

            return { success: false, error: error.message || 'Không thể tạo cuộc hội thoại mới' };
        }
    }, [userAge, navigate, fetchConversationDetail, fetchConversations]);

    /**
     * Gửi tin nhắn
     * @param {string} messageContent - Nội dung tin nhắn
     * @param {string} conversationId - ID cuộc hội thoại
     * @returns {Promise<Object>} Kết quả gửi tin nhắn
     */
    const sendMessage = useCallback(async (messageContent, conversationId = null) => {
        // Kiểm tra nếu không có tuổi
        if (!userAge) {
            Swal.fire({
                title: 'Chưa thiết lập tuổi',
                text: 'Bạn cần thiết lập tuổi để nhận câu trả lời phù hợp.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Thiết lập ngay',
                cancelButtonText: 'Để sau',
                confirmButtonColor: '#36B37E'
            }).then((result) => {
                if (result.isConfirmed) {
                    promptUserForAge();
                }
            });
            return { success: false, error: 'Cần thiết lập tuổi trước khi gửi tin nhắn' };
        }

        // Kiểm tra nếu đang trong một cuộc hội thoại có age_context khác với userAge hiện tại
        if (activeConversation && activeConversation.id &&
            activeConversation.age_context &&
            activeConversation.age_context !== userAge) {
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
                // Khôi phục lại tuổi theo age_context của cuộc hội thoại
                setUserAge(activeConversation.age_context);
                storageService.saveUserAge(activeConversation.age_context);
            }
            return { success: false, error: 'Độ tuổi không khớp với cuộc trò chuyện' };
        }

        // Tạo ID tạm thời cho tin nhắn người dùng
        const tempUserId = generateTempId();

        // Tạo tin nhắn người dùng để hiển thị ngay lập tức
        const userMessage = {
            id: tempUserId,
            role: 'user',
            content: messageContent,
            timestamp: new Date().toISOString()
        };

        // Kiểm tra xem đây có phải là cuộc trò chuyện mới không
        const isNewConversation = activeConversation &&
            activeConversation.id &&
            (!activeConversation.messages || activeConversation.messages.length === 0);

        // Nếu là cuộc trò chuyện mới, cập nhật tiêu đề
        if (isNewConversation) {
            const newTitle = createTitleFromMessage(messageContent);

            // Cập nhật title trong state của activeConversation
            setActiveConversation(prev => ({
                ...prev,
                title: newTitle
            }));

            // Cập nhật title trong danh sách conversations
            setConversations(prevConversations =>
                prevConversations.map(conv =>
                    conv.id === activeConversation.id
                        ? { ...conv, title: newTitle }
                        : conv
                )
            );

            // Cập nhật title trong database
            try {
                chatService.updateConversation(activeConversation.id, { title: newTitle });
            } catch (error) {
                console.error("Lỗi khi cập nhật tiêu đề cuộc hội thoại:", error);
            }
        }

        // Cập nhật state để hiển thị tin nhắn người dùng ngay lập tức
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
            // Nếu chưa có cuộc hội thoại, tạo mới
            setActiveConversation({
                id: null,
                title: createTitleFromMessage(messageContent),
                messages: [userMessage],
                age_context: userAge
            });
        }

        // Bắt đầu loading
        setIsLoading(true);

        try {
            // Gọi API
            const response = await chatService.sendMessage(
                messageContent,
                userAge,
                conversationId || activeConversation?.id
            );

            if (response.success) {
                // Xử lý khi có conversation_id mới
                if (response.conversation_id && (!activeConversation?.id || conversationId !== activeConversation?.id)) {
                    await fetchConversationDetail(response.conversation_id);
                    await fetchConversations();
                    navigate(`/chat/${response.conversation_id}`);
                } else if (activeConversation && activeConversation.id) {
                    await fetchConversationDetail(activeConversation.id);
                } else {
                    // Tạo tin nhắn bot trực tiếp nếu không có conversation_id
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

            // Xóa tin nhắn tạm nếu gặp lỗi
            if (activeConversation) {
                setActiveConversation(prev => {
                    const updatedConversation = { ...prev };
                    updatedConversation.messages = updatedConversation.messages.filter(m => m.id !== tempUserId);
                    return updatedConversation;
                });
            }

            // Hiển thị thông báo lỗi
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
    }, [activeConversation, userAge, navigate, fetchConversationDetail, fetchConversations, promptUserForAge, startNewConversation]);

    /**
     * Xóa cuộc hội thoại
     * @param {string} conversationId - ID cuộc hội thoại
     * @returns {Promise<Object>} Kết quả xóa cuộc hội thoại
     */
    const deleteConversation = useCallback(async (conversationId) => {
        try {
            const response = await chatService.deleteConversation(conversationId);

            if (response.success) {
                // Cập nhật state
                const updatedConversations = conversations.filter(c => c.id !== conversationId);
                setConversations(updatedConversations);

                // Nếu đang xem cuộc hội thoại bị xóa, chuyển sang cuộc khác
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

    /**
     * Đổi tên cuộc hội thoại
     * @param {string} conversationId - ID cuộc hội thoại
     * @param {string} currentTitle - Tiêu đề hiện tại
     * @returns {Promise<Object>} Kết quả đổi tên
     */
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
                    // Cập nhật title trong state
                    setConversations(prevConversations =>
                        prevConversations.map(conv =>
                            conv.id === conversationId
                                ? { ...conv, title: result.value }
                                : conv
                        )
                    );

                    // Nếu đang xem cuộc hội thoại được đổi tên, cập nhật title
                    if (activeConversation && activeConversation.id === conversationId) {
                        setActiveConversation(prev => ({
                            ...prev,
                            title: result.value
                        }));
                    }

                    // Hiển thị thông báo thành công
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

    /**
     * Cập nhật tuổi người dùng
     * @param {number} age - Tuổi mới
     * @param {string} conversationId - ID cuộc hội thoại cần cập nhật
     * @returns {Promise<Object>} Kết quả cập nhật
     */
    const updateUserAge = useCallback(async (age, conversationId = null) => {
        setUserAge(age);
        storageService.saveUserAge(age);

        // Nếu đang trong cuộc hội thoại, cập nhật age_context
        if (conversationId && activeConversation) {
            try {
                await chatService.updateConversation(conversationId, {
                    age_context: age
                });

                // Cập nhật trong state
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

    // Clear active conversation when navigating out
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
        promptUserForAge
    };
};

export default useChat;