import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Promotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  VoucherValidation
} from '../models/promotion.model';

const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private http = inject(HttpClient);

  // ───────── Admin CRUD ─────────

  /**
   * Lấy tất cả promotions (Admin)
   */
  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${API_URL}/promotions`);
  }

  /**
   * Lấy voucher đang active — Public, không cần auth
   */
  getActiveVouchers(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${API_URL}/vouchers/active`);
  }

  /**
   * Lấy promotion theo ID
   */
  getPromotionById(id: string): Observable<Promotion> {
    return this.http.get<Promotion>(`${API_URL}/promotions/${id}`);
  }

  /**
   * Tạo promotion mới
   */
  createPromotion(data: CreatePromotionRequest): Observable<Promotion> {
    return this.http.post<Promotion>(`${API_URL}/promotions`, data);
  }

  /**
   * Cập nhật promotion
   */
  updatePromotion(id: string, data: UpdatePromotionRequest): Observable<Promotion> {
    return this.http.patch<Promotion>(`${API_URL}/promotions/${id}`, data);
  }

  /**
   * Xóa promotion
   */
  deletePromotion(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/promotions/${id}`);
  }

  /**
   * Bật/tắt promotion
   */
  toggleActive(id: string): Observable<Promotion> {
    return this.http.patch<Promotion>(`${API_URL}/promotions/${id}/toggle`, {});
  }

  // ───────── User ─────────

  /**
   * Validate mã voucher — kiểm tra hợp lệ trước khi áp dụng
   */
  validateVoucher(code: string): Observable<VoucherValidation> {
    return this.http.post<VoucherValidation>(`${API_URL}/vouchers/validate`, { code });
  }

  /**
   * Tính discount từ validation result
   */
  calculateDiscount(validation: VoucherValidation, orderTotal: number): number {
    if (!validation.valid || !validation.discountType || !validation.discountValue) {
      return 0;
    }

    let discount: number;

    if (validation.discountType === 'percentage') {
      discount = orderTotal * (validation.discountValue / 100);
      // Giới hạn max discount nếu có
      if (validation.maxDiscountAmount && discount > validation.maxDiscountAmount) {
        discount = validation.maxDiscountAmount;
      }
    } else {
      // fixed amount
      discount = validation.discountValue;
    }

    // Discount không vượt quá order total
    return Math.min(discount, orderTotal);
  }
}
