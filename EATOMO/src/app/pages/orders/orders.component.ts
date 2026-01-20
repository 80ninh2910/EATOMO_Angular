import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit {
  cart: any[] = [];
  customerName = '';
  customerPhone = '';
  customerAddress = '';
  paymentMethod = 'cash';

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    if (typeof localStorage !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
    }
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(this.cart));
    }
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity > 0) {
      this.cart[index].quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(this.cart));
    }
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  }

  get tax(): number {
    return this.subtotal * 0.1; // 10% tax
  }

  get shippingFee(): number {
    return this.subtotal > 500000 ? 0 : 30000;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shippingFee;
  }

  checkout(): void {
    if (!this.customerName || !this.customerPhone || !this.customerAddress) {
      alert('Please fill in all customer information!');
      return;
    }

    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Simulate checkout
    alert('Order placed successfully! Thank you for your purchase.');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cart');
    }
    this.cart = [];
  }

  continueShopping(): void {
    // Navigate back to our-bowls
    window.location.href = '/our-bowls';
  }
}
