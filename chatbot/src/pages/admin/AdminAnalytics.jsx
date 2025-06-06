import React, { useState, useEffect } from 'react';
import {
    BiBarChart, BiTrendingUp, BiUser, BiMessageSquareDetail,
    BiRefresh, BiDownload, BiCalendar, BiFilter
} from 'react-icons/bi';
import { useApp } from '../../contexts/AppContext';
import { Loader, Button } from '../../components/common';
import { adminService } from '../../services/index';

const MetricCard = ({ title, value, change, trend, icon, color }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {change && (
                    <div className="flex items-center mt-2">
                        <BiTrendingUp className={`w-4 h-4 mr-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                {icon}
            </div>
        </div>
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
    </div>
);

const SimpleBarChart = ({ data, title }) => (
    <div className="space-y-3">
        {data.map((item, index) => (
            <div key={index} className="flex items-center">
                <div className="w-20 text-sm text-gray-600">{item.label}</div>
                <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-mint-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="w-12 text-sm font-medium text-gray-900">{item.value}</div>
            </div>
        ))}
    </div>
);

const SimpleLineChart = ({ data, title }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
            {data.map((item, index) => (
                <div key={index} className="text-center">
                    <div className="h-20 flex items-end justify-center mb-2">
                        <div
                            className="w-8 bg-mint-500 rounded-t transition-all duration-500"
                            style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 80}px` }}
                        />
                    </div>
                    <div className="text-xs text-gray-600">{item.label}</div>
                    <div className="text-sm font-medium text-gray-900">{item.value}</div>
                </div>
            ))}
        </div>
    </div>
);

const AdminAnalytics = () => {
    const { showError } = useApp();

    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
    const [analyticsData, setAnalyticsData] = useState({
        overview: {},
        userStats: {},
        conversationStats: {},
        systemStats: {}
    });

    // Load analytics data
    const loadAnalyticsData = async () => {
        try {
            setIsLoading(true);

            // Mock data - replace with actual service calls
            const mockData = {
                overview: {
                    totalUsers: 1250,
                    activeUsers: 890,
                    totalConversations: 3420,
                    avgMessagesPerConversation: 6.8,
                    userGrowth: '+12.5%',
                    conversationGrowth: '+8.3%'
                },
                userStats: {
                    dailyNewUsers: [
                        { label: 'T2', value: 45 },
                        { label: 'T3', value: 52 },
                        { label: 'T4', value: 38 },
                        { label: 'T5', value: 61 },
                        { label: 'T6', value: 73 },
                        { label: 'T7', value: 84 },
                        { label: 'CN', value: 29 }
                    ],
                    genderDistribution: [
                        { label: 'Nam', value: 580 },
                        { label: 'Nữ', value: 620 },
                        { label: 'Khác', value: 50 }
                    ]
                },
                conversationStats: {
                    dailyConversations: [
                        { label: 'T2', value: 120 },
                        { label: 'T3', value: 135 },
                        { label: 'T4', value: 98 },
                        { label: 'T5', value: 156 },
                        { label: 'T6', value: 189 },
                        { label: 'T7', value: 201 },
                        { label: 'CN', value: 87 }
                    ],
                    ageDistribution: [
                        { label: '1-3 tuổi', value: 450 },
                        { label: '4-6 tuổi', value: 680 },
                        { label: '7-10 tuổi', value: 520 },
                        { label: '11-15 tuổi', value: 380 },
                        { label: '16-19 tuổi', value: 290 }
                    ]
                },
                systemStats: {
                    responseTime: '1.2s',
                    uptime: '99.9%',
                    errorRate: '0.1%',
                    totalEmbeddings: 15420
                }
            };

            setAnalyticsData(mockData);

        } catch (error) {
            console.error('Error loading analytics:', error);
            showError('Có lỗi xảy ra khi tải dữ liệu phân tích');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadAnalyticsData();
    }, [timeRange]);

    // Handle export
    const handleExport = async () => {
        try {
            // Mock export functionality
            const exportData = {
                timeRange,
                exportedAt: new Date().toISOString(),
                data: analyticsData
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            showError('Không thể xuất dữ liệu phân tích');
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex justify-center py-12">
                    <Loader type="spinner" color="mint" text="Đang tải dữ liệu phân tích..." />
                </div>
            </div>
        );
    }

    const { overview, userStats, conversationStats, systemStats } = analyticsData;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Phân tích & Thống kê</h1>
                        <p className="text-gray-600">Theo dõi hiệu suất và xu hướng sử dụng hệ thống</p>
                    </div>

                    <div className="flex space-x-3">
                        <div className="flex items-center space-x-2">
                            <BiCalendar className="text-gray-500" />
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="7d">7 ngày qua</option>
                                <option value="30d">30 ngày qua</option>
                                <option value="90d">90 ngày qua</option>
                            </select>
                        </div>

                        <Button
                            onClick={loadAnalyticsData}
                            color="gray"
                            outline
                            icon={<BiRefresh />}
                            disabled={isLoading}
                        >
                            Làm mới
                        </Button>

                        <Button
                            onClick={handleExport}
                            color="mint"
                            outline
                            icon={<BiDownload />}
                        >
                            Xuất báo cáo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Tổng người dùng"
                    value={overview.totalUsers?.toLocaleString() || '0'}
                    change={overview.userGrowth}
                    trend="up"
                    icon={<BiUser className="w-6 h-6 text-white" />}
                    color="bg-blue-500"
                />

                <MetricCard
                    title="Người dùng hoạt động"
                    value={overview.activeUsers?.toLocaleString() || '0'}
                    change="+5.2%"
                    trend="up"
                    icon={<BiUser className="w-6 h-6 text-white" />}
                    color="bg-green-500"
                />

                <MetricCard
                    title="Cuộc hội thoại"
                    value={overview.totalConversations?.toLocaleString() || '0'}
                    change={overview.conversationGrowth}
                    trend="up"
                    icon={<BiMessageSquareDetail className="w-6 h-6 text-white" />}
                    color="bg-purple-500"
                />

                <MetricCard
                    title="TB tin nhắn/cuộc hội thoại"
                    value={overview.avgMessagesPerConversation || '0'}
                    change="+2.1%"
                    trend="up"
                    icon={<BiBarChart className="w-6 h-6 text-white" />}
                    color="bg-orange-500"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Daily New Users */}
                <ChartCard title="Người dùng mới theo ngày">
                    <SimpleLineChart
                        data={userStats.dailyNewUsers || []}
                        title="Người dùng mới"
                    />
                </ChartCard>

                {/* Daily Conversations */}
                <ChartCard title="Cuộc hội thoại theo ngày">
                    <SimpleLineChart
                        data={conversationStats.dailyConversations || []}
                        title="Cuộc hội thoại"
                    />
                </ChartCard>

                {/* Gender Distribution */}
                <ChartCard title="Phân bố giới tính">
                    <SimpleBarChart
                        data={userStats.genderDistribution || []}
                        title="Giới tính"
                    />
                </ChartCard>

                {/* Age Distribution */}
                <ChartCard title="Phân bố độ tuổi">
                    <SimpleBarChart
                        data={conversationStats.ageDistribution || []}
                        title="Độ tuổi"
                    />
                </ChartCard>
            </div>

            {/* System Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <ChartCard title="Hiệu suất hệ thống">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Thời gian phản hồi trung bình</span>
                            <span className="font-semibold text-green-600">{systemStats.responseTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Uptime</span>
                            <span className="font-semibold text-green-600">{systemStats.uptime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tỷ lệ lỗi</span>
                            <span className="font-semibold text-green-600">{systemStats.errorRate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tổng embeddings</span>
                            <span className="font-semibold text-blue-600">{systemStats.totalEmbeddings?.toLocaleString()}</span>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title="Top câu hỏi thường gặp">
                    <div className="space-y-3">
                        {[
                            { question: "Trẻ nên ăn gì để phát triển tốt?", count: 156 },
                            { question: "Vitamin nào cần thiết cho trẻ?", count: 134 },
                            { question: "Chế độ ăn cho trẻ biếng ăn", count: 98 },
                            { question: "Thực phẩm tăng cường miễn dịch", count: 87 },
                            { question: "Dinh dưỡng cho trẻ suy dinh dưỡng", count: 76 }
                        ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 truncate">{item.question}</p>
                                </div>
                                <span className="ml-2 px-2 py-1 bg-mint-100 text-mint-800 rounded-full text-xs font-medium">
                                    {item.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <ChartCard title="Hoạt động theo giờ">
                    <div className="space-y-2">
                        {[
                            { hour: '6-9h', activity: 15 },
                            { hour: '9-12h', activity: 35 },
                            { hour: '12-15h', activity: 25 },
                            { hour: '15-18h', activity: 45 },
                            { hour: '18-21h', activity: 60 },
                            { hour: '21-24h', activity: 20 }
                        ].map((item, index) => (
                            <div key={index} className="flex items-center">
                                <div className="w-12 text-sm text-gray-600">{item.hour}</div>
                                <div className="flex-1 mx-3">
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-mint-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(item.activity / 60) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="w-8 text-sm font-medium text-gray-900">{item.activity}%</div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            {/* Recent Activity Feed */}
            <ChartCard title="Hoạt động gần đây">
                <div className="space-y-4">
                    {[
                        {
                            time: '5 phút trước',
                            action: 'Người dùng mới đăng ký',
                            details: 'Nguyễn Thị C đã tạo tài khoản',
                            type: 'user'
                        },
                        {
                            time: '12 phút trước',
                            action: 'Cuộc hội thoại mới',
                            details: 'Tư vấn dinh dưỡng cho trẻ 4 tuổi',
                            type: 'conversation'
                        },
                        {
                            time: '23 phút trước',
                            action: 'Tài liệu được upload',
                            details: 'Hướng dẫn dinh dưỡng mới.pdf',
                            type: 'document'
                        },
                        {
                            time: '1 giờ trước',
                            action: 'Rebuild embeddings',
                            details: 'Hoàn thành xử lý 1,250 chunks',
                            type: 'system'
                        },
                        {
                            time: '2 giờ trước',
                            action: 'Người dùng mới đăng ký',
                            details: 'Trần Văn D đã tạo tài khoản',
                            type: 'user'
                        }
                    ].map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                            <div className={`p-2 rounded-full ${activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                                    activity.type === 'conversation' ? 'bg-green-100 text-green-600' :
                                        activity.type === 'document' ? 'bg-purple-100 text-purple-600' :
                                            'bg-gray-100 text-gray-600'
                                }`}>
                                {activity.type === 'user' ? <BiUser className="w-4 h-4" /> :
                                    activity.type === 'conversation' ? <BiMessageSquareDetail className="w-4 h-4" /> :
                                        activity.type === 'document' ? <BiDownload className="w-4 h-4" /> :
                                            <BiBarChart className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                <p className="text-sm text-gray-500">{activity.details}</p>
                                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ChartCard>

            {/* Summary Statistics */}
            <div className="mt-8 bg-gradient-to-r from-mint-50 to-mint-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt thống kê</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-mint-600">{overview.totalUsers?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Tổng người dùng</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-mint-600">{overview.totalConversations?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Tổng cuộc hội thoại</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-mint-600">{(overview.totalConversations * overview.avgMessagesPerConversation)?.toFixed(0)}</p>
                        <p className="text-sm text-gray-600">Tổng tin nhắn</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-mint-600">{((overview.activeUsers / overview.totalUsers) * 100)?.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">Tỷ lệ người dùng hoạt động</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;