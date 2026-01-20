import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  adminForm: FormGroup;
  userForm: FormGroup;
  
  adminError = signal<string>('');
  userError = signal<string>('');
  adminLoading = signal<boolean>(false);
  userLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Admin form với validation
    this.adminForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // User form với validation
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onAdminLogin(): Promise<void> {
    this.adminError.set('');
    
    if (this.adminForm.invalid) {
      this.adminError.set('Please fill in all fields correctly');
      return;
    }

    this.adminLoading.set(true);
    
    try {
      const result = await this.authService.login(this.adminForm.value, true);
      
      if (result.success) {
        // Redirect tới admin dashboard (hoặc trang chủ nếu chưa có admin page)
        this.router.navigate(['/']);
      } else {
        this.adminError.set(result.message);
      }
    } catch (error) {
      this.adminError.set('Login failed. Please try again.');
    } finally {
      this.adminLoading.set(false);
    }
  }

  async onUserLogin(): Promise<void> {
    this.userError.set('');
    
    if (this.userForm.invalid) {
      this.userError.set('Please fill in all fields correctly');
      return;
    }

    this.userLoading.set(true);
    
    try {
      const result = await this.authService.login(this.userForm.value, false);
      
      if (result.success) {
        this.router.navigate(['/']);
      } else {
        this.userError.set(result.message);
      }
    } catch (error) {
      this.userError.set('Login failed. Please try again.');
    } finally {
      this.userLoading.set(false);
    }
  }

  // Getter methods để kiểm tra validation errors
  get adminUsernameError(): string {
    const control = this.adminForm.get('username');
    if (control?.hasError('required') && control.touched) return 'Username is required';
    if (control?.hasError('minlength')) return 'Username must be at least 3 characters';
    return '';
  }

  get adminPasswordError(): string {
    const control = this.adminForm.get('password');
    if (control?.hasError('required') && control.touched) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  get userUsernameError(): string {
    const control = this.userForm.get('username');
    if (control?.hasError('required') && control.touched) return 'Username is required';
    if (control?.hasError('minlength')) return 'Username must be at least 3 characters';
    return '';
  }

  get userPasswordError(): string {
    const control = this.userForm.get('password');
    if (control?.hasError('required') && control.touched) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }
}
