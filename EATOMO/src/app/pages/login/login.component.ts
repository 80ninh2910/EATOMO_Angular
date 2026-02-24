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
    private authService: AuthService, // giữ nguyên, không dùng
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
  async onUserLogin() {
    if (this.userForm.invalid) {
      this.userError.set('Please fill in all fields correctly');
      return;
    }

    const { username, password } = this.userForm.value;

    if (username === 'user' && password === 'user123') {
      this.userError.set('');
      this.router.navigate(['/']); // 🔁 đổi route nếu muốn
      return;
    }

    this.userError.set('Invalid username or password');
  }

  /* ================= ADMIN LOGIN ================= */
  async onAdminLogin() {
    if (this.adminForm.invalid) {
      this.adminError.set('Please fill in all fields correctly');
      return;
    }

    const { username, password } = this.adminForm.value;

    if (username === 'admin' && password === 'admin123') {
      this.adminError.set('');
      this.router.navigate(['/admin']); // 🔁 đổi route nếu muốn
      return;
    }

    this.adminError.set('Invalid admin username or password');
  }
}
