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
            <Route path="/chat/:conversationId?" element={<ChatPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;