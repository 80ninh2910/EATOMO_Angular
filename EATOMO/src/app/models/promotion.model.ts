export type DiscountType = 'percentage' | 'fixed';
export type PromotionTarget = 'all' | 'new_customer' | 'vip' | 'specific_category';

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
  target: PromotionTarget;
  targetCategory?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromotionRequest {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil?: string;
  maxUses: number;
  target: PromotionTarget;
  targetCategory?: string;
}

export interface UpdatePromotionRequest {
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  target?: PromotionTarget;
  targetCategory?: string;
  isActive?: boolean;
}

export interface VoucherValidation {
  valid: boolean;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
  message: string;
}
