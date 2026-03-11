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
    { icon: 'fab fa-facebook-f', url: 'https://www.facebook.com/eatomo.vietnam', label: 'Facebook' },
    { icon: 'fab fa-instagram', url: 'https://www.instagram.com/eatomo_vietnam', label: 'Instagram' },
    { icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@eatomo_vietnam', label: 'TikTok' }
  ];

  quickLinks = [
    { label: 'Home', route: '/' },
    { label: 'Our Bowls', route: '/our-bowls' },
    { label: 'About Us', route: '/about-us' },
    { label: 'Stores', route: '/stores' },
    { label: 'FAQs', route: '/faqs' }
  ];
}
