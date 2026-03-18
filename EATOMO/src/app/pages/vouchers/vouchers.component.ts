import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
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

  // State
  vouchers        = signal<Promotion[]>([]);
  isLoading       = signal(true);
  loadError       = signal('');
  searchText      = signal('');
  activeFilter    = signal<'all' | 'percentage' | 'fixed' | 'new_customer' | 'vip'>('all');
  copiedCode      = signal<string | null>(null);

  filters = [
    { value: 'all'          as const, label: 'Tất cả' },
    { value: 'percentage'   as const, label: 'Giảm %' },
    { value: 'fixed'        as const, label: 'Giảm tiền' },
    { value: 'new_customer' as const, label: 'Khách mới' },
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

    this.promotionService.getActiveVouchers().subscribe({
      next: (data) => {
        this.vouchers.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Không thể tải danh sách voucher. Vui lòng thử lại.');
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

  // ─── Display helpers ───

  /** "GIẢM 15%" hoặc "GIẢM 50.000₫" */
  discountLabel(v: Promotion): string {
    if (v.discountType === 'percentage') {
      return `GIẢM ${v.discountValue}%`;
    }
    return `GIẢM ${v.discountValue.toLocaleString('vi-VN')}₫`;
  }

  /** Ngày hết hạn dạng "HẾT HẠN 31/12/2025" hoặc "KHÔNG GIỚI HẠN" */
  validityLabel(v: Promotion): string {
    if (!v.validUntil) return 'KHÔNG GIỚI HẠN THỜI GIAN';
    const d = new Date(v.validUntil);
    return `HẾT HẠN ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  }

  /** Điều kiện tóm tắt từ DB fields */
  conditionLines(v: Promotion): string[] {
    const lines: string[] = [];
    if (v.minOrderValue > 0) {
      lines.push(`Đơn tối thiểu ${v.minOrderValue.toLocaleString('vi-VN')}₫`);
    }
    if (v.maxDiscountAmount) {
      lines.push(`Giảm tối đa ${v.maxDiscountAmount.toLocaleString('vi-VN')}₫`);
    }
    if (v.description) {
      lines.push(v.description);
    }
    if (lines.length === 0) lines.push('Áp dụng toàn bộ thực đơn');
    lines.push('Không cộng dồn với các ưu đãi khác');
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
    if (v.target === 'new_customer') return 'Khách mới';
    if (v.target === 'vip')          return 'VIP';
    return 'Tất cả';
  }

  tagClass(v: Promotion): string {
    if (v.target === 'new_customer') return 'tag-new_customer';
    if (v.target === 'vip')          return 'tag-vip';
    return 'tag-all';
  }
}
