import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal để theo dõi trạng thái đăng nhập
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();

  constructor(private router: Router) {
    // Khôi phục session từ localStorage khi khởi tạo
    this.loadUserFromStorage();
  }

  /**
   * Đăng nhập - Chuẩn bị cho backend integration
   * TODO: Thay thế mock login bằng HTTP call tới backend API
   */
  login(credentials: LoginCredentials, isAdmin: boolean = false): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      // Giả lập API call delay
      setTimeout(() => {
        // Mock validation - Sau này thay bằng HTTP request
        if (!credentials.username || !credentials.password) {
          resolve({ success: false, message: 'Please fill in all fields' });
          return;
        }

        // Mock login success
        const mockUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          role: isAdmin ? 'admin' : 'user'
        };

        // Lưu user vào signal và localStorage
        this.currentUserSignal.set(mockUser);
        localStorage.setItem('currentUser', JSON.stringify(mockUser));

        resolve({ success: true, message: 'Login successful' });
      }, 500);
    });
  }

  /**
   * Đăng ký - Chuẩn bị cho backend integration
   * TODO: Thay thế mock register bằng HTTP POST tới /api/register
   */
  register(data: RegisterData): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validation
        if (!data.username || !data.email || !data.password) {
          resolve({ success: false, message: 'Please fill in all fields' });
          return;
        }

        if (!data.email.includes('@')) {
          resolve({ success: false, message: 'Invalid email format' });
          return;
        }

        if (data.password.length < 6) {
          resolve({ success: false, message: 'Password must be at least 6 characters' });
          return;
        }

        // Mock successful registration
        // TODO: Gửi data tới backend API: POST /api/register
        console.log('Registration data to send to backend:', data);

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          username: data.username,
          email: data.email,
          role: 'user'
        };

        // Auto login sau khi đăng ký thành công
        this.currentUserSignal.set(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        resolve({ success: true, message: 'Registration successful! Welcome to EATOMO.' });
      }, 500);
    });
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }

  /**
   * Kiểm tra xem user có đăng nhập hay không
   */
  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  /**
   * Kiểm tra xem user có phải admin không
   */
  isAdmin(): boolean {
    return this.currentUserSignal()?.role === 'admin';
  }

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Khôi phục user từ localStorage khi refresh page
   */
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUserSignal.set(user);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }
}
