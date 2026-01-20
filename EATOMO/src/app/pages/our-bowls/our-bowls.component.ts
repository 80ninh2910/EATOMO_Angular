import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { BowlService } from '../../services/bowl.service';
import { Bowl, CartItem } from '../../models/bowl.model';

@Component({
  selector: 'app-our-bowls',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  templateUrl: './our-bowls.component.html',
  styleUrl: './our-bowls.component.css'
})
export class OurBowlsComponent implements OnInit {
  activeFilter: string = 'all';
  showModal = false;
  allBowls: Bowl[] = [];
  cartItems: CartItem[] = [];
  
  filters = [
    { value: 'all', label: 'All' },
    { value: 'low-cal', label: 'Low calories' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'high-protein', label: 'High protein' },
    { value: 'vegetarian', label: 'Vegetarian' }
  ];

  constructor(
    private bowlService: BowlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bowlService.getBowls().subscribe(bowls => {
      this.allBowls = bowls;
    });
    this.loadCart();
  }

  filterBowls(category: string): void {
    this.activeFilter = category;
  }

  shouldShowCategory(category: string): boolean {
    return this.activeFilter === 'all' || this.activeFilter === category;
  }

  getLowCalBowls(): Bowl[] {
    return this.allBowls.filter(bowl => bowl.category === 'low-cal');
  }

  getBalancedBowls(): Bowl[] {
    return this.allBowls.filter(bowl => bowl.category === 'balanced');
  }

  getHighProteinBowls(): Bowl[] {
    return this.allBowls.filter(bowl => bowl.category === 'high-protein');
  }

  getVegetarianBowls(): Bowl[] {
    return this.allBowls.filter(bowl => bowl.category === 'vegetarian');
  }

  onBowlClick(bowl: Bowl): void {
    console.log('Bowl clicked:', bowl.name);
  }

  addToBag(bowl: Bowl, event: Event): void {
    event.stopPropagation();
    
    const existingItem = this.cartItems.find(item => item.id === bowl.id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cartItems.push({
        id: bowl.id,
        name: bowl.name,
        price: bowl.price,
        quantity: 1,
        image: bowl.image
      });
    }
    
    this.saveCart();
    this.showModal = true;
  }

  removeFromCart(index: number): void {
    this.cartItems.splice(index, 1);
    this.saveCart();
  }

  closeModal(): void {
    this.showModal = false;
  }

  viewCart(): void {
    this.showModal = false;
    this.router.navigate(['/orders']);
  }

  viewFullMenu(event: Event): void {
    event.preventDefault();
    this.activeFilter = 'all';
  }

  downloadRecipe(bowlId: string, event: Event): void {
    event.stopPropagation();
    console.log('Downloading recipe for bowl:', bowlId);
    // Sau này: Implement download recipe functionality
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  private loadCart(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
    }
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }
}
