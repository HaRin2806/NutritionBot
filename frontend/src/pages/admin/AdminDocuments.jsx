import React, { useState, useEffect } from 'react';
import {
    BiFile, BiUpload, BiTrash, BiDownload, BiRefresh,
    BiSearch, BiFilter, BiCog, BiData, BiX, BiCheck, BiCloudUpload,
    BiChat
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/index';

const DocumentCard = ({ document, onView, onDelete, onProcess, isSelected, onSelect }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'processed':
                return 'bg-green-100 text-green-800';
            case 'uploaded':
                return 'bg-blue-100 text-blue-800';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'lesson':
                return '📚';
            case 'appendix':
                return '📋';
            case 'uploaded':
                return '📄';
            default:
                return '📄';
        }
    };

    return (
        <div className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${isSelected ? 'border-mint-300 bg-mint-50' : 'border-gray-200'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(document.id)}
                        className="mt-1 mr-3 rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                    />
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">{getTypeIcon(document.type)}</span>
                            <h3 className="font-medium text-gray-900 line-clamp-2">{document.title}</h3>
                        </div>
                        {document.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{document.description}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                                {document.status === 'processed' ? 'Đã xử lý' :
                                    document.status === 'uploaded' ? 'Đã tải lên' :
                                        document.status === 'processing' ? 'Đang xử lý' : 'Lỗi'}
                            </span>
                            <span>•</span>
                            <span>{document.type === 'lesson' ? 'Bài học' : document.type === 'appendix' ? 'Phụ lục' : 'Tài liệu'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {document.content_stats && (
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-medium text-blue-600">{document.content_stats.chunks || 0}</p>
                        <p className="text-blue-800">Chunks</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-medium text-green-600">{document.content_stats.tables || 0}</p>
                        <p className="text-green-800">Bảng</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="font-medium text-purple-600">{document.content_stats.figures || 0}</p>
                        <p className="text-purple-800">Hình</p>
                    </div>
                </div>
            )}

            {/* File info */}
            {document.file_size && (
                <div className="text-xs text-gray-500 mb-3">
                    Kích thước: {(document.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    {document.created_at && new Date(document.created_at).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onView(document)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                    >
                        <BiChat className="w-4 h-4" />
                    </button>

                    {document.status === 'uploaded' && (
                        <button
                            onClick={() => onProcess(document)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Xử lý tài liệu"
                        >
                            <BiCog className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={() => onDelete(document)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                    >
                        <BiTrash className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [file, setFile] = useState(null);
    const [metadata, setMetadata] = useState({
        title: '',
        description: '',
        author: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const { showError, showSuccess } = useApp();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!metadata.title) {
                setMetadata(prev => ({
                    ...prev,
                    title: selectedFile.name.split('.')[0]
                }));
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            showError('Vui lòng chọn file');
            return;
        }

        try {
            setIsUploading(true);
            const response = await adminService.uploadDocument(file, metadata);

            if (response.success) {
                showSuccess('Upload file thành công');
                onUpload();
                onClose();
                setFile(null);
                setMetadata({ title: '', description: '', author: '' });
            } else {
                showError(response.error || 'Upload thất bại');
            }
        } catch (error) {
            showError(error.message || 'Có lỗi xảy ra khi upload');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload tài liệu mới" size="md">
            <div className="space-y-4">
                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn file
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-mint-400 transition-colors">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.md,.docx"
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <BiCloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                Nhấp để chọn file hoặc kéo thả vào đây
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Hỗ trợ: PDF, TXT, MD, DOCX (tối đa 50MB)
                            </p>
                        </label>
                    </div>

                    {file && (
                        <div className="mt-2 p-3 bg-mint-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-mint-800">{file.name}</p>
                                    <p className="text-xs text-mint-600">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-mint-600 hover:text-mint-800"
                                >
                                    <BiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div>
                    <Input
                        label="Tiêu đề"
                        value={metadata.title}
                        onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Nhập tiêu đề tài liệu"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                    </label>
                    <textarea
                        value={metadata.description}
                        onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Mô tả nội dung tài liệu"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    />
                </div>

                <div>
                    <Input
                        label="Tác giả"
                        value={metadata.author}
                        onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Tên tác giả"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        onClick={onClose}
                        color="gray"
                        outline
                        disabled={isUploading}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleUpload}
                        color="mint"
                        disabled={!file || isUploading}
                        icon={isUploading ? <Loader type="dots" size="sm" /> : <BiUpload />}
                    >
                        {isUploading ? 'Đang upload...' : 'Upload'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const ProcessModal = ({ document, isOpen, onClose, onProcess }) => {
    const [options, setOptions] = useState({
        chunk_size: 1000,
        chunk_overlap: 200,
        age_range: [1, 19],
        create_embeddings: true
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const { showError, showSuccess } = useApp();

    const handleProcess = async () => {
        try {
            setIsProcessing(true);
            const response = await adminService.processDocument(document.id, options);

            if (response.success) {
                showSuccess('Xử lý tài liệu thành công');
                onProcess();
                onClose();
            } else {
                showError(response.error || 'Xử lý thất bại');
            }
        } catch (error) {
            showError(error.message || 'Có lỗi xảy ra khi xử lý');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Xử lý tài liệu" size="md">
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">{document?.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Tài liệu sẽ được chia thành chunks và tạo embeddings để phục vụ cho RAG system
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kích thước chunk
                        </label>
                        <input
                            type="number"
                            value={options.chunk_size}
                            onChange={(e) => setOptions(prev => ({ ...prev, chunk_size: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500"
                            min="200"
                            max="2000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Overlap
                        </label>
                        <input
                            type="number"
                            value={options.chunk_overlap}
                            onChange={(e) => setOptions(prev => ({ ...prev, chunk_overlap: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500"
                            min="0"
                            max="500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Độ tuổi mục tiêu
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="number"
                            value={options.age_range[0]}
                            onChange={(e) => setOptions(prev => ({
                                ...prev,
                                age_range: [parseInt(e.target.value), prev.age_range[1]]
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500"
                            min="1"
                            max="19"
                            placeholder="Từ"
                        />
                        <span className="py-2">-</span>
                        <input
                            type="number"
                            value={options.age_range[1]}
                            onChange={(e) => setOptions(prev => ({
                                ...prev,
                                age_range: [prev.age_range[0], parseInt(e.target.value)]
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500"
                            min="1"
                            max="19"
                            placeholder="Đến"
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={options.create_embeddings}
                            onChange={(e) => setOptions(prev => ({ ...prev, create_embeddings: e.target.checked }))}
                            className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Tạo embeddings</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        Tạo vector embeddings để sử dụng trong tìm kiếm semantic
                    </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        onClick={onClose}
                        color="gray"
                        outline
                        disabled={isProcessing}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleProcess}
                        color="mint"
                        disabled={isProcessing}
                        icon={isProcessing ? <Loader type="dots" size="sm" /> : <BiCog />}
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Xử lý'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const AdminDocuments = () => {
    const { showSuccess, showError, showConfirm } = useApp();

    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        search: '',
        type: 'all'
    });
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // Load documents
    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const response = await adminService.getAllDocuments();

            if (response.success) {
                setDocuments(response.documents);
                setStats(response.stats);
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

    // Initial load
    useEffect(() => {
        loadDocuments();
    }, []);

    // Filter documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = !filters.search ||
            doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            doc.description?.toLowerCase().includes(filters.search.toLowerCase());

        const matchesType = filters.type === 'all' || doc.type === filters.type;

        return matchesSearch && matchesType;
    });

    // Handle delete document
    const handleDeleteDocument = async (document) => {
        const result = await showConfirm({
            title: 'Xóa tài liệu?',
            text: `Bạn có chắc muốn xóa tài liệu "${document.title}"? Hành động này sẽ xóa tất cả dữ liệu liên quan.`,
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

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedDocuments.length === 0) {
            showError('Vui lòng chọn ít nhất một tài liệu');
            return;
        }

        const result = await showConfirm({
            title: `Xóa ${selectedDocuments.length} tài liệu?`,
            text: 'Hành động này sẽ xóa tất cả dữ liệu liên quan và không thể hoàn tác.',
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

    // Handle process document
    const handleProcessDocument = (document) => {
        setSelectedDocument(document);
        setShowProcessModal(true);
    };

    // Handle rebuild embeddings
    const handleRebuildEmbeddings = async () => {
        const result = await showConfirm({
            title: 'Rebuild embeddings?',
            text: 'Quá trình này sẽ tạo lại tất cả embeddings và có thể mất nhiều thời gian.',
            confirmButtonText: 'Rebuild',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const response = await adminService.rebuildEmbeddings(true);
                if (response.success) {
                    showSuccess('Rebuild embeddings thành công');
                } else {
                    showError(response.error || 'Rebuild thất bại');
                }
            } catch (error) {
                showError('Có lỗi xảy ra khi rebuild embeddings');
            }
        }
    };

    // Handle select document
    const handleSelectDocument = (docId) => {
        setSelectedDocuments(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedDocuments.length === filteredDocuments.length) {
            setSelectedDocuments([]);
        } else {
            setSelectedDocuments(filteredDocuments.map(doc => doc.id));
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý tài liệu</h1>
                        <p className="text-gray-600">Upload và quản lý tài liệu cho hệ thống RAG</p>
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            onClick={() => loadDocuments()}
                            color="gray"
                            outline
                            icon={<BiRefresh />}
                            disabled={isLoading}
                        >
                            Làm mới
                        </Button>

                        <Button
                            onClick={handleRebuildEmbeddings}
                            color="mint"
                            outline
                            icon={<BiData />}
                        >
                            Rebuild Embeddings
                        </Button>

                        <Button
                            onClick={() => setShowUploadModal(true)}
                            color="mint"
                            icon={<BiUpload />}
                        >
                            Upload tài liệu
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <BiFile className="w-8 h-8 text-blue-500" />
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">Tổng tài liệu</p>
                                <p className="text-xl font-bold text-gray-900">{stats.total || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <BiCheck className="w-8 h-8 text-green-500" />
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">Đã xử lý</p>
                                <p className="text-xl font-bold text-gray-900">{stats.processed || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <BiCloudUpload className="w-8 h-8 text-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">Đã upload</p>
                                <p className="text-xl font-bold text-gray-900">{stats.uploaded || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <BiData className="w-8 h-8 text-orange-500" />
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">Total Chunks</p>
                                <p className="text-xl font-bold text-gray-900">{stats.total_chunks || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="lesson">Bài học</option>
                            <option value="appendix">Phụ lục</option>
                            <option value="uploaded">Đã upload</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedDocuments.length > 0 && (
                <div className="bg-mint-50 border border-mint-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-mint-700 font-medium">
                            Đã chọn {selectedDocuments.length} tài liệu
                        </span>
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => setSelectedDocuments([])}
                                color="gray"
                                size="sm"
                                outline
                            >
                                Bỏ chọn
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                color="red"
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
                    <Loader type="spinner" color="mint" text="Đang tải danh sách tài liệu..." />
                </div>
            ) : filteredDocuments.length > 0 ? (
                <>
                    {/* Select All */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
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
                                onView={(doc) => console.log('View document:', doc)}
                                onDelete={handleDeleteDocument}
                                onProcess={handleProcessDocument}
                                isSelected={selectedDocuments.includes(document.id)}
                                onSelect={handleSelectDocument}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <BiFile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có tài liệu nào</h3>
                    <p className="text-gray-500 mb-4">
                        {filters.search || filters.type !== 'all'
                            ? 'Không tìm thấy tài liệu phù hợp với bộ lọc'
                            : 'Chưa có tài liệu nào được upload'
                        }
                    </p>
                    <Button
                        onClick={() => setShowUploadModal(true)}
                        color="mint"
                        icon={<BiUpload />}
                    >
                        Upload tài liệu đầu tiên
                    </Button>
                </div>
            )}

            {/* Modals */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={loadDocuments}
            />

            <ProcessModal
                document={selectedDocument}
                isOpen={showProcessModal}
                onClose={() => {
                    setShowProcessModal(false);
                    setSelectedDocument(null);
                }}
                onProcess={loadDocuments}
            />
        </div>
    );
};

export default AdminDocuments;