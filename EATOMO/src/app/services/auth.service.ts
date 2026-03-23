import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  token = this.tokenSignal.asReadonly();

  // URL để redirect sau khi login
  private redirectUrl: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Đăng nhập → POST /api/auth/login
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Đăng ký → POST /api/auth/register
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, data).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Lấy profile → GET /api/auth/profile
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/profile`);
  }

  /**
   * Đăng xuất — xóa token + user, navigate về home
   */
  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
    }
    this.router.navigate(['/login']);
  }

  /**
   * Kiểm tra đăng nhập
   */
  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null && this.tokenSignal() !== null;
  }

  /**
   * Kiểm tra admin
   */
  isAdmin(): boolean {
    return this.currentUserSignal()?.role === 'admin';
  }

  /**
   * Lấy user hiện tại
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Lấy token hiện tại (dùng trong interceptor)
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Lưu redirect URL
   */
  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  /**
   * Lấy và xóa redirect URL
   */
  getRedirectUrl(): string {
    const url = this.redirectUrl || '/';
    this.redirectUrl = null;
    return url;
  }

  /**
   * Validate token còn hợp lệ không — gọi khi app khởi tạo
   */
  validateToken(): Observable<boolean> {
    if (!this.tokenSignal()) {
      return of(false);
    }
    return this.getProfile().pipe(
      tap(user => this.currentUserSignal.set(user)),
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  // ───────── Private ─────────

  private setSession(response: AuthResponse): void {
    this.currentUserSignal.set(response.user);
    this.tokenSignal.set(response.access_token);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('currentUser');

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUserSignal.set(user);
        this.tokenSignal.set(token);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
      }
    }
  }
}
