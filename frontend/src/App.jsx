// frontend/src/App.jsx - CORRECTED VERSION
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Existing AppProvider
import { AppProvider } from './contexts/AppContext';
// Add ThemeProvider
import { ThemeProvider } from './contexts/ThemeContext';

import { storageService } from './services';

// Pages - theo đúng cấu trúc hiện tại
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
   AdminFeedback,
  AdminSettings
} from './pages/admin';

import config from './config';
import './styles/global.css';

function App() {
  // Setup axios interceptors - giữ nguyên logic hiện tại
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
      <ThemeProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* User Routes */}
            <Route path="/chat/:conversationId?" element={<ChatPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="documents" element={<AdminDocuments />} />
                  <Route path="conversations" element={<AdminConversations />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="" element={<AdminDashboard />} />
                </Routes>
              </AdminLayout>
            } />
          </Routes>
        </AppProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;