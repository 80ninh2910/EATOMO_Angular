import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  // Thêm các thuộc tính khác tùy theo món ăn
  proteins?: string[];
  veggies?: string[];
  sauces?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signal để quản lý giỏ hàng
  private cartItemsSignal = signal<CartItem[]>([]);
  
  // Readonly signal để expose ra ngoài
  cartItems = this.cartItemsSignal.asReadonly();
  
  // Computed signals
  totalItems = computed(() => {
    return this.cartItemsSignal().reduce((sum, item) => sum + item.quantity, 0);
  });
  
  totalPrice = computed(() => {
    return this.cartItemsSignal().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  constructor() {
    // Load cart từ localStorage khi khởi tạo (chỉ trên browser)
    this.loadCart();
  }

  /**
   * Thêm món vào giỏ hàng
   */
  addToCart(item: CartItem): void {
    const currentCart = [...this.cartItemsSignal()];
    const existingItemIndex = currentCart.findIndex(i => i.id === item.id);

    if (existingItemIndex >= 0) {
      // Món đã có trong giỏ, tăng số lượng
      currentCart[existingItemIndex].quantity += item.quantity;
    } else {
      // Món mới, thêm vào giỏ
      currentCart.push(item);
    }

    this.cartItemsSignal.set(currentCart);
    this.saveCart();
  }

  /**
   * Xóa món khỏi giỏ hàng
   */
  removeFromCart(itemId: string): void {
    const currentCart = this.cartItemsSignal().filter(item => item.id !== itemId);
    this.cartItemsSignal.set(currentCart);
    this.saveCart();
  }

  /**
   * Update số lượng món
   */
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const currentCart = [...this.cartItemsSignal()];
    const itemIndex = currentCart.findIndex(i => i.id === itemId);

    if (itemIndex >= 0) {
      currentCart[itemIndex].quantity = quantity;
      this.cartItemsSignal.set(currentCart);
      this.saveCart();
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  clearCart(): void {
    this.cartItemsSignal.set([]);
    this.saveCart();
  }

  /**
   * Lưu giỏ hàng vào localStorage
   */
  private saveCart(): void {
    if (!this.isBrowser) return;
    localStorage.setItem('cart', JSON.stringify(this.cartItemsSignal()));
  }

  /**
   * Load giỏ hàng từ localStorage
   */
  private loadCart(): void {
    if (!this.isBrowser) return;

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart) as CartItem[];
        this.cartItemsSignal.set(cart);
      } catch (error) {
        console.error('Failed to parse cart:', error);
        localStorage.removeItem('cart');
      }
    }
  }

  /**
   * Kiểm tra giỏ hàng có trống không
   */
  isEmpty(): boolean {
    return this.cartItemsSignal().length === 0;
  }

  /**
   * Lấy số lượng của một món cụ thể
   */
  getItemQuantity(itemId: string): number {
    const item = this.cartItemsSignal().find(i => i.id === itemId);
    return item ? item.quantity : 0;
  }
}
