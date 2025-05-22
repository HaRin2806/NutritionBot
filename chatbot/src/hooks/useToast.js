import { useCallback } from 'react';
import Swal from 'sweetalert2';

/**
 * Hook cung cấp các hàm hiển thị thông báo
 * @returns {Object} Các hàm hiển thị thông báo
 */
const useToast = () => {
    /**
     * Hiển thị thông báo thành công
     * @param {string} message - Nội dung thông báo
     * @param {number} timer - Thời gian hiển thị (ms)
     */
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

    /**
     * Hiển thị thông báo lỗi
     * @param {string} message - Nội dung thông báo
     */
    const showError = useCallback((message) => {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: message,
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#36B37E'
        });
    }, []);

    /**
     * Hiển thị thông báo xác nhận
     * @param {Object} options - Tùy chọn
     * @returns {Promise} Kết quả xác nhận
     */
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

    /**
     * Hiển thị prompt nhập liệu
     * @param {Object} options - Tùy chọn
     * @returns {Promise} Kết quả nhập liệu
     */
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

    /**
     * Hiển thị prompt tuổi
     * @param {number} currentAge - Tuổi hiện tại
     * @returns {Promise} Kết quả chọn tuổi
     */
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

    /**
     * Hiển thị thông báo với tiêu đề và nội dung tùy chỉnh
     * @param {Object} options - Tùy chọn
     * @returns {Promise} Kết quả
     */
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

    /**
     * Hiển thị toast thông báo nhỏ
     * @param {string} message - Nội dung thông báo
     * @param {string} icon - Icon (success, error, warning, info)
     * @param {number} timer - Thời gian hiển thị (ms)
     */
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

    /**
     * Hiển thị thông báo đăng nhập thành công
     * @param {Function} callback - Hàm callback sau khi đóng thông báo
     */
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

    /**
     * Hiển thị thông báo đăng ký thành công
     * @param {Function} callback - Hàm callback sau khi đóng thông báo
     */
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

    /**
     * Hiển thị thông báo xác nhận đăng xuất
     * @param {Function} callback - Hàm callback sau khi xác nhận
     */
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

    /**
     * Hiển thị thông báo lỗi khi chưa đăng nhập
     * @param {Function} callback - Hàm callback sau khi đóng thông báo
     */
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

    /**
     * Hiển thị thông báo xác nhận xóa cuộc trò chuyện
     * @param {Function} callback - Hàm callback sau khi xác nhận
     */
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

    /**
     * Hiển thị thông báo xác nhận xóa nhiều cuộc trò chuyện
     * @param {number} count - Số lượng cuộc trò chuyện
     * @param {Function} callback - Hàm callback sau khi xác nhận
     */
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

    /**
     * Hiển thị thông báo lỗi khi độ tuổi không khớp
     * @param {Function} createNewCallback - Callback tạo mới
     * @param {Function} restoreAgeCallback - Callback khôi phục tuổi
     */
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
        showToast,
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