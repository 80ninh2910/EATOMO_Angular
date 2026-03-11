import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
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
  userLoading = signal(false);
  adminLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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
    this.userForm.reset();
  }

  switchToUser() {
    this.mode.set('user');
    this.adminError.set('');
    this.adminForm.reset();
  }

  /* ================= USER LOGIN ================= */
  onUserLogin() {
    if (this.userForm.invalid) {
      this.userError.set('Please fill in all fields correctly');
      return;
    }

    this.userLoading.set(true);
    this.userError.set('');

    const { username, password } = this.userForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        this.userLoading.set(false);
        if (response.user.role === 'admin') {
          // Nếu admin đăng nhập ở tab user → redirect admin
          this.router.navigate(['/admin']);
        } else {
          const redirectUrl = this.authService.getRedirectUrl();
          this.router.navigate([redirectUrl]);
        }
      },
      error: (err) => {
        this.userLoading.set(false);
        this.userError.set(err.error?.message || 'Invalid username or password');
      }
    });
  }

  /* ================= ADMIN LOGIN ================= */
  onAdminLogin() {
    if (this.adminForm.invalid) {
      this.adminError.set('Please fill in all fields correctly');
      return;
    }

    this.adminLoading.set(true);
    this.adminError.set('');

    const { username, password } = this.adminForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        this.adminLoading.set(false);
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.adminError.set('This account does not have admin privileges');
          this.authService.logout();
        }
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminError.set(err.error?.message || 'Invalid admin username or password');
      }
    });
  }
}
