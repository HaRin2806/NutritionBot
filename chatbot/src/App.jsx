import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { ChatProvider } from './contexts/ChatContext';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import storageService from './services/storageService';
import config from './config';
import { AuthProvider } from './contexts/AuthContext';
import './styles/global.css';

function App() {
  // Thiết lập header Authorization khi component mount
  useEffect(() => {
    // Lấy token từ localStorage hoặc sessionStorage
    const token = storageService.getToken();
    
    if (token) {
      // Thiết lập Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Thiết lập base URL từ config
    axios.defaults.baseURL = config.apiBaseUrl;
    
    // Luôn gửi cookies với requests
    axios.defaults.withCredentials = true;
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