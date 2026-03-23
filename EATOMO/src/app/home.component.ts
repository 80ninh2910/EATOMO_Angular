import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { BowlService } from './services/bowl.service';
import { Bowl } from './models/bowl.model';
import { retry, delay } from 'rxjs/operators';

interface Review {
  name: string;
  rating: number;
  comment: string;
  avatar?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private readonly bowlPrefixOrder: Record<string, number> = {
    B: 0,
    H: 1,
    L: 2,
    V: 3
  };

  activeFilter = signal('all');
  reviews = signal<Review[]>([]);
  allBowls = signal<Bowl[]>([]);
  isBowlsLoading = signal(true);
  toast = signal<{ message: string; type: 'success' | 'info' } | null>(null);

  filteredBowls = computed(() => {
    const filter = this.activeFilter();
    const bowls = this.allBowls();
    return filter === 'all' ? bowls : bowls.filter(b => b.category === filter);
  });

  ratingStars = [1, 2, 3, 4, 5];

  constructor(private http: HttpClient, private bowlService: BowlService) { }

  ngOnInit(): void {
    this.loadReviews();
    this.loadBowls();
  }

  loadReviews(): void {
    this.http.get<any>('assets/healthy/json/reviews.json')
      .subscribe({
        next: (data) => this.reviews.set(data.reviews || []),
        error: () => this.reviews.set([
          { name: 'Customer 1', rating: 5, comment: 'Amazing food and great service!' },
          { name: 'Customer 2', rating: 5, comment: 'Healthy and delicious!' }
        ])
      });
  }

  loadBowls(): void {
    // Thêm retry để xử lý vấn đề Cold Start của Render Free Tier
    this.bowlService.getBowls().pipe(
      retry({ count: 2, delay: 2000 })
    ).subscribe({
      next: (bowls) => {
        this.allBowls.set([...bowls].sort((a, b) => this.compareBowls(a, b)));
        this.isBowlsLoading.set(false);

        // Trigger legacy JS observers after Angular renders the new DOM elements
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const win = window as any;
            if (win.setupBowlObserver) win.setupBowlObserver();
            if (win.setupSectionObserver) win.setupSectionObserver();
          }
        }, 150);
      },
      error: (err) => {
        console.error('Bowl loading failed:', err);
        this.isBowlsLoading.set(false);
      }
    });
  }

  filterBowls(category: string): void {
    this.activeFilter.set(category);
  }

  downloadRecipe(bowlName: string): void {
    this.toast.set({ message: 'Recipe download coming soon!', type: 'info' });
    setTimeout(() => this.toast.set(null), 3000);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private compareBowls(a: Bowl, b: Bowl): number {
    const parsedA = this.parseBowlCode(a.id || a.name);
    const parsedB = this.parseBowlCode(b.id || b.name);

    const prefixOrderA = this.bowlPrefixOrder[parsedA.prefix] ?? Number.MAX_SAFE_INTEGER;
    const prefixOrderB = this.bowlPrefixOrder[parsedB.prefix] ?? Number.MAX_SAFE_INTEGER;

    if (prefixOrderA !== prefixOrderB) {
      return prefixOrderA - prefixOrderB;
    }

    if (parsedA.number !== parsedB.number) {
      return parsedA.number - parsedB.number;
    }

    return (a.id || a.name).localeCompare(b.id || b.name);
  }

  private parseBowlCode(value: string): { prefix: string; number: number } {
    const match = String(value || '').trim().toUpperCase().match(/^([A-Z]+)\s*(\d+)/);

    return {
      prefix: match?.[1] || '',
      number: Number(match?.[2] || Number.MAX_SAFE_INTEGER)
    };
  }
}
