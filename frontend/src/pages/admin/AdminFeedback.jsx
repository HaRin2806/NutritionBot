import React, { useState, useEffect } from 'react';
import {
    BiStar, BiMessageSquareDetail, BiUser, BiCalendar, BiTrendingUp,
    BiSearch, BiFilter, BiRefresh, BiShow, BiReply, BiCheck,
    BiTime, BiBarChart, BiPieChart
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/index';

const FeedbackCard = ({ feedback, onView, onRespond, currentTheme, darkMode }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
            case 'reviewed':
                return darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800';
            case 'resolved':
                return darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'reviewed': return 'Đã xem';
            case 'resolved': return 'Đã giải quyết';
            default: return 'Không rõ';
        }
    };

    const getCategoryText = (category) => {
        const categories = {
            'bug_report': 'Báo lỗi',
            'feature_request': 'Đề xuất tính năng',
            'content_feedback': 'Phản hồi nội dung',
            'user_experience': 'Trải nghiệm người dùng',
            'other': 'Khác'
        };
        return categories[category] || category;
    };

    return (
        <div
            className="rounded-lg border p-4 transition-all duration-200 hover:shadow-md"
            style={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                borderColor: darkMode ? '#374151' : '#e5e7eb'
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <BiStar
                                    key={star}
                                    className={`w-4 h-4 ${star <= feedback.rating 
                                        ? 'text-yellow-400' 
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                        <span 
                            className="ml-2 text-sm font-medium"
                            style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                        >
                            {feedback.rating}/5 sao
                        </span>
                    </div>
                    
                    {feedback.title && (
                        <h3 
                            className="font-medium mb-1 line-clamp-1"
                            style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                        >
                            {feedback.title}
                        </h3>
                    )}
                    
                    <p 
                        className="text-sm mb-2 line-clamp-2"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                        {feedback.content}
                    </p>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(feedback.status)}`}>
                        {getStatusText(feedback.status)}
                    </span>
                    
                    <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{
                            backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                            color: darkMode ? '#d1d5db' : '#6b7280'
                        }}
                    >
                        {getCategoryText(feedback.category)}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                    <div className="flex items-center">
                        <BiUser className="w-3 h-3 mr-1" />
                        <span>{feedback.user_name || 'Ẩn danh'}</span>
                    </div>
                    <div className="flex items-center">
                        <BiCalendar className="w-3 h-3 mr-1" />
                        <span>{new Date(feedback.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onView(feedback)}
                        className="p-1 rounded transition-colors"
                        style={{ color: currentTheme?.primary }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = darkMode 
                                ? currentTheme?.primary + '20' 
                                : currentTheme?.light + '80';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Xem chi tiết"
                    >
                        <BiShow className="w-4 h-4" />
                    </button>
                    
                    {feedback.status === 'pending' && (
                        <button
                            onClick={() => onRespond(feedback)}
                            className="p-1 rounded transition-colors"
                            style={{ color: '#10b981' }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = darkMode ? '#10b98120' : '#f0fdf4';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                            }}
                            title="Phản hồi"
                        >
                            <BiReply className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {feedback.admin_response && (
                <div 
                    className="mt-3 p-3 rounded-lg border-l-4"
                    style={{
                        backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                        borderLeftColor: currentTheme?.primary
                    }}
                >
                    <p 
                        className="text-xs font-medium mb-1"
                        style={{ color: currentTheme?.primary }}
                    >
                        Phản hồi từ admin:
                    </p>
                    <p 
                        className="text-sm"
                        style={{ color: darkMode ? '#d1d5db' : '#4b5563' }}
                    >
                        {feedback.admin_response}
                    </p>
                </div>
            )}
        </div>
    );
};

const FeedbackDetailModal = ({ feedback, isOpen, onClose, onRespond, currentTheme, darkMode }) => {
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('reviewed');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (feedback) {
            setResponse('');
            setStatus(feedback.status === 'pending' ? 'reviewed' : feedback.status);
        }
    }, [feedback]);

    const handleSubmitResponse = async () => {
        if (!response.trim()) {
            alert('Vui lòng nhập phản hồi');
            return;
        }

        setIsSubmitting(true);
        try {
            await onRespond(feedback.id, response.trim(), status);
            setResponse('');
            onClose();
        } catch (error) {
            console.error('Error submitting response:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryText = (category) => {
        const categories = {
            'bug_report': 'Báo lỗi',
            'feature_request': 'Đề xuất tính năng', 
            'content_feedback': 'Phản hồi nội dung',
            'user_experience': 'Trải nghiệm người dùng',
            'other': 'Khác'
        };
        return categories[category] || category;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center">
                    <BiMessageSquareDetail className="w-5 h-5 mr-2" style={{ color: currentTheme?.primary }} />
                    <span>Chi tiết phản hồi</span>
                </div>
            }
            size="lg"
        >
            {feedback && (
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                Người gửi
                            </label>
                            <p style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                {feedback.user_name || 'Ẩn danh'}
                            </p>
                            {feedback.user_email && (
                                <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                    {feedback.user_email}
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                Ngày gửi
                            </label>
                            <p style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                {new Date(feedback.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                Đánh giá
                            </label>
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <BiStar
                                        key={star}
                                        className={`w-5 h-5 ${star <= feedback.rating 
                                            ? 'text-yellow-400' 
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                    />
                                ))}
                                <span className="ml-2" style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                    {feedback.rating}/5 sao
                                </span>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                Danh mục
                            </label>
                            <p style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                {getCategoryText(feedback.category)}
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    {feedback.title && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                Tiêu đề
                            </label>
                            <h3 className="text-lg font-medium" style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                {feedback.title}
                            </h3>
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                            Nội dung phản hồi
                        </label>
                        <div 
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#374151' : '#f9fafb',
                                borderColor: darkMode ? '#4b5563' : '#e5e7eb',
                                color: darkMode ? '#f3f4f6' : '#111827'
                            }}
                        >
                            {feedback.content}
                        </div>
                    </div>

                    {/* Existing Admin Response */}
                    {feedback.admin_response && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                Phản hồi hiện tại
                            </label>
                            <div 
                                className="p-4 rounded-lg border-l-4"
                                style={{
                                    backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                                    borderLeftColor: currentTheme?.primary,
                                    color: darkMode ? '#d1d5db' : '#4b5563'
                                }}
                            >
                                {feedback.admin_response}
                            </div>
                        </div>
                    )}

                    {/* Response Form */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                            {feedback.admin_response ? 'Cập nhật phản hồi' : 'Phản hồi'}
                        </label>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: darkMode ? '#e5e7eb' : '#374151' }}>
                                    Trạng thái
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                                    style={{
                                        backgroundColor: darkMode ? '#374151' : '#ffffff',
                                        borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                        color: darkMode ? '#f3f4f6' : '#111827',
                                        '--tw-ring-color': currentTheme?.primary + '40'
                                    }}
                                >
                                    <option value="reviewed">Đã xem</option>
                                    <option value="resolved">Đã giải quyết</option>
                                </select>
                            </div>
                            
                            <div>
                                <textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Nhập phản hồi của bạn..."
                                    rows={4}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                                    style={{
                                        backgroundColor: darkMode ? '#374151' : '#ffffff',
                                        borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                        color: darkMode ? '#f3f4f6' : '#111827',
                                        '--tw-ring-color': currentTheme?.primary + '40'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: darkMode ? '#4b5563' : '#e5e7eb' }}>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg transition-all font-medium"
                            style={{
                                backgroundColor: darkMode ? '#4b5563' : '#f3f4f6',
                                color: darkMode ? '#d1d5db' : '#374151'
                            }}
                        >
                            Đóng
                        </button>
                        
                        <button
                            onClick={handleSubmitResponse}
                            disabled={!response.trim() || isSubmitting}
                            className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: (!response.trim() || isSubmitting) ? '#9ca3af' : currentTheme?.primary
                            }}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Đang gửi...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <BiReply className="w-4 h-4 mr-2" />
                                    {feedback.admin_response ? 'Cập nhật' : 'Gửi phản hồi'}
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const AdminFeedback = () => {
    const { showSuccess, showError } = useApp();
    const { darkMode, currentThemeConfig } = useTheme();

    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        rating: 'all',
        category: 'all'
    });
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const loadFeedbacks = async () => {
        try {
            setIsLoading(true);
            const [feedbacksRes, statsRes] = await Promise.all([
                adminService.getAllFeedback(),
                adminService.getFeedbackStats()
            ]);

            if (feedbacksRes.success) {
                setFeedbacks(feedbacksRes.feedbacks);
            }

            if (statsRes.success) {
                setStats(statsRes.stats);
            }
        } catch (error) {
            console.error('Error loading feedbacks:', error);
            showError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const handleViewFeedback = (feedback) => {
        setSelectedFeedback(feedback);
        setShowDetailModal(true);
    };

    const handleRespondToFeedback = async (feedbackId, response, status) => {
        try {
            const result = await adminService.respondToFeedback(feedbackId, response, status);
            if (result.success) {
                showSuccess('Đã phản hồi thành công');
                loadFeedbacks(); // Reload data
            } else {
                showError(result.error || 'Không thể gửi phản hồi');
            }
        } catch (error) {
            console.error('Error responding to feedback:', error);
            showError('Có lỗi xảy ra khi gửi phản hồi');
        }
    };

    const filteredFeedbacks = feedbacks.filter(feedback => {
        const matchesSearch = !filters.search ||
            feedback.content.toLowerCase().includes(filters.search.toLowerCase()) ||
            feedback.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            feedback.user_name?.toLowerCase().includes(filters.search.toLowerCase());

        const matchesStatus = filters.status === 'all' || feedback.status === filters.status;
        const matchesRating = filters.rating === 'all' || feedback.rating.toString() === filters.rating;
        const matchesCategory = filters.category === 'all' || feedback.category === filters.category;

        return matchesSearch && matchesStatus && matchesRating && matchesCategory;
    });

    const categories = [
        { value: 'bug_report', label: 'Báo lỗi' },
        { value: 'feature_request', label: 'Đề xuất tính năng' },
        { value: 'content_feedback', label: 'Phản hồi nội dung' },
        { value: 'user_experience', label: 'Trải nghiệm người dùng' },
        { value: 'other', label: 'Khác' }
    ];

    return (
        <div
            className="min-h-screen transition-all duration-300"
            style={{
                background: darkMode
                    ? 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                    : `linear-gradient(135deg, ${currentThemeConfig?.light}20 0%, #ffffff 50%, #f8fafc 100%)`
            }}
        >
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 
                                className="text-2xl font-bold"
                                style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                            >
                                Quản lý đóng góp ý kiến
                            </h1>
                            <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                Xem và phản hồi ý kiến từ người dùng
                            </p>
                        </div>

                        <button
                            onClick={loadFeedbacks}
                            disabled={isLoading}
                            className={`flex items-center px-4 py-2 border rounded-lg transition-colors shadow-sm ${
                                darkMode 
                                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div 
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <div className="flex items-center">
                                <BiMessageSquareDetail className="w-8 h-8" style={{ color: currentThemeConfig?.primary }} />
                                <div className="ml-3">
                                    <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                        Tổng phản hồi
                                    </p>
                                    <p className="text-xl font-bold" style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                        {stats.total_feedback || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div 
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <div className="flex items-center">
                                <BiTime className="w-8 h-8" style={{ color: '#f59e0b' }} />
                                <div className="ml-3">
                                    <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                        Chờ xử lý
                                    </p>
                                    <p className="text-xl font-bold" style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                        {stats.pending_feedback || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div 
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <div className="flex items-center">
                                <BiStar className="w-8 h-8" style={{ color: '#f59e0b' }} />
                                <div className="ml-3">
                                    <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                        Đánh giá TB
                                    </p>
                                    <p className="text-xl font-bold" style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                        {stats.average_rating ? `${stats.average_rating.toFixed(1)}/5` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div 
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <div className="flex items-center">
                                <BiTrendingUp className="w-8 h-8" style={{ color: '#10b981' }} />
                                <div className="ml-3">
                                    <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                        Tháng này
                                    </p>
                                    <p className="text-xl font-bold" style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                                        {stats.this_month_feedback || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div 
                    className="rounded-lg border p-4 mb-6"
                    style={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        borderColor: darkMode ? '#374151' : '#e5e7eb'
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Input
                                placeholder="Tìm kiếm phản hồi..."
                                icon={<BiSearch />}
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>

                        <div>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    '--tw-ring-color': currentThemeConfig?.primary + '40'
                                }}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Chờ xử lý</option>
                                <option value="reviewed">Đã xem</option>
                                <option value="resolved">Đã giải quyết</option>
                            </select>
                        </div>

                        <div>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                                value={filters.rating}
                                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    '--tw-ring-color': currentThemeConfig?.primary + '40'
                                }}
                            >
                                <option value="all">Tất cả đánh giá</option>
                                <option value="5">5 sao</option>
                                <option value="4">4 sao</option>
                                <option value="3">3 sao</option>
                                <option value="2">2 sao</option>
                                <option value="1">1 sao</option>
                            </select>
                        </div>

                        <div>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    '--tw-ring-color': currentThemeConfig?.primary + '40'
                                }}
                            >
                                <option value="all">Tất cả danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader type="spinner" text="Đang tải danh sách phản hồi..." />
                    </div>
                ) : filteredFeedbacks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFeedbacks.map(feedback => (
                            <FeedbackCard
                                key={feedback.id}
                                feedback={feedback}
                                onView={handleViewFeedback}
                                onRespond={(feedback) => {
                                    setSelectedFeedback(feedback);
                                    setShowDetailModal(true);
                                }}
                                currentTheme={currentThemeConfig}
                                darkMode={darkMode}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BiMessageSquareDetail 
                            className="w-16 h-16 mx-auto mb-4"
                            style={{ color: darkMode ? '#6b7280' : '#d1d5db' }}
                        />
                        <h3 
                            className="text-lg font-medium mb-2"
                            style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                        >
                            Không có phản hồi nào
                        </h3>
                        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                            {Object.values(filters).some(f => f !== 'all' && f !== '')
                                ? 'Không tìm thấy phản hồi phù hợp với bộ lọc'
                                : 'Chưa có phản hồi nào từ người dùng'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <FeedbackDetailModal
                feedback={selectedFeedback}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedFeedback(null);
                }}
                onRespond={handleRespondToFeedback}
                currentTheme={currentThemeConfig}
                darkMode={darkMode}
            />
        </div>
    );
};

export default AdminFeedback;