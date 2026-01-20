import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isScrolled = false;
  isHomePage = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if on home page
    this.updateHomePageStatus();
    this.router.events.subscribe(() => {
      this.updateHomePageStatus();
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private updateHomePageStatus(): void {
    this.isHomePage = this.router.url === '/' || this.router.url === '/index';
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.pageYOffset > 100;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onLogoClick(): void {
    if (this.isHomePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.router.navigate(['/']);
    }
  }
}
