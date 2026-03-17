import { Component, OnInit, OnDestroy, HostListener, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ChatbotWidgetComponent } from '../chatbot/chatbot-widget.component';

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
  readonly chatbotWidgetComponent = ChatbotWidgetComponent;

  authService = inject(AuthService);
  cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateHomePageStatus();
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateHomePageStatus());
  }

  ngOnDestroy(): void {}

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

  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }
}
