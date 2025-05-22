import { useCallback } from 'react';
import Swal from 'sweetalert2';

const useToast = () => {
    const showSuccess = useCallback((message, timer = 1500) => {
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: message,
            confirmButtonColor: '#36B37E',
            timer,
            showConfirmButton: timer > 2000
        });
    }, []);

    const showError = useCallback((message) => {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: message,
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#36B37E'
        });
    }, []);

    const showConfirm = useCallback(({
        title = 'Xác nhận',
        text = 'Bạn có chắc chắn muốn thực hiện hành động này?',
        confirmButtonText = 'Xác nhận',
        cancelButtonText = 'Hủy',
        icon = 'question'
    } = {}) => {
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
    }, []);

    const showPrompt = useCallback(({
        title = 'Nhập thông tin',
        input = 'text',
        inputValue = '',
        confirmButtonText = 'Lưu',
        cancelButtonText = 'Hủy',
        validator = null
    } = {}) => {
        return Swal.fire({
            title,
            input,
            inputValue,
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText,
            confirmButtonColor: '#36B37E',
            preConfirm: (value) => {
                if (validator) {
                    const error = validator(value);
                    if (error) {
                        Swal.showValidationMessage(error);
                    }
                }
                return value;
            }
        });
    }, []);

    const showAgePrompt = useCallback((currentAge = null) => {
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
    }, []);

    const showCustomMessage = useCallback(({
        title,
        text,
        icon = 'info',
        showConfirmButton = true,
        timer = null,
        confirmButtonText = 'Đồng ý',
        showCancelButton = false,
        cancelButtonText = 'Hủy'
    } = {}) => {
        return Swal.fire({
            title,
            text,
            icon,
            showConfirmButton,
            confirmButtonColor: '#36B37E',
            confirmButtonText,
            timer,
            showCancelButton,
            cancelButtonText
        });
    }, []);

    // Thêm showToast method
    const showToast = useCallback((message, icon = 'success', timer = 3000) => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon,
            title: message
        });
    }, []);

    const showLoginSuccess = useCallback((callback) => {
        Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công!',
            text: 'Chào mừng bạn đến với Nutribot',
            confirmButtonText: 'Bắt đầu trò chuyện',
            confirmButtonColor: '#36B37E',
            willClose: callback
        });
    }, []);

    const showRegisterSuccess = useCallback((callback) => {
        Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công!',
            text: 'Bạn đã tạo tài khoản thành công.',
            confirmButtonText: 'Đăng nhập ngay',
            confirmButtonColor: '#36B37E',
            willClose: callback
        });
    }, []);

    const showLogoutConfirm = useCallback((callback) => {
        Swal.fire({
            title: 'Đăng xuất?',
            text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#36B37E',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }, []);

    const showLoginRequired = useCallback((callback) => {
        Swal.fire({
            title: 'Bạn chưa đăng nhập',
            text: 'Bạn cần đăng nhập để sử dụng tính năng này',
            icon: 'warning',
            confirmButtonText: 'Đăng nhập ngay',
            confirmButtonColor: '#36B37E',
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }, []);

    const showDeleteConfirm = useCallback((callback) => {
        Swal.fire({
            title: 'Xóa cuộc trò chuyện?',
            text: 'Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#36B37E',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }, []);

    const showBulkDeleteConfirm = useCallback((count, callback) => {
        Swal.fire({
            title: `Xác nhận xóa ${count} cuộc trò chuyện`,
            text: 'Bạn có chắc chắn muốn xóa các cuộc trò chuyện đã chọn?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#36B37E',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }, []);

    const showAgeMismatchWarning = useCallback((createNewCallback, restoreAgeCallback) => {
        Swal.fire({
            title: 'Độ tuổi không khớp',
            text: 'Cuộc trò chuyện này đã được thiết lập cho độ tuổi khác. Vui lòng tạo cuộc trò chuyện mới nếu muốn sử dụng độ tuổi hiện tại.',
            icon: 'warning',
            confirmButtonText: 'Tạo cuộc trò chuyện mới',
            cancelButtonText: 'Đóng',
            showCancelButton: true,
            confirmButtonColor: '#36B37E'
        }).then((result) => {
            if (result.isConfirmed && createNewCallback) {
                createNewCallback();
            } else if (restoreAgeCallback) {
                restoreAgeCallback();
            }
        });
    }, []);

    return {
        showSuccess,
        showError,
        showConfirm,
        showPrompt,
        showAgePrompt,
        showCustomMessage,
        showToast, // Thêm vào đây
        showLoginSuccess,
        showRegisterSuccess,
        showLogoutConfirm,
        showLoginRequired,
        showDeleteConfirm,
        showBulkDeleteConfirm,
        showAgeMismatchWarning
    };
};

export default useToast;