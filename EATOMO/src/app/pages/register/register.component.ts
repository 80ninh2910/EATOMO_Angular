import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';

  constructor(private router: Router) {}

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (!this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid email';
      return;
    }

    // Mock registration
    console.log('Registering user:', this.username, this.email);
    this.successMessage = 'Registration successful! Redirecting to login...';
    
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
