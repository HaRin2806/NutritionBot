import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ✅ THAY ĐỔI 1: Sử dụng AppProvider unified thay vì AuthProvider + ChatProvider riêng biệt
import { AppProvider } from './contexts/AppContext';

// ✅ THAY ĐỔI 2: Import từ services consolidated
import { storageService } from './services';

// Pages - giữ nguyên
import ChatPage from './pages/ChatPage';
import { LoginPage, RegisterPage } from './pages/auth';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';

// Admin - giữ nguyên
import AdminLayout from './components/admin/AdminLayout';
import {
  AdminDashboard,
  AdminUsers,
  AdminDocuments,
  AdminConversations,
  AdminAnalytics,
  AdminSettings
} from './pages/admin';

import config from './config';
import './styles/global.css';

function App() {
  // ✅ THAY ĐỔI 3: Đơn giản hóa setup - baseApi đã handle axios interceptors
  useEffect(() => {
    const token = storageService.getToken();
    
    if (token) {
      // Setup default axios headers qua baseApi
      import('./services/baseApi').then(({ default: baseApi }) => {
        baseApi.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      });
    }
  }, []);

  return (
    <Router>
      {/* ✅ THAY ĐỔI 4: AppProvider thay thế cho AuthProvider + ChatProvider */}
      <AppProvider>
        <Routes>
          {/* Public Routes - giữ nguyên */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Routes - giữ nguyên */}
          <Route path="/chat/:conversationId?" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Admin Routes - giữ nguyên */}
          <Route path="/admin/*" element={
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="documents" element={<AdminDocuments />} />
                <Route path="conversations" element={<AdminConversations />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="" element={<AdminDashboard />} />
              </Routes>
            </AdminLayout>
          } />
        </Routes>
      </AppProvider>
    </Router>
  );
}

export default App;