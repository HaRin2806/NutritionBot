import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import {
  AdminDashboard,
  AdminUsers,
  AdminDocuments,
  AdminConversations,
  AdminAnalytics,
  AdminSettings
} from './pages/admin';

import storageService from './services/storageService';
import config from './config';
import './styles/global.css';

function App() {
  // Thiết lập axios defaults
  useEffect(() => {
    const token = storageService.getToken();

    console.log('🔧 Setting up axios with token:', !!token);

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.defaults.baseURL = config.apiBaseUrl;
    axios.defaults.withCredentials = true;

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('401 error, clearing auth data');
          storageService.clearUserData();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
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
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                  {/* Redirect /admin to /admin/dashboard */}
                  <Route path="" element={<AdminDashboard />} />
                </Routes>
              </AdminLayout>
            } />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;