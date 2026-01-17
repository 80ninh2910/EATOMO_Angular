// Login functionality for both customer and admin
class LoginManager {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        // Add event listeners for both login forms
        document.getElementById('adminLogin').addEventListener('submit', (e) => this.handleAdminLogin(e));
        document.getElementById('userLogin').addEventListener('submit', (e) => this.handleCustomerLogin(e));
        
        // Clear any existing localStorage session data to prevent auto-redirect
        // This ensures users can always access the login page
        localStorage.removeItem('userInfo');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('userRole');
        
        // NOTE: removed automatic server-side session check to avoid auto-redirect/login when
        // opening the login page. Login will only occur after the user submits credentials.
    }

    async checkExistingSession() {
        try {
            // Only check server session, don't auto-redirect from localStorage
            // This prevents automatic redirect when opening login page
            const response = await fetch(`${this.baseURL}/auth/check-session`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success && data.user.logged_in) {
                // User is already logged in, redirect accordingly
                this.redirectAfterLogin(data.user.role);
            }
        } catch (error) {
            console.log('No existing session found');
        }
    }

    async handleCustomerLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('user-username').value;
        const password = document.getElementById('user-password').value;

        // Front-end mock login for customer
        if (username === 'user' && password === '1') {
            this.showMessage('Login successful (mock). Redirecting...', 'success');
            try {
                localStorage.setItem('userInfo', JSON.stringify({ username, role: 'customer' }));
                localStorage.setItem('userRole', 'customer');
                localStorage.setItem('cart', JSON.stringify([]));
            } catch (e) { /* ignore */ }
            setTimeout(() => window.location.href = 'index.html', 800);
            return;
        }
        
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            // Ensure any previous auth state is cleared so this is a fresh login attempt
            try {
                localStorage.removeItem('userInfo');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('userRole');
                localStorage.removeItem('user_id');
            } catch (e) { /* ignore */ }
            const response = await fetch(`${this.baseURL}/auth/customer-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Store user info in localStorage for easy access
                // Remove any leftover fallback user_id from previous sessions
                try { localStorage.removeItem('user_id'); } catch (e) { /* ignore */ }
                localStorage.setItem('userInfo', JSON.stringify(data.user));
                localStorage.setItem('userRole', 'customer');
                // Reset cart on a fresh login so previous anonymous cart is not carried over
                try {
                    localStorage.setItem('cart', JSON.stringify([]));
                    // notify other pages/scripts that the cart was reset so they can update UI
                    try { window.dispatchEvent(new CustomEvent('cart:reset')); } catch (e) { /* ignore */ }
                } catch (e) { /* ignore */ }
                
                // Redirect to index.html after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async handleAdminLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        // Front-end mock login for admin
        if (username === 'admin' && password === '1') {
            this.showMessage('Admin login successful (mock). Redirecting...', 'success');
            try {
                localStorage.setItem('adminInfo', JSON.stringify({ username, role: 'admin' }));
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('cart', JSON.stringify([]));
            } catch (e) { /* ignore */ }
            setTimeout(() => window.location.href = 'admin.html', 800);
            return;
        }
        
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            // Ensure any previous auth state is cleared so this is a fresh admin login attempt
            try {
                localStorage.removeItem('userInfo');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('userRole');
                localStorage.removeItem('user_id');
            } catch (e) { /* ignore */ }
            const response = await fetch(`${this.baseURL}/auth/admin-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('Admin login successful! Redirecting...', 'success');
                
                // Store admin info in localStorage for easy access
                // Remove any leftover fallback user_id from previous sessions
                try { localStorage.removeItem('user_id'); } catch (e) { /* ignore */ }
                localStorage.setItem('adminInfo', JSON.stringify(data.admin));
                localStorage.setItem('userRole', 'admin');
                // Reset cart on admin login as well
                try {
                    localStorage.setItem('cart', JSON.stringify([]));
                    try { window.dispatchEvent(new CustomEvent('cart:reset')); } catch (e) { /* ignore */ }
                } catch (e) { /* ignore */ }
                
                // Redirect to admin.html after a short delay
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                this.showMessage(data.message || 'Admin login failed', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    redirectAfterLogin(role) {
        if (role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.login-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `login-message ${type}`;
        messageDiv.textContent = message;
        
        // Style the message
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #ef4444;'}
        `;

        document.body.appendChild(messageDiv);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Session management utilities
class SessionManager {
    static isLoggedIn() {
        return localStorage.getItem('userRole') !== null;
    }

    static getUserRole() {
        return localStorage.getItem('userRole');
    }

    static getUserInfo() {
        const role = this.getUserRole();
        if (role === 'customer') {
            return JSON.parse(localStorage.getItem('userInfo') || '{}');
        } else if (role === 'admin') {
            return JSON.parse(localStorage.getItem('adminInfo') || '{}');
        }
        return null;
    }

    static async logout() {
        try {
            const response = await fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            // Clear local storage
            localStorage.removeItem('userInfo');
            localStorage.removeItem('adminInfo');
            localStorage.removeItem('userRole');
            try { localStorage.removeItem('user_id'); } catch (e) { /* ignore */ }
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local storage and redirect even if server logout fails
            try {
                localStorage.removeItem('userInfo');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('userRole');
                try { localStorage.removeItem('user_id'); } catch (e) { /* ignore */ }
            } catch (e) { /* ignore */ }
            window.location.href = 'login.html';
        }
    }

    static async createOrder(orderData) {
        try {
            // Ensure orderData contains user_id as a fallback for environments where
            // server-side session cookies may not be sent. The server accepts client-
            // provided user_id only as a development fallback (see backend warnings).
            try {
                const userInfo = SessionManager.getUserInfo();
                if (userInfo && userInfo.id && !orderData.user_id) {
                    orderData.user_id = userInfo.id;
                }
            } catch (e) { /* ignore */ }

            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Order creation error:', error);
            return { success: false, message: 'Network error' };
        }
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Export for use in other files
window.SessionManager = SessionManager;
