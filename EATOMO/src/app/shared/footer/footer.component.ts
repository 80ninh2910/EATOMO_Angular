import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  socialLinks = [
    { icon: 'fab fa-facebook-f', url: '#', label: 'Facebook' },
    { icon: 'fab fa-instagram', url: '#', label: 'Instagram' },
    { icon: 'fab fa-twitter', url: '#', label: 'Twitter' }
  ];

  quickLinks = [
    { label: 'Home', route: '/' },
    { label: 'Our Bowls', route: '/our-bowls' },
    { label: 'About Us', route: '/about-us' },
    { label: 'Stores', route: '/stores' },
    { label: 'FAQs', route: '/faqs' }
  ];
}
