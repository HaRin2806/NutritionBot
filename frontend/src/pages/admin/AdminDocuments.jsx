import React, { useState, useEffect } from 'react';
import {
    BiFile, BiUpload, BiTrash, BiRefresh,
    BiSearch, BiShow, BiLoader, BiX
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/index';

const DocumentCard = ({ document, onView, onDelete, isSelected, onSelect, currentTheme, darkMode }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'processed':
                return darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800';
            case 'uploaded':
                return darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800';
            case 'processing':
                return darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'lesson': return '📚';
            case 'appendix': return '📋';
            default: return '📄';
        }
    };

    return (
        <div
            className={`rounded-lg border-2 p-4 transition-all duration-200 ${isSelected
                    ? 'shadow-lg transform scale-[1.02]'
                    : 'hover:shadow-md'
                }`}
            style={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                borderColor: isSelected ? currentTheme?.primary : (darkMode ? '#374151' : '#e5e7eb'),
                ...(isSelected && {
                    backgroundColor: darkMode
                        ? currentTheme?.primary + '10'
                        : currentTheme?.light + '40',
                })
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(document.id)}
                        className="mt-1 mr-3 rounded focus:ring-2"
                        style={{
                            accentColor: currentTheme?.primary,
                            '--tw-ring-color': currentTheme?.primary + '40'
                        }}
                    />
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">{getTypeIcon(document.type)}</span>
                            <h3
                                className="font-medium line-clamp-2"
                                style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                            >
                                {document.title}
                            </h3>
                        </div>
                        {document.description && (
                            <p
                                className="text-sm mb-2 line-clamp-2"
                                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                                {document.description}
                            </p>
                        )}
                        <div
                            className="flex items-center space-x-2 text-xs"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                                Đã xử lý
                            </span>
                            <span>•</span>
                            <span>
                                {document.type === 'lesson' ? 'Bài học' :
                                    document.type === 'appendix' ? 'Phụ lục' : 'Tài liệu'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {document.content_stats && (
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div
                        className="text-center p-2 rounded"
                        style={{
                            backgroundColor: darkMode ? '#1e3a8a20' : '#dbeafe',
                            color: darkMode ? '#60a5fa' : '#1e40af'
                        }}
                    >
                        <p className="font-medium">{document.content_stats.chunks || 0}</p>
                        <p>Text</p>
                    </div>
                    <div
                        className="text-center p-2 rounded"
                        style={{
                            backgroundColor: darkMode ? '#166534b20' : '#dcfce7',
                            color: darkMode ? '#4ade80' : '#166534'
                        }}
                    >
                        <p className="font-medium">{document.content_stats.tables || 0}</p>
                        <p>Bảng</p>
                    </div>
                    <div
                        className="text-center p-2 rounded"
                        style={{
                            backgroundColor: darkMode ? '#7c2d9220' : '#faf5ff',
                            color: darkMode ? '#c084fc' : '#7c2d92'
                        }}
                    >
                        <p className="font-medium">{document.content_stats.figures || 0}</p>
                        <p>Hình</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div
                    className="text-xs"
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                    {document.created_at && new Date(document.created_at).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onView(document)}
                        className="p-1 rounded transition-colors"
                        style={{
                            color: currentTheme?.primary,
                            backgroundColor: 'transparent'
                        }}
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

                    <button
                        onClick={() => onDelete(document)}
                        className="p-1 rounded transition-colors"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = darkMode ? '#ef444420' : '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Xóa"
                    >
                        <BiTrash className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDocuments = () => {
    const { showSuccess, showError, showConfirm } = useApp();
    const { theme, darkMode, currentThemeConfig } = useTheme();

    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        search: '',
        type: 'all'
    });
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const response = await adminService.getAllDocuments();

            if (response.success) {
                setDocuments(response.documents);
                setStats(response.stats);
                console.log('Loaded documents:', response.documents);
                console.log('Stats:', response.stats);
            } else {
                showError('Không thể tải danh sách tài liệu');
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            showError('Có lỗi xảy ra khi tải danh sách tài liệu');
        } finally {
            setIsLoading(false);
        }
    };

    // Debug function
    const debugMetadata = async () => {
        try {
            const response = await adminService.debugMetadata();
            console.log('Debug metadata:', response);
        } catch (error) {
            console.error('Debug error:', error);
        }
    };

    useEffect(() => {
        loadDocuments();
        // Uncomment để debug metadata
        debugMetadata();
    }, []);

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = !filters.search ||
            doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            doc.description?.toLowerCase().includes(filters.search.toLowerCase());

        const matchesType = filters.type === 'all' || doc.type === filters.type;

        return matchesSearch && matchesType;
    });

    const handleDeleteDocument = async (document) => {
        const result = await showConfirm({
            title: 'Xóa tài liệu?',
            text: `Bạn có chắc muốn xóa tài liệu "${document.title}"? Hành động này sẽ xóa tất cả chunks liên quan.`,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const response = await adminService.deleteDocument(document.id);
                if (response.success) {
                    showSuccess('Đã xóa tài liệu thành công');
                    loadDocuments();
                } else {
                    showError(response.error || 'Không thể xóa tài liệu');
                }
            } catch (error) {
                showError('Có lỗi xảy ra khi xóa tài liệu');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDocuments.length === 0) {
            showError('Vui lòng chọn ít nhất một tài liệu');
            return;
        }

        const result = await showConfirm({
            title: `Xóa ${selectedDocuments.length} tài liệu?`,
            text: 'Hành động này sẽ xóa tất cả chunks liên quan và không thể hoàn tác.',
            confirmButtonText: 'Xóa tất cả',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const response = await adminService.bulkDeleteDocuments(selectedDocuments);
                if (response.success) {
                    showSuccess(`Đã xóa ${response.deleted_count} tài liệu`);
                    setSelectedDocuments([]);
                    loadDocuments();
                } else {
                    showError('Không thể xóa tài liệu đã chọn');
                }
            } catch (error) {
                showError('Có lỗi xảy ra khi xóa tài liệu');
            }
        }
    };

    const handleViewDocument = (document) => {
        setSelectedDocument(document);
        setShowDetailModal(true);
    };

    const handleSelectDocument = (docId) => {
        setSelectedDocuments(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDocuments.length === filteredDocuments.length) {
            setSelectedDocuments([]);
        } else {
            setSelectedDocuments(filteredDocuments.map(doc => doc.id));
        }
    };

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
                                Quản lý tài liệu
                            </h1>
                            <p
                                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                                Quản lý và xử lý tài liệu cho hệ thống RAG
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <Button
                                onClick={() => loadDocuments()}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${currentThemeConfig?.primary}`,
                                    color: currentThemeConfig?.primary
                                }}
                                icon={<BiRefresh />}
                                disabled={isLoading}
                            >
                                Làm mới
                            </Button>

                            <Button
                                onClick={() => console.log('Upload modal')}
                                style={{
                                    backgroundColor: currentThemeConfig?.primary,
                                    color: 'white',
                                    border: 'none'
                                }}
                                icon={<BiUpload />}
                            >
                                Upload tài liệu
                            </Button>
                        </div>
                    </div>

                    {/* Stats - Bỏ Total Chunks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <div className="flex items-center">
                                <BiFile
                                    className="w-8 h-8"
                                    style={{ color: currentThemeConfig?.primary }}
                                />
                                <div className="ml-3">
                                    <p
                                        className="text-sm"
                                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                                    >
                                        Tổng tài liệu
                                    </p>
                                    <p
                                        className="text-xl font-bold"
                                        style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                                    >
                                        {stats.total || 0}
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
                                <span className="text-2xl">📚</span>
                                <div className="ml-3">
                                    <p
                                        className="text-sm"
                                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                                    >
                                        Bài học
                                    </p>
                                    <p
                                        className="text-xl font-bold"
                                        style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                                    >
                                        {stats.by_chapter ? Object.keys(stats.by_chapter).filter(k => k.startsWith('bai')).length : 0}
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
                                <span className="text-2xl">📋</span>
                                <div className="ml-3">
                                    <p
                                        className="text-sm"
                                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                                    >
                                        Phụ lục
                                    </p>
                                    <p
                                        className="text-xl font-bold"
                                        style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                                    >
                                        {stats.by_chapter ? Object.keys(stats.by_chapter).filter(k => k.includes('phuluc')).length : 0}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                placeholder="Tìm kiếm tài liệu..."
                                icon={<BiSearch />}
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>

                        <div>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    '--tw-ring-color': currentThemeConfig?.primary + '40'
                                }}
                            >
                                <option value="all">Tất cả loại</option>
                                <option value="lesson">Bài học</option>
                                <option value="appendix">Phụ lục</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedDocuments.length > 0 && (
                    <div
                        className="border rounded-lg p-4 mb-4"
                        style={{
                            backgroundColor: darkMode
                                ? currentThemeConfig?.primary + '10'
                                : currentThemeConfig?.light + '40',
                            borderColor: currentThemeConfig?.primary + '40'
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="font-medium"
                                style={{ color: currentThemeConfig?.dark }}
                            >
                                Đã chọn {selectedDocuments.length} tài liệu
                            </span>
                            <div className="flex space-x-2">
                                <Button
                                    onClick={() => setSelectedDocuments([])}
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: `1px solid ${darkMode ? '#6b7280' : '#d1d5db'}`,
                                        color: darkMode ? '#9ca3af' : '#6b7280'
                                    }}
                                    size="sm"
                                >
                                    Bỏ chọn
                                </Button>
                                <Button
                                    onClick={handleBulkDelete}
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                    size="sm"
                                    icon={<BiTrash />}
                                >
                                    Xóa đã chọn
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader type="spinner" text="Đang tải danh sách tài liệu..." />
                    </div>
                ) : filteredDocuments.length > 0 ? (
                    <>
                        {/* Select All */}
                        <div
                            className="rounded-lg border p-4 mb-4"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded focus:ring-2"
                                    style={{
                                        accentColor: currentThemeConfig?.primary,
                                        '--tw-ring-color': currentThemeConfig?.primary + '40'
                                    }}
                                />
                                <span
                                    className="ml-2 text-sm"
                                    style={{ color: darkMode ? '#d1d5db' : '#374151' }}
                                >
                                    Chọn tất cả ({filteredDocuments.length} tài liệu)
                                </span>
                            </label>
                        </div>

                        {/* Documents Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocuments.map(document => (
                                <DocumentCard
                                    key={document.id}
                                    document={document}
                                    onView={handleViewDocument}
                                    onDelete={handleDeleteDocument}
                                    isSelected={selectedDocuments.includes(document.id)}
                                    onSelect={handleSelectDocument}
                                    currentTheme={currentThemeConfig}
                                    darkMode={darkMode}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <BiFile
                            className="w-16 h-16 mx-auto mb-4"
                            style={{ color: darkMode ? '#6b7280' : '#d1d5db' }}
                        />
                        <h3
                            className="text-lg font-medium mb-2"
                            style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                        >
                            Không có tài liệu nào
                        </h3>
                        <p
                            className="mb-4"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                            {filters.search || filters.type !== 'all'
                                ? 'Không tìm thấy tài liệu phù hợp với bộ lọc'
                                : 'Dữ liệu tài liệu sẽ được tải từ ChromaDB'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDocuments;