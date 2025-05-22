import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { groupConversationsByTime } from '../utils/dateUtils';
import chatService from '../services/chatService';
import useChat from './useChat';

/**
 * Hook quản lý các thao tác với danh sách cuộc hội thoại
 * @returns {Object} Các hàm và state quản lý danh sách cuộc hội thoại
 */
const useConversation = () => {
    const { fetchConversations: fetchConversationsFromContext } = useChat();
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [ageFilter, setAgeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // 'date' hoặc 'age'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' hoặc 'desc'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'archived'
    const navigate = useNavigate();

    /**
     * Lọc danh sách cuộc hội thoại
     * @param {Array} conversations - Danh sách cuộc hội thoại
     * @returns {Array} Danh sách đã lọc
     */
    const filterConversations = useCallback((conversations) => {
        if (!conversations || conversations.length === 0) return [];

        // Bước 1: Lọc theo tab active (tất cả hoặc lưu trữ)
        let filteredData = conversations.filter((chat) => {
            if (activeTab === 'all') return !chat.is_archived;
            if (activeTab === 'archived') return chat.is_archived;
            return true;
        });

        // Bước 2: Lọc theo tìm kiếm
        if (searchTerm) {
            filteredData = filteredData.filter((chat) => {
                return chat.title.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Bước 3: Lọc theo ngày
        if (dateFilter !== 'all') {
            const today = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    filteredData = filteredData.filter(chat => new Date(chat.updated_at) >= filterDate);
                    break;
                case 'week':
                    filterDate.setDate(today.getDate() - 7);
                    filteredData = filteredData.filter(chat => new Date(chat.updated_at) >= filterDate);
                    break;
                case 'month':
                    filterDate.setMonth(today.getMonth() - 1);
                    filteredData = filteredData.filter(chat => new Date(chat.updated_at) >= filterDate);
                    break;
                default:
                    break;
            }
        }

        // Bước 4: Lọc theo tuổi
        if (ageFilter !== 'all') {
            const ageValue = parseInt(ageFilter, 10);
            if (!isNaN(ageValue)) {
                filteredData = filteredData.filter(chat => chat.age_context === ageValue);
            }
        }

        // Bước 5: Sắp xếp
        const sortedData = [...filteredData].sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.updated_at);
                const dateB = new Date(b.updated_at);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy === 'age') {
                const ageA = a.age_context || 0;
                const ageB = b.age_context || 0;
                return sortOrder === 'asc' ? ageA - ageB : ageB - ageA;
            }
            return 0;
        });

        return sortedData;
    }, [searchTerm, dateFilter, ageFilter, sortBy, sortOrder, activeTab]);

    /**
     * Nhóm các cuộc hội thoại theo thời gian
     * @param {Array} conversations - Danh sách cuộc hội thoại
     * @returns {Object} Các nhóm cuộc hội thoại
     */
    const getGroupedConversations = useCallback((conversations) => {
        return groupConversationsByTime(conversations);
    }, []);

    /**
     * Tính toán dữ liệu phân trang
     * @param {Array} filteredConversations - Danh sách cuộc hội thoại đã lọc
     * @returns {Object} Thông tin phân trang
     */
    const getPaginationData = useCallback((filteredConversations) => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredConversations.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);

        return {
            currentItems,
            totalPages,
            indexOfFirstItem,
            indexOfLastItem: Math.min(indexOfLastItem, filteredConversations.length)
        };
    }, [currentPage, itemsPerPage]);

    /**
     * Lấy danh sách tuổi từ các cuộc hội thoại
     * @param {Array} conversations - Danh sách cuộc hội thoại
     * @returns {Array} Danh sách tuổi
     */
    const getAgeOptions = useCallback((conversations) => {
        if (!conversations || conversations.length === 0) return [];
        const ages = [...new Set(conversations.map(chat => chat.age_context).filter(Boolean))];
        return ages.sort((a, b) => a - b);
    }, []);

    /**
     * Xử lý chọn/bỏ chọn tất cả
     * @param {Event} e - Event
     * @param {Array} currentItems - Danh sách hiện tại
     */
    const handleSelectAll = useCallback((e, currentItems) => {
        if (e.target.checked) {
            const allIds = currentItems.map(item => item.id);
            setSelectedConversations(allIds);
        } else {
            setSelectedConversations([]);
        }
    }, []);

    /**
     * Xử lý chọn/bỏ chọn một cuộc hội thoại
     * @param {string} id - ID cuộc hội thoại
     */
    const handleSelect = useCallback((id) => {
        setSelectedConversations(prev => {
            if (prev.includes(id)) {
                return prev.filter(chatId => chatId !== id);
            } else {
                return [...prev, id];
            }
        });
    }, []);

    /**
     * Xử lý thay đổi sắp xếp
     * @param {string} newSortBy - Tiêu chí sắp xếp mới
     */
    const handleSortChange = useCallback((newSortBy) => {
        if (sortBy === newSortBy) {
            // Nếu đang sắp xếp theo cùng một cột, đảo ngược thứ tự
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Nếu chuyển sang cột khác, đặt lại thứ tự là desc (mới nhất trước)
            setSortBy(newSortBy);
            setSortOrder('desc');
        }
    }, [sortBy, sortOrder]);

    /**
     * Xóa các bộ lọc
     */
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setDateFilter('all');
        setAgeFilter('all');
    }, []);

    /**
     * Xóa nhiều cuộc hội thoại
     * @returns {Promise<Object>} Kết quả xóa
     */
    const handleDeleteMultiple = useCallback(async () => {
        if (selectedConversations.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Chưa chọn cuộc trò chuyện',
                text: 'Vui lòng chọn ít nhất một cuộc trò chuyện để xóa',
                confirmButtonColor: '#36B37E'
            });
            return { success: false };
        }

        try {
            const response = await chatService.bulkDeleteConversations(selectedConversations);

            if (response.success) {
                // Làm mới danh sách
                await fetchConversationsFromContext();
                setSelectedConversations([]);

                // Hiển thị thông báo thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa',
                    text: `Đã xóa ${response.deleted_count} cuộc trò chuyện thành công`,
                    confirmButtonColor: '#36B37E',
                    timer: 1500,
                    showConfirmButton: false
                });

                return { success: true };
            }

            throw new Error(response.error || 'Không thể xóa các cuộc hội thoại');
        } catch (error) {
            console.error("Lỗi khi xóa nhiều cuộc hội thoại:", error);

            // Hiển thị thông báo lỗi
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể xóa các cuộc trò chuyện',
                confirmButtonColor: '#36B37E'
            });

            return { success: false, error: error.message || 'Không thể xóa các cuộc hội thoại' };
        }
    }, [selectedConversations, fetchConversationsFromContext]);

    /**
     * Lưu trữ nhiều cuộc hội thoại
     * @returns {Promise<Object>} Kết quả lưu trữ
     */
    const handleArchiveMultiple = useCallback(async () => {
        if (selectedConversations.length === 0) {
            return { success: false, error: 'Chưa chọn cuộc trò chuyện' };
        }

        try {
            // Lưu trữ tất cả các cuộc hội thoại đã chọn
            const promises = selectedConversations.map(id =>
                chatService.archiveConversation(id)
            );

            await Promise.all(promises);

            // Làm mới danh sách
            await fetchConversationsFromContext();
            setSelectedConversations([]);

            // Hiển thị thông báo thành công
            Swal.fire({
                icon: 'success',
                title: 'Đã lưu trữ',
                text: `Đã lưu trữ ${selectedConversations.length} cuộc trò chuyện`,
                confirmButtonColor: '#36B37E',
                timer: 1500,
                showConfirmButton: false
            });

            return { success: true };
        } catch (error) {
            console.error("Lỗi khi lưu trữ nhiều cuộc hội thoại:", error);

            // Hiển thị thông báo lỗi
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể lưu trữ các cuộc trò chuyện',
                confirmButtonColor: '#36B37E'
            });

            return { success: false, error: error.message || 'Không thể lưu trữ các cuộc hội thoại' };
        }
    }, [selectedConversations, fetchConversationsFromContext]);

    /**
     * Hủy lưu trữ nhiều cuộc hội thoại
     * @returns {Promise<Object>} Kết quả hủy lưu trữ
     */
    const handleUnarchiveMultiple = useCallback(async () => {
        if (selectedConversations.length === 0) {
            return { success: false, error: 'Chưa chọn cuộc trò chuyện' };
        }

        try {
            // Hủy lưu trữ tất cả các cuộc hội thoại đã chọn
            const promises = selectedConversations.map(id =>
                chatService.unarchiveConversation(id)
            );

            await Promise.all(promises);

            // Làm mới danh sách
            await fetchConversationsFromContext();
            setSelectedConversations([]);

            // Hiển thị thông báo thành công
            Swal.fire({
                icon: 'success',
                title: 'Đã khôi phục',
                text: `Đã khôi phục ${selectedConversations.length} cuộc trò chuyện`,
                confirmButtonColor: '#36B37E',
                timer: 1500,
                showConfirmButton: false
            });

            return { success: true };
        } catch (error) {
            console.error("Lỗi khi khôi phục nhiều cuộc hội thoại:", error);

            // Hiển thị thông báo lỗi
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể khôi phục các cuộc trò chuyện',
                confirmButtonColor: '#36B37E'
            });

            return { success: false, error: error.message || 'Không thể khôi phục các cuộc hội thoại' };
        }
    }, [selectedConversations, fetchConversationsFromContext]);

    /**
     * Chuyển đến trang chat với conversation ID cụ thể
     * @param {string} conversationId - ID cuộc hội thoại
     */
    const navigateToChat = useCallback((conversationId) => {
        navigate(`/chat/${conversationId}`);
    }, [navigate]);

    /**
     * Đếm số lượng cuộc trò chuyện đã lưu trữ và chưa lưu trữ
     * @param {Array} conversations - Danh sách cuộc hội thoại
     * @returns {Object} Số lượng
     */
    const getConversationCounts = useCallback((conversations) => {
        const archivedCount = conversations.filter(chat => chat.is_archived).length;
        const activeCount = conversations.filter(chat => !chat.is_archived).length;

        return {
            archivedCount,
            activeCount,
            totalCount: conversations.length
        };
    }, []);

    return {
        // State
        selectedConversations,
        searchTerm,
        dateFilter,
        ageFilter,
        sortBy,
        sortOrder,
        currentPage,
        itemsPerPage,
        activeTab,

        // Setters
        setSelectedConversations,
        setSearchTerm,
        setDateFilter,
        setAgeFilter,
        setSortBy,
        setSortOrder,
        setCurrentPage,
        setItemsPerPage,
        setActiveTab,

        // Methods
        filterConversations,
        getGroupedConversations,
        getPaginationData,
        getAgeOptions,
        handleSelectAll,
        handleSelect,
        handleSortChange,
        clearFilters,
        handleDeleteMultiple,
        handleArchiveMultiple,
        handleUnarchiveMultiple,
        navigateToChat,
        getConversationCounts
    };
};

export default useConversation;