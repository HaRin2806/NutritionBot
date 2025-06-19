import React, { useState, useEffect } from 'react';
import {
    BiFile, BiUpload, BiTrash, BiRefresh,
    BiSearch, BiShow, BiLoader, BiX, BiCloudUpload
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

const UploadModal = ({ isOpen, onClose, onUpload, currentTheme, darkMode }) => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            if (!title) {
                setTitle(selectedFile.name.replace('.pdf', ''));
            }
        } else {
            alert('Vui lòng chọn file PDF');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file || !title) {
            alert('Vui lòng chọn file và nhập tiêu đề');
            return;
        }

        setIsUploading(true);
        try {
            const success = await onUpload(file, { title, description, author });
            if (success) {
                setFile(null);
                setTitle('');
                setDescription('');
                setAuthor('');
                onClose();
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            setFile(null);
            setTitle('');
            setDescription('');
            setAuthor('');
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center">
                    <BiUpload
                        className="w-6 h-6 mr-2"
                        style={{ color: currentTheme?.primary }}
                    />
                    <span style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                        Upload tài liệu PDF
                    </span>
                </div>
            }
            size="lg"
            closeOnClickOutside={!isUploading}
            showCloseButton={!isUploading}
        >
            <div className="space-y-6">
                {/* File Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${dragActive
                            ? 'transform scale-105'
                            : 'hover:scale-102'
                        }`}
                    style={{
                        borderColor: dragActive ? currentTheme?.primary : (darkMode ? '#4b5563' : '#d1d5db'),
                        backgroundColor: dragActive
                            ? (darkMode ? currentTheme?.primary + '10' : currentTheme?.light + '20')
                            : (darkMode ? '#374151' : '#f9fafb')
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <BiCloudUpload
                        className="w-16 h-16 mx-auto mb-4"
                        style={{ color: dragActive ? currentTheme?.primary : (darkMode ? '#9ca3af' : '#6b7280') }}
                    />
                    {file ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center">
                                <div
                                    className="w-2 h-2 rounded-full mr-2"
                                    style={{ backgroundColor: '#10b981' }}
                                />
                                <p
                                    className="font-medium text-lg"
                                    style={{ color: '#10b981' }}
                                >
                                    {file.name}
                                </p>
                            </div>
                            <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                Kích thước: {Math.round(file.size / 1024)} KB
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: '#10b981' }}
                            >
                                ✓ Sẵn sàng để upload
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p
                                className="text-lg mb-4"
                                style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                            >
                                {dragActive ? 'Thả file vào đây' : 'Kéo thả file PDF vào đây'}
                            </p>
                            <p
                                className="mb-4"
                                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                                hoặc
                            </p>
                            <label
                                className="inline-block px-6 py-3 rounded-lg cursor-pointer transition-all hover:shadow-lg transform hover:scale-105 font-medium"
                                style={{
                                    backgroundColor: currentTheme?.primary,
                                    color: 'white'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = currentTheme?.dark;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = currentTheme?.primary;
                                }}
                            >
                                Chọn file từ máy tính
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                            <p
                                className="text-sm mt-4"
                                style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}
                            >
                                Chỉ chấp nhận file PDF • Tối đa 50MB
                            </p>
                        </div>
                    )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                        >
                            Tiêu đề tài liệu <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nhập tiêu đề tài liệu"
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                            style={{
                                backgroundColor: darkMode ? '#374151' : '#ffffff',
                                borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                '--tw-ring-color': currentTheme?.primary + '40'
                            }}
                        />
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                        >
                            Mô tả
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn gọn về tài liệu..."
                            rows={3}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                            style={{
                                backgroundColor: darkMode ? '#374151' : '#ffffff',
                                borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                '--tw-ring-color': currentTheme?.primary + '40'
                            }}
                        />
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                        >
                            Tác giả
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Tên tác giả (tùy chọn)"
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                            style={{
                                backgroundColor: darkMode ? '#374151' : '#ffffff',
                                borderColor: darkMode ? '#4b5563' : '#d1d5db',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                '--tw-ring-color': currentTheme?.primary + '40'
                            }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div
                    className="flex justify-end space-x-3 pt-6 border-t"
                    style={{ borderColor: darkMode ? '#4b5563' : '#e5e7eb' }}
                >
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-6 py-3 rounded-lg transition-all hover:shadow-md font-medium"
                        style={{
                            backgroundColor: darkMode ? '#4b5563' : '#f3f4f6',
                            color: darkMode ? '#d1d5db' : '#374151'
                        }}
                        onMouseEnter={(e) => {
                            if (!isUploading) {
                                e.target.style.backgroundColor = darkMode ? '#374151' : '#e5e7eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = darkMode ? '#4b5563' : '#f3f4f6';
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || !title || isUploading}
                        className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        style={{
                            backgroundColor: (!file || !title || isUploading) ? '#9ca3af' : currentTheme?.primary
                        }}
                        onMouseEnter={(e) => {
                            if (!(!file || !title || isUploading)) {
                                e.target.style.backgroundColor = currentTheme?.dark;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!(!file || !title || isUploading)) {
                                e.target.style.backgroundColor = currentTheme?.primary;
                            }
                        }}
                    >
                        {isUploading ? (
                            <div className="flex items-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Đang xử lý...
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <BiUpload className="w-5 h-5 mr-2" />
                                Upload & Xử lý
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const DetailModal = ({ isOpen, onClose, document, currentTheme, darkMode }) => {
    const [documentDetail, setDocumentDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('text');
    const [selectedChunk, setSelectedChunk] = useState(null);

    useEffect(() => {
        if (isOpen && document) {
            loadDocumentDetail();
        }
    }, [isOpen, document]);

    const loadDocumentDetail = async () => {
        try {
            setIsLoading(true);
            const response = await adminService.getDocumentDetail(document.id);
            if (response.success) {
                setDocumentDetail(response.document);
                // Set active tab to first non-empty category
                const { chunks } = response.document;
                if (chunks.text.length > 0) setActiveTab('text');
                else if (chunks.table.length > 0) setActiveTab('table');
                else if (chunks.figure.length > 0) setActiveTab('figure');
            }
        } catch (error) {
            console.error('Error loading document detail:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const ChunkCard = ({ chunk, type }) => {
        const getTypeIcon = (type) => {
            switch (type) {
                case 'table': return '📊';
                case 'figure': return '🖼️';
                default: return '📝';
            }
        };

        const getTypeColor = (type) => {
            switch (type) {
                case 'table':
                    return darkMode ? '#10b981' : '#059669';
                case 'figure':
                    return darkMode ? '#8b5cf6' : '#7c3aed';
                default:
                    return currentTheme?.primary;
            }
        };

        return (
            <div
                className="border rounded-lg p-4 mb-4 hover:shadow-md transition-all cursor-pointer"
                style={{
                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                    borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                }}
                onClick={() => setSelectedChunk(chunk)}
            >
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                        <span className="text-xl mr-2">{getTypeIcon(type)}</span>
                        <h4
                            className="font-medium"
                            style={{ color: darkMode ? '#f3f4f6' : '#111827' }}
                        >
                            {chunk.title}
                        </h4>
                    </div>
                    <div
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                            backgroundColor: getTypeColor(type) + '20',
                            color: getTypeColor(type)
                        }}
                    >
                        {chunk.age_range}
                    </div>
                </div>

                <p
                    className="text-sm mb-2 line-clamp-2"
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                    {chunk.summary}
                </p>

                <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}
                >
                    <span>ID: {chunk.id}</span>
                    <span>{chunk.word_count} từ</span>
                </div>
            </div>
        );
    };

    const ChunkDetailModal = ({ chunk, isOpen, onClose }) => (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={chunk?.title || 'Chi tiết chunk'}
            size="xl"
        >
            {chunk && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                ID Chunk
                            </label>
                            <p className={`mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                {chunk.id}
                            </p>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Loại nội dung
                            </label>
                            <p className={`mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                {chunk.content_type === 'table' ? 'Bảng' : chunk.content_type === 'figure' ? 'Hình ảnh' : 'Văn bản'}
                            </p>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Độ tuổi
                            </label>
                            <p className={`mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                {chunk.age_min} - {chunk.age_max} tuổi
                            </p>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Số từ
                            </label>
                            <p className={`mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                {chunk.word_count} từ
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tóm tắt
                        </label>
                        <p className={`${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {chunk.summary}
                        </p>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Nội dung đầy đủ
                        </label>
                        <div
                            className="p-4 rounded-lg border max-h-64 overflow-y-auto"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
                                borderColor: darkMode ? '#374151' : '#e5e7eb'
                            }}
                        >
                            <pre
                                className="whitespace-pre-wrap text-sm"
                                style={{ color: darkMode ? '#e5e7eb' : '#374151' }}
                            >
                                {chunk.content}
                            </pre>
                        </div>
                    </div>

                    {chunk.table_columns && chunk.table_columns.length > 0 && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Cột trong bảng
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {chunk.table_columns.map((column, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 rounded text-xs"
                                        style={{
                                            backgroundColor: currentTheme?.primary + '20',
                                            color: currentTheme?.primary
                                        }}
                                    >
                                        {column}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {chunk.related_chunks && chunk.related_chunks.length > 0 && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Chunks liên quan
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {chunk.related_chunks.map((relatedId, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 rounded text-xs"
                                        style={{
                                            backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                                            color: darkMode ? '#d1d5db' : '#6b7280'
                                        }}
                                    >
                                        {relatedId}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={
                    <div className="flex items-center">
                        <BiFile className="w-5 h-5 mr-2" style={{ color: currentTheme?.primary }} />
                        <span style={{ color: darkMode ? '#f3f4f6' : '#111827' }}>
                            Chi tiết: {document?.title}
                        </span>
                    </div>
                }
                size="full"
            >
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader type="spinner" text="Đang tải chi tiết..." />
                    </div>
                ) : documentDetail ? (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div
                                className="p-4 rounded-lg border text-center"
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                                }}
                            >
                                <p className="text-2xl font-bold" style={{ color: currentTheme?.primary }}>
                                    {documentDetail.stats.total_chunks}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Tổng chunks
                                </p>
                            </div>
                            <div
                                className="p-4 rounded-lg border text-center"
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                                }}
                            >
                                <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                                    {documentDetail.stats.text_chunks}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Văn bản
                                </p>
                            </div>
                            <div
                                className="p-4 rounded-lg border text-center"
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                                }}
                            >
                                <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                                    {documentDetail.stats.table_chunks}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Bảng
                                </p>
                            </div>
                            <div
                                className="p-4 rounded-lg border text-center"
                                style={{
                                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                                    borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                                }}
                            >
                                <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
                                    {documentDetail.stats.figure_chunks}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Hình ảnh
                                </p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b" style={{ borderColor: darkMode ? '#4b5563' : '#e5e7eb' }}>
                            <nav className="flex space-x-8">
                                {[
                                    { key: 'text', label: 'Văn bản', count: documentDetail.stats.text_chunks },
                                    { key: 'table', label: 'Bảng', count: documentDetail.stats.table_chunks },
                                    { key: 'figure', label: 'Hình ảnh', count: documentDetail.stats.figure_chunks }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                                ? 'border-current'
                                                : 'border-transparent hover:border-gray-300'
                                            }`}
                                        style={{
                                            color: activeTab === tab.key
                                                ? currentTheme?.primary
                                                : (darkMode ? '#9ca3af' : '#6b7280')
                                        }}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {documentDetail.chunks[activeTab].length > 0 ? (
                                <div className="space-y-4">
                                    {documentDetail.chunks[activeTab].map((chunk, index) => (
                                        <ChunkCard
                                            key={chunk.id}
                                            chunk={chunk}
                                            type={activeTab}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                        Không có {activeTab === 'text' ? 'văn bản' : activeTab === 'table' ? 'bảng' : 'hình ảnh'} nào
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                            Không thể tải chi tiết tài liệu
                        </p>
                    </div>
                )}
            </Modal>

            <ChunkDetailModal
                chunk={selectedChunk}
                isOpen={!!selectedChunk}
                onClose={() => setSelectedChunk(null)}
            />
        </>
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
    const [showUploadModal, setShowUploadModal] = useState(false);

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
        debugMetadata();
    }, []);

    const handleUpload = async (file, metadata) => {
        try {
            const uploadResponse = await adminService.uploadDocument(file, metadata);
            if (uploadResponse.success) {
                const processResponse = await adminService.processDocument(
                    uploadResponse.document_id,
                    { temp_path: uploadResponse.temp_path }
                );

                if (processResponse.success) {
                    showSuccess('Tài liệu đã được upload và xử lý thành công');
                    loadDocuments();
                    return true;
                } else {
                    showError(processResponse.error || 'Không thể xử lý tài liệu');
                    return false;
                }
            } else {
                showError(uploadResponse.error || 'Không thể upload tài liệu');
                return false;
            }
        } catch (error) {
            showError('Có lỗi xảy ra khi upload tài liệu');
            return false;
        }
    };

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
                            <button
                                onClick={() => loadDocuments()}
                                disabled={isLoading}
                                className={`flex items-center px-4 py-2 border rounded-lg transition-colors shadow-sm ${darkMode
                                        ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                                        : 'bg-white border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <BiRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>

                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center px-4 py-2 rounded-lg text-white shadow-sm transition-colors hover:shadow-lg"
                                style={{ backgroundColor: currentThemeConfig?.primary }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = currentThemeConfig?.dark;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = currentThemeConfig?.primary;
                                }}
                            >
                                <BiUpload className="mr-2" />
                                Upload tài liệu
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
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
                                <button
                                    onClick={() => setSelectedDocuments([])}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${darkMode
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Bỏ chọn
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    <BiTrash className="w-4 h-4 mr-1" />
                                    Xóa đã chọn
                                </button>
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

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUpload}
                currentTheme={currentThemeConfig}
                darkMode={darkMode}
            />

            {/* Detail Modal - thay thế phần này */}
            <DetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                document={selectedDocument}
                currentTheme={currentThemeConfig}
                darkMode={darkMode}
            />
        </div>
    );
};



export default AdminDocuments;