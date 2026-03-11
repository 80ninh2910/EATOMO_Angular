import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  // Custom validator để kiểm tra password và confirmPassword khớp nhau
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onRegister(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.registerForm.invalid) {
      this.errorMessage.set('Please fill in all fields correctly');
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Registration successful! Welcome to EATOMO.');
        // Auto redirect về home sau khi đăng ký thành công (đã auto login trong service)
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  // Getter methods để lấy validation errors
  get usernameError(): string {
    const control = this.registerForm.get('username');
    if (!control?.touched) return '';
    if (control.hasError('required')) return 'Username is required';
    if (control.hasError('minlength')) return 'Username must be at least 3 characters';
    if (control.hasError('maxlength')) return 'Username must not exceed 20 characters';
    if (control.hasError('pattern')) return 'Username can only contain letters, numbers, and underscores';
    return '';
  }

  get emailError(): string {
    const control = this.registerForm.get('email');
    if (!control?.touched) return '';
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Please enter a valid email address';
    return '';
  }

  get passwordError(): string {
    const control = this.registerForm.get('password');
    if (!control?.touched) return '';
    if (control.hasError('required')) return 'Password is required';
    if (control.hasError('minlength')) return 'Password must be at least 6 characters';
    if (control.hasError('maxlength')) return 'Password must not exceed 50 characters';
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (!control?.touched) return '';
    if (control.hasError('required')) return 'Please confirm your password';
    if (this.registerForm.hasError('passwordMismatch') && control.value) {
      return 'Passwords do not match';
    }
    return '';
  }
}
