import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { BowlService } from '../../services/bowl.service';
import { CartService } from '../../services/cart.service';
import { Bowl } from '../../models/bowl.model';

@Component({
  selector: 'app-our-bowls',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  templateUrl: './our-bowls.component.html',
  styleUrl: './our-bowls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OurBowlsComponent implements OnInit {
  activeFilter = signal<string>('all');
  showModal = signal(false);
  allBowls = signal<Bowl[]>([]);
  isLoading = signal(true);
  loadError = signal('');
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  focusedBowlId = signal('');

  filters = [
    { value: 'all', label: 'All' },
    { value: 'low-cal', label: 'Low calories' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'high-protein', label: 'High protein' },
    { value: 'vegetarian', label: 'Vegetarian' }
  ];

  lowCalBowls = computed(() => this.allBowls().filter(b => b.category === 'low-cal'));
  balancedBowls = computed(() => this.allBowls().filter(b => b.category === 'balanced'));
  highProteinBowls = computed(() => this.allBowls().filter(b => b.category === 'high-protein'));
  vegetarianBowls = computed(() => this.allBowls().filter(b => b.category === 'vegetarian'));

  showLowCal = computed(() => this.activeFilter() === 'all' || this.activeFilter() === 'low-cal');
  showBalanced = computed(() => this.activeFilter() === 'all' || this.activeFilter() === 'balanced');
  showHighProtein = computed(() => this.activeFilter() === 'all' || this.activeFilter() === 'high-protein');
  showVegetarian = computed(() => this.activeFilter() === 'all' || this.activeFilter() === 'vegetarian');

  constructor(
    private bowlService: BowlService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const category = params.get('category');
      const bowlId = params.get('bowlId');

      if (category) {
        const isValid = this.filters.some((f) => f.value === category);
        this.activeFilter.set(isValid ? category : 'all');
      }

      if (bowlId) {
        this.focusedBowlId.set(bowlId);
        this.focusBowlCardWhenReady(bowlId);
      }
    });

    this.bowlService.getBowls().subscribe({
      next: (bowls) => {
        this.allBowls.set(bowls);
        this.isLoading.set(false);

        const targetId = this.focusedBowlId();
        if (targetId) {
          this.focusBowlCardWhenReady(targetId);
        }
      },
      error: (err) => {
        this.loadError.set('Failed to load bowls. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  filterBowls(category: string): void {
    this.activeFilter.set(category);
  }

  onBowlClick(bowl: Bowl): void {}

  addToBag(bowl: Bowl, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart({
      id: bowl.id,
      name: bowl.name,
      price: bowl.price,
      quantity: 1,
      image: bowl.image
    });
    this.showModal.set(true);
  }

  removeFromCart(index: number): void {
    const items = this.cartService.cartItems();
    if (items[index]) {
      this.cartService.removeFromCart(items[index].id);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  viewCart(): void {
    this.showModal.set(false);
    this.router.navigate(['/orders']);
  }

  viewFullMenu(event: Event): void {
    event.preventDefault();
    this.activeFilter.set('all');
  }

  downloadRecipe(bowlId: string, event: Event): void {
    event.stopPropagation();
    this.showToast('Recipe download coming soon!', 'success');
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  reloadBowls(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.ngOnInit();
  }

  isFocusedBowl(bowlId: string): boolean {
    return this.focusedBowlId() === bowlId;
  }

  private focusBowlCardWhenReady(bowlId: string): void {
    if (typeof document === 'undefined') return;

    setTimeout(() => {
      const target = document.getElementById(`bowl-${bowlId}`);
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('chatbot-target-pulse');
      setTimeout(() => target.classList.remove('chatbot-target-pulse'), 1800);
    }, 120);
  }

  // Delegate to CartService signals
  get cartItems() { return this.cartService.cartItems(); }
  get totalItems(): number { return this.cartService.totalItems(); }
  get totalPrice(): number { return this.cartService.totalPrice(); }
}
