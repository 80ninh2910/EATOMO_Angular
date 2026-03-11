export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'momo' | 'card' | 'bank_transfer';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  bowlId: string;
  bowlName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  customProteins?: string[];
  customVeggies?: string[];
  customSauces?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryNotes?: string;
  voucherCode?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateOrderRequest {
  items: {
    bowlId: string;
    quantity: number;
    customProteins?: string[];
    customVeggies?: string[];
    customSauces?: string[];
  }[];
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
}
