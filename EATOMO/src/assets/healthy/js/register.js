class RegisterManager {
    constructor() {
        this.registerForm = document.getElementById('registerForm');
        this.initEventListeners();
    }

    initEventListeners() {
        this.registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Kiểm tra email hợp lệ
        if (!this.validateEmail(email)) {
            this.showMessage('Email không hợp lệ. Vui lòng nhập đúng định dạng email.', 'error');
            return;
        }
        
        // Kiểm tra mật khẩu xác nhận
        if (password !== confirmPassword) {
            this.showMessage('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.', 'error');
            return;
        }
        
        // Kiểm tra độ mạnh của mật khẩu
        if (password.length < 6) {
            this.showMessage('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showMessage('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                this.showMessage(data.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Đã xảy ra lỗi khi đăng ký. Vui lòng kiểm tra kết nối và thử lại.', 'error');
        }
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showMessage(message, type) {
        // Kiểm tra xem đã có message box chưa
        let messageBox = document.querySelector('.message-box');
        
        // Nếu chưa có, tạo mới
        if (!messageBox) {
            messageBox = document.createElement('div');
            messageBox.className = 'message-box';
            this.registerForm.parentNode.insertBefore(messageBox, this.registerForm);
        }
        
        // Cập nhật nội dung và kiểu
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        
        // Thêm CSS cho message box nếu chưa có
        this.addMessageStyles();
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            messageBox.remove();
        }, 5000);
    }
    
    addMessageStyles() {
        // Kiểm tra xem đã có style cho message box chưa
        if (!document.getElementById('message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                .message-box {
                    padding: 12px 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-weight: 500;
                    animation: fadeIn 0.3s ease;
                }
                
                .message-box.error {
                    background-color: #ffebee;
                    color: #c62828;
                    border-left: 4px solid #c62828;
                }
                
                .message-box.success {
                    background-color: #e8f5e9;
                    color: #2e7d32;
                    border-left: 4px solid #2e7d32;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Khởi tạo khi trang đã tải xong
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});