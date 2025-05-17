import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  // Thiết lập header Authorization khi component mount
  useEffect(() => {
    // Lấy token từ localStorage hoặc sessionStorage
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (token) {
      // Thiết lập Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Luôn gửi cookies với requests
    axios.defaults.withCredentials = true;
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/chat/:conversationId?" element={<ChatPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;