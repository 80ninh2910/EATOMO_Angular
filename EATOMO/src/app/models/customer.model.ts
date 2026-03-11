import { Order } from './order.model';

export interface Customer {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerDetail extends Customer {
  orders: Order[];
}
