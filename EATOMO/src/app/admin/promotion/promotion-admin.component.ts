import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { Promotion, CreatePromotionRequest, DiscountType, PromotionTarget } from '../../models/promotion.model';

interface PromotionForm {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  target: PromotionTarget;
}

@Component({
  selector: 'app-promotion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './promotion-admin.component.html',
  styleUrl: './promotion-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionAdminComponent implements OnInit {
  private promoService = inject(PromotionService);
  private cdr = inject(ChangeDetectorRef);

  promotions: Promotion[] = [];
  isLoading = true;
  error = '';

  showModal = false;
  editMode = false;
  editingId = '';
  modalTitle = '';
  form: PromotionForm = this.emptyForm();

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.promoService.getPromotions().subscribe({
      next: (data) => {
        this.promotions = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Không thể tải promotions.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private emptyForm(): PromotionForm {
    const today = new Date().toISOString().substring(0, 10);
    return {
      code: '', description: '', discountType: 'percentage', discountValue: 10,
      minOrderValue: 0, maxDiscountAmount: 0, validFrom: today,
      validUntil: '', maxUses: 100, target: 'all'
    };
  }

  openCreate(): void {
    this.editMode = false;
    this.editingId = '';
    this.form = this.emptyForm();
    this.modalTitle = 'Tạo promotion';
    this.showModal = true;
  }

  openEdit(p: Promotion): void {
    this.editMode = true;
    this.editingId = p.id ?? (p as any)._id;
    this.form = {
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderValue: p.minOrderValue,
      maxDiscountAmount: p.maxDiscountAmount ?? 0,
      validFrom: p.validFrom ? new Date(p.validFrom).toISOString().substring(0, 10) : '',
      validUntil: p.validUntil ? new Date(p.validUntil).toISOString().substring(0, 10) : '',
      maxUses: p.maxUses,
      target: p.target
    };
    this.modalTitle = 'Sửa promotion';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveModal(): void {
    if (this.editMode) {
      this.promoService.updatePromotion(this.editingId, {
        description: this.form.description,
        discountType: this.form.discountType,
        discountValue: this.form.discountValue,
        minOrderValue: this.form.minOrderValue,
        maxDiscountAmount: this.form.maxDiscountAmount || undefined,
        validFrom: this.form.validFrom,
        validUntil: this.form.validUntil || undefined,
        maxUses: this.form.maxUses,
        target: this.form.target
      }).subscribe({
        next: (updated) => {
          const idx = this.promotions.findIndex(p => (p.id ?? (p as any)._id) === this.editingId);
          if (idx >= 0) this.promotions[idx] = updated;
          this.promotions = [...this.promotions];
          this.showModal = false;
          this.cdr.markForCheck();
        },
        error: (err) => { console.error(err); alert('Cập nhật thất bại.'); }
      });
    } else {
      const payload: CreatePromotionRequest = {
        code: this.form.code.toUpperCase(),
        description: this.form.description,
        discountType: this.form.discountType,
        discountValue: this.form.discountValue,
        minOrderValue: this.form.minOrderValue,
        maxDiscountAmount: this.form.maxDiscountAmount || undefined,
        validFrom: this.form.validFrom,
        validUntil: this.form.validUntil || undefined,
        maxUses: this.form.maxUses,
        target: this.form.target
      };
      this.promoService.createPromotion(payload).subscribe({
        next: (created) => {
          this.promotions = [...this.promotions, created];
          this.showModal = false;
          this.cdr.markForCheck();
        },
        error: (err) => { console.error(err); alert('Tạo promotion thất bại.'); }
      });
    }
  }

  deletePromotion(p: Promotion): void {
    const id = p.id ?? (p as any)._id;
    if (!confirm(`Xóa promotion "${p.code}"?`)) return;
    this.promoService.deletePromotion(id).subscribe({
      next: () => {
        this.promotions = this.promotions.filter(x => (x.id ?? (x as any)._id) !== id);
        this.cdr.markForCheck();
      },
      error: (err) => { console.error(err); alert('Xóa thất bại.'); }
    });
  }

  toggleActive(p: Promotion): void {
    const id = p.id ?? (p as any)._id;
    this.promoService.toggleActive(id).subscribe({
      next: (updated) => {
        const idx = this.promotions.findIndex(x => (x.id ?? (x as any)._id) === id);
        if (idx >= 0) this.promotions[idx] = updated;
        this.promotions = [...this.promotions];
        this.cdr.markForCheck();
      },
      error: (err) => { console.error(err); alert('Toggle thất bại.'); }
    });
  }

  formatDiscount(p: Promotion): string {
    return p.discountType === 'percentage' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('vi-VN')} đ`;
  }

  trackById(_: number, p: Promotion): string {
    return p.id ?? (p as any)._id;
  }
}

