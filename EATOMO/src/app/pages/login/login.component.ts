import { Component, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type LoginMode = 'user' | 'admin';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  userForm: FormGroup;
  adminForm: FormGroup;

  mode = signal<LoginMode>('user');

  userError = signal('');
  adminError = signal('');
  userSuccess = signal('');   // THÊM DÒNG NÀY
  adminSuccess = signal('');  // THÊM DÒNG NÀY
  userLoading = signal(false);
  adminLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef // <--- THÊM KHAI BÁO NÀY ĐỂ ÉP CẬP NHẬT GIAO DIỆN
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.adminForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  switchToAdmin() {
    this.mode.set('admin');
    this.userError.set('');
    this.userSuccess.set(''); // THÊM DÒNG NÀY
    this.userForm.reset();
  }

  switchToUser() {
    this.mode.set('user');
    this.adminError.set('');
    this.adminSuccess.set(''); // THÊM DÒNG NÀY
    this.adminForm.reset();
  }

  /* ================= USER LOGIN ================= */
  onUserLogin() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched(); // <--- THÊM DÒNG NÀY ĐỂ TÔ ĐỎ HẾT CÁC Ô TRỐNG
      this.userError.set('Please fill in all fields correctly');
      this.cdr.markForCheck(); // <--- ÉP ANGULAR HIỆN VIỀN ĐỎ NGAY LẬP TỨC
      return;
    }

    this.userLoading.set(true);
    this.userError.set('');

    const { username, password } = this.userForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        this.userLoading.set(false);
        this.userSuccess.set('Login successful! Redirecting...'); // Bật thông báo
        
        // Cài đồng hồ đếm ngược 1.5s rồi mới nhảy trang
        setTimeout(() => {
          if (response.user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            const redirectUrl = this.authService.getRedirectUrl();
            this.router.navigate([redirectUrl]);
          }
        }, 1500);
      },
      error: (err) => {
        this.userLoading.set(false);
        this.userError.set(err.error?.message || 'Invalid username or password');
        this.cdr.markForCheck();
        }
    });
  }

  /* ================= ADMIN LOGIN ================= */
  onAdminLogin() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched(); // <--- THÊM DÒNG NÀY CHO ADMIN LUÔN
      this.adminError.set('Please fill in all fields correctly');
      this.cdr.markForCheck(); // <--- ÉP ANGULAR HIỆN VIỀN ĐỎ CHO ADMIN NGAY LẬP TỨC
      return;
    }

    this.adminLoading.set(true);
    this.adminError.set('');

    const { username, password } = this.adminForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        this.adminLoading.set(false);
        if (response.user.role === 'admin') {
          this.adminSuccess.set('Admin login successful! Redirecting...'); // Bật thông báo
          
          // Delay 1.5s
          setTimeout(() => {
            this.router.navigate(['/admin']);
          }, 1500);
        } else {
          this.adminError.set('This account does not have admin privileges');
          this.authService.logout();
        }
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminError.set(err.error?.message || 'Invalid admin username or password');
        this.cdr.markForCheck();
      }
    });
  }
}
