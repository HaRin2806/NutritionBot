import { useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';

// Single hook for auth operations
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Single hook for chat operations  
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const useToast = () => {
  const showSuccess = (message, timer = 1500) => {
    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: message,
      confirmButtonColor: '#36B37E',
      timer,
      showConfirmButton: timer > 2000
    });
  };

  const showError = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: message,
      confirmButtonColor: '#36B37E'
    });
  };

  const showConfirm = async (options = {}) => {
    const {
      title = 'Xác nhận',
      text = 'Bạn có chắc chắn?',
      confirmButtonText = 'Xác nhận',
      cancelButtonText = 'Hủy',
      icon = 'question'
    } = options;

    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: '#36B37E',
      cancelButtonColor: '#d33',
      confirmButtonText,
      cancelButtonText
    });
  };

  const showAgePrompt = (currentAge = null) => {
    return Swal.fire({
      title: 'Thiết lập độ tuổi',
      html: `
        <select id="swal-age" class="swal2-input">
          ${Array.from({ length: 19 }, (_, i) => i + 1).map(age =>
            `<option value="${age}" ${currentAge === age ? 'selected' : ''}>${age} tuổi</option>`
          ).join('')}
        </select>
      `,
      confirmButtonText: 'Lưu',
      confirmButtonColor: '#36B37E',
      allowOutsideClick: false,
      preConfirm: () => {
        const age = parseInt(document.getElementById('swal-age').value);
        if (isNaN(age) || age < 1 || age > 19) {
          Swal.showValidationMessage('Vui lòng chọn tuổi từ 1-19');
        }
        return age;
      }
    });
  };

  return { showSuccess, showError, showConfirm, showAgePrompt };
};

export const useApp = () => {
  const auth = useAuth();
  const chat = useChat();
  const toast = useToast();
  
  return {
    // Auth
    ...auth,
    
    // Chat  
    ...chat,
    
    // Toast
    ...toast
  };
};