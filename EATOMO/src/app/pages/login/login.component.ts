import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  adminUsername = '';
  adminPassword = '';
  userUsername = '';
  userPassword = '';

  constructor(private router: Router) {}

  onAdminLogin(): void {
    console.log('Admin login:', this.adminUsername);
    // Mock login - redirect to home
    if (this.adminUsername && this.adminPassword) {
      this.router.navigate(['/']);
    }
  }

  onUserLogin(): void {
    console.log('User login:', this.userUsername);
    // Mock login - redirect to home
    if (this.userUsername && this.userPassword) {
      this.router.navigate(['/']);
    }
  }
}
