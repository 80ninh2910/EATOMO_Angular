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

export interface BinaryWeeklyMetric {
  samples: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface WeeklyModelMetric {
  week: string;
  cancel: BinaryWeeklyMetric;
  delay: BinaryWeeklyMetric;
}

export interface DriftMetric {
  score: number;
  topShiftedFeatures: Array<{
    feature: string;
    zShift: number;
  }>;
}

export interface ModelMonitoring {
  generatedAt: string;
  modelInfo: {
    cancel: { threshold: number; validation: unknown };
    delay: { threshold: number; validation: unknown };
  };
  drift: {
    cancel: DriftMetric;
    delay: DriftMetric;
  };
  weeklyMetrics: WeeklyModelMetric[];
}
