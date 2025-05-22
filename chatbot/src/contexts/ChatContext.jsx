import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../services/chatService';
import storageService from '../services/storageService';
import { createTitleFromMessage, generateTempId } from '../utils/formatters';
import Swal from 'sweetalert2';

// Tạo context
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [activeConversation, setActiveConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userAge, setUserAge] = useState(null);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const navigate = useNavigate();

    // Khởi tạo dữ liệu từ localStorage
    useEffect(() => {
        // Lấy tuổi từ storage
        const storedAge = storageService.getUserAge();
        if (storedAge) {
            setUserAge(storedAge);
        }

        // Lấy danh sách cuộc hội thoại nếu đã đăng nhập
        const user = storageService.getUserData();
        if (user && user.id) {
            fetchConversations();
        }
    }, []);

    // Lấy danh sách cuộc hội thoại
    const fetchConversations = async () => {
        try {
            setIsLoadingConversations(true);
            const response = await chatService.getConversations(false, 1, 100);

            if (response.success) {
                const fetchedConversations = response.conversations;
                setConversations(fetchedConversations);

                // Lấy tuổi từ cuộc hội thoại gần đây nhất có age_context nếu chưa có
                if (!userAge && fetchedConversations.length > 0) {
                    // Tìm cuộc hội thoại gần đây nhất có age_context
                    const lastConversationWithAge = fetchedConversations.find(conv => conv.age_context);
                    if (lastConversationWithAge && lastConversationWithAge.age_context) {
                        setUserAge(lastConversationWithAge.age_context);
                        storageService.saveUserAge(lastConversationWithAge.age_context);
                    } else {
                        // Nếu chưa có cuộc hội thoại nào có age_context, cần nhắc người dùng thiết lập
                        promptUserForAge();
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách cuộc hội thoại:", error);
        } finally {
            setIsLoadingConversations(false);
        }
    };

    // Lấy chi tiết cuộc hội thoại
    const fetchConversationDetail = async (id) => {
        if (!id) return;

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
            }
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết cuộc hội thoại:", error);
        }
    };

    // Hàm nhắc người dùng thiết lập tuổi nếu cần
    const promptUserForAge = () => {
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
                        const newAge = result.value;
                        setUserAge(newAge);
                        storageService.saveUserAge(newAge);
                    }
                });
            }, 1000);
        }
    };

    // Hàm gửi tin nhắn
    const sendMessage = async (messageContent, conversationId = null) => {
        // Kiểm tra nếu không có tuổi
        if (!userAge) {
            await promptUserForAge();
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

        // Kiểm tra xem đây có phải là cuộc trò chuyện mới không (không có tin nhắn nào)
        const isNewConversation = activeConversation &&
            activeConversation.id &&
            (!activeConversation.messages || activeConversation.messages.length === 0);

        // Nếu là cuộc trò chuyện mới, cập nhật tiêu đề ngay lập tức ở frontend
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

            // Gửi request đến backend để cập nhật tiêu đề trong database
            try {
                await chatService.updateConversation(activeConversation.id, { title: newTitle });
            } catch (error) {
                console.error("Lỗi khi cập nhật tiêu đề cuộc hội thoại:", error);
            }
        }

        // Cập nhật state để hiển thị tin nhắn người dùng ngay lập tức
        if (activeConversation) {
            setActiveConversation(prev => {
                // Tạo bản sao của cuộc hội thoại hiện tại
                const updatedConversation = { ...prev };

                // Khởi tạo mảng messages nếu chưa có
                if (!updatedConversation.messages) {
                    updatedConversation.messages = [];
                }

                // Thêm tin nhắn mới
                updatedConversation.messages = [...updatedConversation.messages, userMessage];

                return updatedConversation;
            });
        } else {
            // Nếu chưa có cuộc hội thoại nào, tạo cuộc hội thoại mới tạm thời
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
            const response = await chatService.sendMessage(messageContent, userAge, conversationId || activeConversation?.id);

            if (response.success) {
                // Nếu có conversation_id mới được tạo, cập nhật state
                if (response.conversation_id && (!activeConversation?.id || conversationId !== activeConversation?.id)) {
                    // Tìm nạp chi tiết cuộc hội thoại mới
                    await fetchConversationDetail(response.conversation_id);
                    // Làm mới danh sách cuộc hội thoại
                    await fetchConversations();
                    // Tự động chuyển hướng đến cuộc hội thoại mới
                    navigate(`/chat/${response.conversation_id}`);
                } else if (activeConversation && activeConversation.id) {
                    // Nếu đang trong cuộc hội thoại hiện có, làm mới nó
                    await fetchConversationDetail(activeConversation.id);
                } else {
                    // Nếu không có conversation_id từ API (trường hợp người dùng không đăng nhập)
                    // Tạo tin nhắn bot để hiển thị ngay
                    const botMessage = {
                        id: generateTempId(),
                        role: 'bot',
                        content: response.reply,
                        timestamp: new Date().toISOString(),
                        sources: response.sources || []
                    };

                    // Cập nhật giao diện với tin nhắn bot
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

            return { success: false, error: error.message || 'Lỗi khi gửi tin nhắn' };
        } finally {
            setIsLoading(false);
        }
    };

    // Tạo cuộc hội thoại mới
    const startNewConversation = async () => {
        const user = storageService.getUserData();

        if (!user || !user.id) {
            navigate('/login');
            return { success: false, error: 'Bạn cần đăng nhập để tạo cuộc hội thoại mới' };
        }

        try {
            // Tạo cuộc hội thoại mới với tiêu đề mặc định và userAge hiện tại
            const response = await chatService.createConversation('Cuộc trò chuyện mới', userAge);

            if (response.success) {
                // Làm mới danh sách cuộc hội thoại
                await fetchConversations();

                // Mở cuộc hội thoại mới
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
            return { success: false, error: error.message || 'Không thể tạo cuộc hội thoại mới' };
        }
    };

    // Xóa cuộc hội thoại
    const deleteConversation = async (conversationId) => {
        const result = await Swal.fire({
            title: 'Xóa cuộc trò chuyện?',
            text: 'Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#36B37E',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const response = await chatService.deleteConversation(conversationId);

                if (response.success) {
                    // Xóa khỏi state
                    const updatedConversations = conversations.filter(c => c.id !== conversationId);
                    setConversations(updatedConversations);

                    // Nếu đang xem cuộc hội thoại bị xóa, chuyển sang cuộc hội thoại khác
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
        }

        return { success: false, cancelled: true };
    };

    // Đổi tên cuộc hội thoại
    const renameConversation = async (conversationId, currentTitle) => {
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
            try {
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

                    return { success: true };
                }

                throw new Error(response.error || 'Không thể đổi tên cuộc hội thoại');
            } catch (error) {
                console.error("Lỗi khi đổi tên cuộc hội thoại:", error);
                return { success: false, error: error.message || 'Không thể đổi tên cuộc hội thoại' };
            }
        }

        return { success: false, cancelled: true };
    };

    // Cập nhật tuổi người dùng
    const updateUserAge = async (age, conversationId = null) => {
        setUserAge(age);
        storageService.saveUserAge(age);

        // Nếu đang trong cuộc hội thoại, cập nhật age_context
        if (conversationId && activeConversation) {
            try {
                await chatService.updateConversation(conversationId, { age_context: age });

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
            } catch (error) {
                console.error("Lỗi khi cập nhật tuổi cho cuộc hội thoại:", error);
            }
        }
    };

    // Giá trị cho context
    const value = {
        activeConversation,
        conversations,
        isLoading,
        isLoadingConversations,
        userAge,
        setActiveConversation,
        fetchConversations,
        fetchConversationDetail,
        sendMessage,
        startNewConversation,
        deleteConversation,
        renameConversation,
        updateUserAge,
        promptUserForAge
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}; 