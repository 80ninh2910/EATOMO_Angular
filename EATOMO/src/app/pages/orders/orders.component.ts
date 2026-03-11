import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PromotionService } from '../../services/promotion.service';
import { Order, PaymentMethod } from '../../models/order.model';
import { VoucherValidation } from '../../models/promotion.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit {
  customerName = '';
  customerPhone = '';
  customerAddress = '';
  deliveryNotes = '';
  paymentMethod: PaymentMethod = 'cash';
  voucherCode = '';

  // Signals cho UI state
  activeTab = signal<'cart' | 'history'>('cart');
  isCheckingOut = signal(false);
  checkoutError = signal('');
  checkoutSuccess = signal('');

  // Voucher state
  voucherValidation = signal<VoucherValidation | null>(null);
  isValidatingVoucher = signal(false);
  discountAmount = signal(0);

  // Order history state
  orderHistory = signal<Order[]>([]);
  isLoadingHistory = signal(false);

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private promotionService: PromotionService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  removeFromCart(itemId: string): void {
    this.cartService.removeFromCart(itemId);
  }

  updateQuantity(itemId: string, quantity: number): void {
    this.cartService.updateQuantity(itemId, quantity);
    // Recalculate discount if voucher applied
    if (this.voucherValidation()?.valid) {
      this.recalculateDiscount();
    }
  }

  get subtotal(): number {
    return this.cartService.totalPrice();
  }

  get tax(): number {
    return Math.round(this.subtotal * 0.08); // 8% VAT
  }

  get shippingFee(): number {
    return this.subtotal > 500000 ? 0 : 30000;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shippingFee - this.discountAmount();
  }

  /**
   * Validate voucher code
   */
  validateVoucher(): void {
    if (!this.voucherCode.trim()) return;

    this.isValidatingVoucher.set(true);
    this.promotionService.validateVoucher(this.voucherCode.trim()).subscribe({
      next: (result) => {
        this.voucherValidation.set(result);
        this.isValidatingVoucher.set(false);
        if (result.valid) {
          this.recalculateDiscount();
        } else {
          this.discountAmount.set(0);
        }
      },
      error: () => {
        this.voucherValidation.set({ valid: false, message: 'Failed to validate voucher' });
        this.isValidatingVoucher.set(false);
        this.discountAmount.set(0);
      }
    });
  }

  removeVoucher(): void {
    this.voucherCode = '';
    this.voucherValidation.set(null);
    this.discountAmount.set(0);
  }

  private recalculateDiscount(): void {
    const validation = this.voucherValidation();
    if (validation) {
      const discount = this.promotionService.calculateDiscount(validation, this.subtotal);
      this.discountAmount.set(Math.round(discount));
    }
  }

  /**
   * Đặt hàng — gọi OrderService
   */
  checkout(): void {
    this.checkoutError.set('');
    this.checkoutSuccess.set('');

    if (!this.customerName || !this.customerPhone || !this.customerAddress) {
      this.checkoutError.set('Please fill in all customer information!');
      return;
    }

    if (this.cartService.isEmpty()) {
      this.checkoutError.set('Your cart is empty!');
      return;
    }

    this.isCheckingOut.set(true);

    const items = this.cartService.cartItems().map(item => ({
      bowlId: item.id,
      quantity: item.quantity,
      ...(item.proteins ? { customProteins: item.proteins } : {}),
      ...(item.veggies ? { customVeggies: item.veggies } : {}),
      ...(item.sauces ? { customSauces: item.sauces } : {})
    }));

    this.orderService.createOrder({
      items,
      deliveryAddress: this.customerAddress,
      deliveryPhone: this.customerPhone,
      deliveryNotes: this.deliveryNotes || undefined,
      paymentMethod: this.paymentMethod,
      voucherCode: this.voucherCode || undefined
    }).subscribe({
      next: (order) => {
        this.isCheckingOut.set(false);
        this.checkoutSuccess.set(`Order #${order.orderNumber} placed successfully! Thank you for your purchase.`);
        this.cartService.clearCart();
        this.removeVoucher();
      },
      error: (err) => {
        this.isCheckingOut.set(false);
        this.checkoutError.set(err.error?.message || 'Checkout failed. Please try again.');
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/our-bowls']);
  }

  switchToHistory(): void {
    this.activeTab.set('history');
    this.loadOrderHistory();
  }

  loadOrderHistory(): void {
    this.isLoadingHistory.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orderHistory.set(orders);
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.orderHistory.set([]);
        this.isLoadingHistory.set(false);
      }
    });
  }

  cancelOrder(orderId: string): void {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => this.loadOrderHistory(),
      error: (err) => {
        this.checkoutError.set(err.error?.message || 'Failed to cancel order');
      }
    });
  }
}
