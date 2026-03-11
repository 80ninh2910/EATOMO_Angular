export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
}

export interface RevenueDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  bowlId: string;
  bowlName: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}
