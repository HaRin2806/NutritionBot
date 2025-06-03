import React, { useState, useEffect } from 'react';
import {
    BiCog, BiSave, BiRefresh, BiShield, BiUser, BiKey,
    BiServer, BiData, BiCloud, BiMailSend, BiLock
} from 'react-icons/bi';
import { useApp } from '../../hooks/useContext';
import { Loader, Button, Input, Modal } from '../../components/common';
import adminService from '../../services/adminService';

const SettingCard = ({ title, description, children, icon }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-mint-100 rounded-lg mr-3">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
        {children}
    </div>
);

const CreateAdminModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError } = useApp();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập tên';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setIsLoading(true);
            const response = await adminService.createAdmin(formData);

            if (response.success) {
                showSuccess('Tạo admin mới thành công');
                onSuccess();
                onClose();
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            } else {
                showError(response.error || 'Tạo admin thất bại');
            }
        } catch (error) {
            showError(error.message || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tạo Admin mới" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Tên"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                />

                <Input
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                />

                <Input
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                />

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        color="gray"
                        outline
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        color="mint"
                        disabled={isLoading}
                        icon={isLoading ? <Loader type="dots" size="sm" /> : <BiUser />}
                    >
                        {isLoading ? 'Đang tạo...' : 'Tạo Admin'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const AdminSettings = () => {
    const { showSuccess, showError, showConfirm } = useApp();

    const [isLoading, setIsLoading] = useState(false);
    const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

    const [systemSettings, setSystemSettings] = useState({
        siteName: 'Nutribot',
        siteDescription: 'AI Chatbot tư vấn dinh dưỡng',
        allowRegistration: true,
        maxUsersPerDay: 100,
        maintenanceMode: false
    });

    const [aiSettings, setAiSettings] = useState({
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTokens: 2048,
        embeddingModel: 'intfloat/multilingual-e5-base'
    });

    const [emailSettings, setEmailSettings] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'noreply@nutribot.com',
        fromName: 'Nutribot'
    });

    // Load settings
    const loadSettings = async () => {
        try {
            setIsLoading(true);
            // Mock load settings - replace with actual API calls
            // const response = await adminService.getSettings();
            // setSystemSettings(response.systemSettings);
            // setAiSettings(response.aiSettings);
            // setEmailSettings(response.emailSettings);
        } catch (error) {
            showError('Không thể tải cài đặt hệ thống');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Save system settings
    const handleSaveSystemSettings = async () => {
        try {
            // Mock save - replace with actual API call
            // await adminService.updateSystemSettings(systemSettings);
            showSuccess('Đã lưu cài đặt hệ thống');
        } catch (error) {
            showError('Không thể lưu cài đặt hệ thống');
        }
    };

    // Save AI settings
    const handleSaveAiSettings = async () => {
        try {
            // Mock save - replace with actual API call
            // await adminService.updateAiSettings(aiSettings);
            showSuccess('Đã lưu cài đặt AI');
        } catch (error) {
            showError('Không thể lưu cài đặt AI');
        }
    };

    // Save email settings
    const handleSaveEmailSettings = async () => {
        try {
            // Mock save - replace with actual API call
            // await adminService.updateEmailSettings(emailSettings);
            showSuccess('Đã lưu cài đặt email');
        } catch (error) {
            showError('Không thể lưu cài đặt email');
        }
    };

    // Test email settings
    const handleTestEmail = async () => {
        try {
            // Mock test email
            showSuccess('Email test đã được gửi thành công');
        } catch (error) {
            showError('Không thể gửi email test');
        }
    };

    // Reset to defaults
    const handleResetSettings = async () => {
        const result = await showConfirm({
            title: 'Reset cài đặt?',
            text: 'Bạn có chắc muốn reset tất cả cài đặt về mặc định?',
            confirmButtonText: 'Reset',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                // Reset to default values
                setSystemSettings({
                    siteName: 'Nutribot',
                    siteDescription: 'AI Chatbot tư vấn dinh dưỡng',
                    allowRegistration: true,
                    maxUsersPerDay: 100,
                    maintenanceMode: false
                });

                setAiSettings({
                    model: 'gemini-2.0-flash',
                    temperature: 0.7,
                    maxTokens: 2048,
                    embeddingModel: 'intfloat/multilingual-e5-base'
                });

                showSuccess('Đã reset cài đặt về mặc định');
            } catch (error) {
                showError('Không thể reset cài đặt');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex justify-center py-12">
                    <Loader type="spinner" color="mint" text="Đang tải cài đặt..." />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
                        <p className="text-gray-600">Quản lý cấu hình và tùy chọn hệ thống</p>
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            onClick={loadSettings}
                            color="gray"
                            outline
                            icon={<BiRefresh />}
                        >
                            Làm mới
                        </Button>

                        <Button
                            onClick={handleResetSettings}
                            color="red"
                            outline
                            icon={<BiRefresh />}
                        >
                            Reset mặc định
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Settings */}
                <SettingCard
                    title="Cài đặt hệ thống"
                    description="Cấu hình chung của ứng dụng"
                    icon={<BiCog className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <Input
                            label="Tên website"
                            value={systemSettings.siteName}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả website
                            </label>
                            <textarea
                                value={systemSettings.siteDescription}
                                onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                            />
                        </div>

                        <Input
                            label="Số người dùng tối đa mỗi ngày"
                            type="number"
                            value={systemSettings.maxUsersPerDay}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, maxUsersPerDay: parseInt(e.target.value) }))}
                        />

                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={systemSettings.allowRegistration}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, allowRegistration: e.target.checked }))}
                                    className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Cho phép đăng ký mới</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={systemSettings.maintenanceMode}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                                    className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Chế độ bảo trì</span>
                            </label>
                        </div>

                        <Button
                            onClick={handleSaveSystemSettings}
                            color="mint"
                            icon={<BiSave />}
                            className="w-full"
                        >
                            Lưu cài đặt hệ thống
                        </Button>
                    </div>
                </SettingCard>

                {/* AI Settings */}
                <SettingCard
                    title="Cài đặt AI"
                    description="Cấu hình model AI và embedding"
                    icon={<BiServer className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model AI
                            </label>
                            <select
                                value={aiSettings.model}
                                onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                            >
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Temperature ({aiSettings.temperature})
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={aiSettings.temperature}
                                onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Bảo thủ</span>
                                <span>Sáng tạo</span>
                            </div>
                        </div>

                        <Input
                            label="Max Tokens"
                            type="number"
                            value={aiSettings.maxTokens}
                            onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Embedding Model
                            </label>
                            <select
                                value={aiSettings.embeddingModel}
                                onChange={(e) => setAiSettings(prev => ({ ...prev, embeddingModel: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                            >
                                <option value="intfloat/multilingual-e5-base">Multilingual E5 Base</option>
                                <option value="sentence-transformers/all-mpnet-base-v2">All-MiniLM-L6-v2</option>
                                <option value="text-embedding-ada-002">OpenAI Ada-002</option>
                            </select>
                        </div>

                        <Button
                            onClick={handleSaveAiSettings}
                            color="mint"
                            icon={<BiSave />}
                            className="w-full"
                        >
                            Lưu cài đặt AI
                        </Button>
                    </div>
                </SettingCard>

                {/* Email Settings */}
                <SettingCard
                    title="Cài đặt Email"
                    description="Cấu hình SMTP để gửi email"
                    icon={<BiMailSend className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <Input
                            label="SMTP Host"
                            value={emailSettings.smtpHost}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                            placeholder="smtp.gmail.com"
                        />

                        <Input
                            label="SMTP Port"
                            type="number"
                            value={emailSettings.smtpPort}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                        />

                        <Input
                            label="SMTP Username"
                            value={emailSettings.smtpUser}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                            placeholder="your-email@gmail.com"
                        />

                        <Input
                            label="SMTP Password"
                            type="password"
                            value={emailSettings.smtpPassword}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                            placeholder="App password"
                        />

                        <Input
                            label="From Email"
                            value={emailSettings.fromEmail}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                        />

                        <Input
                            label="From Name"
                            value={emailSettings.fromName}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                        />

                        <div className="flex space-x-2">
                            <Button
                                onClick={handleTestEmail}
                                color="gray"
                                outline
                                icon={<BiMailSend />}
                                className="flex-1"
                            >
                                Test Email
                            </Button>

                            <Button
                                onClick={handleSaveEmailSettings}
                                color="mint"
                                icon={<BiSave />}
                                className="flex-1"
                            >
                                Lưu cài đặt
                            </Button>
                        </div>
                    </div>
                </SettingCard>

                {/* Admin Management */}
                <SettingCard
                    title="Quản lý Admin"
                    description="Tạo và quản lý tài khoản admin"
                    icon={<BiShield className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <BiShield className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Chú ý bảo mật</h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Chỉ tạo tài khoản admin cho những người được tin tưởng.
                                        Admin có toàn quyền truy cập hệ thống.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowCreateAdminModal(true)}
                            color="mint"
                            icon={<BiUser />}
                            className="w-full"
                        >
                            Tạo Admin mới
                        </Button>

                        <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Admin hiện tại</h4>
                            <div className="space-y-2">
                                {/* Mock admin list */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">Super Admin</p>
                                        <p className="text-sm text-gray-600">admin@nutribot.com</p>
                                    </div>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                        Super Admin
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* Database & Storage */}
                <SettingCard
                    title="Database & Storage"
                    description="Thông tin và quản lý database"
                    icon={<BiData className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Database Type:</span>
                                <span className="ml-2 font-medium">MongoDB</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Collections:</span>
                                <span className="ml-2 font-medium">5</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Documents:</span>
                                <span className="ml-2 font-medium">12,450</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Database Size:</span>
                                <span className="ml-2 font-medium">245 MB</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Thao tác Database</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    color="gray"
                                    outline
                                    size="sm"
                                    onClick={() => showConfirm({
                                        title: 'Backup Database?',
                                        text: 'Tạo bản sao lưu database?'
                                    })}
                                >
                                    Backup DB
                                </Button>

                                <Button
                                    color="gray"
                                    outline
                                    size="sm"
                                    onClick={() => showConfirm({
                                        title: 'Optimize Database?',
                                        text: 'Tối ưu hóa database?'
                                    })}
                                >
                                    Optimize
                                </Button>

                                <Button
                                    color="red"
                                    outline
                                    size="sm"
                                    onClick={() => showConfirm({
                                        title: 'Xóa cache?',
                                        text: 'Xóa tất cả cache?'
                                    })}
                                >
                                    Clear Cache
                                </Button>

                                <Button
                                    color="red"
                                    outline
                                    size="sm"
                                    onClick={() => showConfirm({
                                        title: 'Rebuild Index?',
                                        text: 'Rebuild database indexes?'
                                    })}
                                >
                                    Rebuild Index
                                </Button>
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* Security Settings */}
                <SettingCard
                    title="Cài đặt bảo mật"
                    description="Cấu hình các tùy chọn bảo mật"
                    icon={<BiLock className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Rate Limiting</span>
                                    <p className="text-xs text-gray-500">Giới hạn số request per IP</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked={true}
                                    className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">CORS Protection</span>
                                    <p className="text-xs text-gray-500">Bảo vệ cross-origin requests</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked={true}
                                    className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">JWT Expiry</span>
                                    <p className="text-xs text-gray-500">Tự động logout sau 24h</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked={true}
                                    className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Audit Logging</span>
                                    <p className="text-xs text-gray-500">Ghi log các hoạt động admin</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked={false}
                                    className="rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                                />
                            </label>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">API Keys</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">Gemini API Key</p>
                                        <p className="text-sm text-gray-600">AIza***************xyz</p>
                                    </div>
                                    <Button size="sm" color="gray" outline>
                                        Đổi Key
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">JWT Secret</p>
                                        <p className="text-sm text-gray-600">****************</p>
                                    </div>
                                    <Button size="sm" color="gray" outline>
                                        Regenerate
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* System Information */}
                <SettingCard
                    title="Thông tin hệ thống"
                    description="Phiên bản và thông tin môi trường"
                    icon={<BiCloud className="w-5 h-5 text-mint-600" />}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Version:</span>
                                <span className="font-medium">1.0.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Environment:</span>
                                <span className="font-medium">Development</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Node.js:</span>
                                <span className="font-medium">v18.17.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Python:</span>
                                <span className="font-medium">3.9.7</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Last Restart:</span>
                                <span className="font-medium">2 hours ago</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Uptime:</span>
                                <span className="font-medium text-green-600">99.9%</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Button
                                color="mint"
                                outline
                                className="w-full"
                                onClick={() => showConfirm({
                                    title: 'Restart System?',
                                    text: 'Khởi động lại hệ thống? Điều này sẽ ngắt kết nối tất cả người dùng.'
                                })}
                            >
                                Restart System
                            </Button>
                        </div>
                    </div>
                </SettingCard>
            </div>

            {/* Global Save All */}
            <div className="mt-8 bg-gradient-to-r from-mint-50 to-mint-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Lưu tất cả cài đặt</h3>
                        <p className="text-sm text-gray-600">
                            Lưu toàn bộ cài đặt và áp dụng ngay lập tức
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => {
                                handleSaveSystemSettings();
                                handleSaveAiSettings();
                                handleSaveEmailSettings();
                            }}
                            color="mint"
                            size="lg"
                            icon={<BiSave />}
                        >
                            Lưu tất cả
                        </Button>
                    </div>
                </div>
            </div>

            {/* Create Admin Modal */}
            <CreateAdminModal
                isOpen={showCreateAdminModal}
                onClose={() => setShowCreateAdminModal(false)}
                onSuccess={() => {
                    // Reload admin list
                    console.log('Admin created successfully');
                }}
            />
        </div>
    );
};

export default AdminSettings;