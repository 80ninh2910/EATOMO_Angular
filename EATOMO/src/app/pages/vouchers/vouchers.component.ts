import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { CartService } from '../../services/cart.service';
import { CheckoutVoucherService } from '../../services/checkout-voucher.service';
import { PromotionService } from '../../services/promotion.service';
import { Promotion } from '../../models/promotion.model';

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './vouchers.component.html',
  styleUrl: './vouchers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VouchersComponent implements OnInit {

  private promotionService = inject(PromotionService);
  private cartService = inject(CartService);
  private checkoutVoucherService = inject(CheckoutVoucherService);
  private router = inject(Router);

  // State
  vouchers        = signal<Promotion[]>([]);
  isLoading       = signal(true);
  loadError       = signal('');
  searchText      = signal('');
  activeFilter    = signal<'all' | 'percentage' | 'fixed' | 'new_customer' | 'vip'>('all');
  copiedCode      = signal<string | null>(null);
  selectionNotice = signal<{ type: 'error' | 'info'; text: string } | null>(null);
  currentOrderSubtotal = computed(() => this.cartService.totalPrice());
  hasOrderContext = computed(() => this.currentOrderSubtotal() > 0);

  filters = [
    { value: 'all'          as const, label: 'All' },
    { value: 'percentage'   as const, label: '% Off' },
    { value: 'fixed'        as const, label: 'Amount Off' },
    { value: 'new_customer' as const, label: 'New Customer' },
    { value: 'vip'          as const, label: 'VIP' },
  ];

  // Computed: filter + search
  filteredVouchers = computed(() => {
    const filter = this.activeFilter();
    const search = this.searchText().toLowerCase();
    return this.vouchers().filter(v => {
      const matchFilter =
        filter === 'all' ||
        v.discountType === filter ||
        v.target === filter;
      const matchSearch =
        !search ||
        v.code.toLowerCase().includes(search) ||
        (v.description || '').toLowerCase().includes(search);
      return matchFilter && matchSearch;
    });
  });

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.promotionService.getAllVouchers().subscribe({
      next: (data) => {
        this.vouchers.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load vouchers. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  setFilter(f: typeof this.activeFilter extends ReturnType<typeof signal<infer T>> ? T : never): void {
    this.activeFilter.set(f as any);
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).catch(() => {});
    this.copiedCode.set(code);
    setTimeout(() => this.copiedCode.set(null), 2000);
  }

  goBackToCheckout(): void {
    this.router.navigate(['/orders']);
  }

  handleVoucherAction(v: Promotion): void {
    this.selectionNotice.set(null);

    if (!this.hasOrderContext()) {
      if (this.canCopyVoucher(v)) {
        this.copyCode(v.code);
        return;
      }

      this.selectionNotice.set({
        type: 'error',
        text: `Voucher ${v.code} is currently ${this.voucherStatusLabel(v).toLowerCase()}.`
      });
      return;
    }

    if (this.canApplyToCurrentOrder(v)) {
      this.checkoutVoucherService.setPendingVoucherCode(v.code);
      this.router.navigate(['/orders']);
      return;
    }

    this.selectionNotice.set({
      type: 'error',
      text: this.orderCompatibilityMessage(v)
    });
  }

  actionLabel(v: Promotion): string {
    if (this.hasOrderContext()) {
      return this.canApplyToCurrentOrder(v) ? 'USE AND RETURN' : 'SEE WHY';
    }

    if (!canUseOnCatalog(v)) {
      return 'UNAVAILABLE';
    }

    return this.copiedCode() === v.code ? 'COPIED' : 'USE';
  }

  isActionDisabled(v: Promotion): boolean {
    return !this.hasOrderContext() && !this.canCopyVoucher(v);
  }

  orderCompatibilityLabel(v: Promotion): string {
    if (!this.hasOrderContext()) return '';

    if (this.canApplyToCurrentOrder(v)) {
      const discount = this.estimatedDiscount(v);
      return discount > 0
        ? `Fits this order, estimated savings ${discount.toLocaleString('vi-VN')}₫`
        : 'Fits this order';
    }

    return this.orderCompatibilityMessage(v);
  }

  orderCompatibilityClass(v: Promotion): string {
    if (!this.hasOrderContext()) return '';
    return this.canApplyToCurrentOrder(v) ? 'fit-ok' : 'fit-bad';
  }

  // ─── Display helpers ───

  /** "GIẢM 15%" hoặc "GIẢM 50.000₫" */
  discountLabel(v: Promotion): string {
    if (v.discountType === 'percentage') {
      return `${v.discountValue}% OFF`;
    }
    return `${v.discountValue.toLocaleString('vi-VN')}₫ OFF`;
  }

  /** Ngày hết hạn dạng "HẾT HẠN 31/12/2025" hoặc "KHÔNG GIỚI HẠN" */
  validityLabel(v: Promotion): string {
    if (!v.validUntil) return 'NO EXPIRATION DATE';
    const d = new Date(v.validUntil);
    return `EXPIRES ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  }

  voucherStatusLabel(v: Promotion): string {
    const status = this.getVoucherStatus(v);
    if (status === 'active') return 'Active';
    if (status === 'upcoming') return 'Not Started Yet';
    if (status === 'expired') return 'Expired';
    if (status === 'used_up') return 'Fully Redeemed';
    return 'Inactive';
  }

  voucherStatusClass(v: Promotion): string {
    return `status-${this.getVoucherStatus(v)}`;
  }

  canCopyVoucher(v: Promotion): boolean {
    return this.getVoucherStatus(v) === 'active';
  }

  canApplyToCurrentOrder(v: Promotion): boolean {
    return this.hasOrderContext() && this.getVoucherStatus(v) === 'active' && this.currentOrderSubtotal() >= v.minOrderValue;
  }

  /** Điều kiện tóm tắt từ DB fields */
  conditionLines(v: Promotion): string[] {
    const lines: string[] = [];
    if (v.minOrderValue > 0) {
      lines.push(`Minimum order ${v.minOrderValue.toLocaleString('vi-VN')}₫`);
    }
    if (v.maxDiscountAmount) {
      lines.push(`Maximum discount ${v.maxDiscountAmount.toLocaleString('vi-VN')}₫`);
    }
    if (v.description) {
      lines.push(v.description);
    }
    if (lines.length === 0) lines.push('Applies to the full menu');
    lines.push('Cannot be combined with other offers');
    return lines;
  }

  /** Màu theme theo target */
  themeClass(v: Promotion): string {
    if (v.target === 'new_customer') return 'theme-purple';
    if (v.target === 'vip')         return 'theme-gold';
    if (v.discountType === 'fixed') return 'theme-teal';
    return 'theme-green';
  }

  /** Label badge */
  targetLabel(v: Promotion): string {
    if (v.target === 'new_customer') return 'New Customer';
    if (v.target === 'vip')          return 'VIP';
    return 'All Customers';
  }

  tagClass(v: Promotion): string {
    if (v.target === 'new_customer') return 'tag-new_customer';
    if (v.target === 'vip')          return 'tag-vip';
    return 'tag-all';
  }

  private estimatedDiscount(v: Promotion): number {
    return Math.round(this.promotionService.calculateDiscount({
      valid: true,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscountAmount: v.maxDiscountAmount,
      minOrderValue: v.minOrderValue,
      message: ''
    }, this.currentOrderSubtotal()));
  }

  private orderCompatibilityMessage(v: Promotion): string {
    const status = this.getVoucherStatus(v);
    if (status !== 'active') {
      return `Voucher ${v.code} is currently ${this.voucherStatusLabel(v).toLowerCase()}. Please choose another voucher.`;
    }

    const remaining = Math.max(0, v.minOrderValue - this.currentOrderSubtotal());
    if (remaining > 0) {
      return `Your current order needs ${remaining.toLocaleString('vi-VN')}₫ more to use voucher ${v.code}.`;
    }

    return `Voucher ${v.code} does not fit the current order yet.`;
  }

  private getVoucherStatus(v: Promotion): 'active' | 'upcoming' | 'expired' | 'used_up' | 'inactive' {
    const now = new Date();

    if (!v.isActive) return 'inactive';
    if (v.validFrom && new Date(v.validFrom) > now) return 'upcoming';
    if (v.validUntil && new Date(v.validUntil) < now) return 'expired';
    if (v.currentUses >= v.maxUses) return 'used_up';

    return 'active';
  }
}

function canUseOnCatalog(v: Promotion): boolean {
  const now = new Date();
  if (!v.isActive) return false;
  if (v.validFrom && new Date(v.validFrom) > now) return false;
  if (v.validUntil && new Date(v.validUntil) < now) return false;
  if (v.currentUses >= v.maxUses) return false;
  return true;
}
