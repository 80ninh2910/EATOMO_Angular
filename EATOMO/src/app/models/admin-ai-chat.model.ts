export interface AdminAiPrediction {
  probability: number;
  threshold: number;
  label: number;
}

export interface AdminAiAskRequest {
  question: string;
  orderId?: string;
  orderFeatures?: Record<string, unknown>;
}

export interface AdminAiAskResponse {
  success: boolean;
  intent: string;
  answer: string;
  dashboardView?: string;
  question?: string;
  recommendations?: string[];
  quickActions?: AdminAiQuickAction[];
  order?: {
    orderId: string;
    orderNumber: string;
    status: string;
  } | null;
  prediction?: {
    cancelRisk: AdminAiPrediction;
    delayRisk: AdminAiPrediction;
  } | null;
  smartPrompts?: string[];
  report?: AdminAiChatReport;
  monitoring?: {
    generatedAt: string;
    drift: {
      cancel: { score: number; topShiftedFeatures: Array<{ feature: string; zShift: number }> };
      delay: { score: number; topShiftedFeatures: Array<{ feature: string; zShift: number }> };
    };
    latestWeekly?: {
      week: string;
      cancel: { samples: number; precision: number; recall: number; f1: number };
      delay: { samples: number; precision: number; recall: number; f1: number };
    } | null;
  };
  highRiskOrders?: Array<{
    orderId: string;
    orderNumber: string;
    status: string;
    cancelRisk: number;
    delayRisk: number;
    riskScore: number;
  }>;
  productSales?: AdminAiProductSalesPayload;
  marketingStrategies?: string[];
  orderAnalysis?: AdminAiOrderAnalysisPayload;
}

export interface AdminAiQuickAction {
  type: 'route';
  label: string;
  route: string;
  queryParams?: Record<string, string>;
}

export interface AdminAiChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'up' | 'down';
  report?: AdminAiChatReport;
  dashboardView?: string;
  productSales?: AdminAiProductSalesPayload;
  marketingStrategies?: string[];
  orderAnalysis?: AdminAiOrderAnalysisPayload;
}

export interface AdminAiOrderTopItem {
  bowlName: string;
  quantity: number;
  subtotal: number;
}

export interface AdminAiOrderAnalysisPayload {
  generatedAt: string;
  order: {
    orderId: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    ageHours: number;
    paymentMethod: string;
    paymentStatus: string;
    totalAmount: number;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    itemCount: number;
    totalQuantity: number;
    hasVoucher: boolean;
    voucherCode: string;
    topItems: AdminAiOrderTopItem[];
  };
  risk: {
    cancel: {
      probability: number;
      level: string;
      threshold: number;
      label: number;
      thresholdGap: number;
    };
    delay: {
      probability: number;
      level: string;
      threshold: number;
      label: number;
      thresholdGap: number;
    };
    combinedScore: number;
    priorityBand: string;
  };
  sla: {
    status: 'normal' | 'watch' | 'critical';
    estimatedDelayMinutes: number;
    escalationInMinutes: number;
    reason: string;
  };
  riskReasons: string[];
  actionPlan: string[];
  featureSnapshot: {
    userSegment: string;
    userOrders90d: number;
    userSpent90d: number;
    avgOrderValue90d: number;
    qtyLowCal: number;
    qtyBalanced: number;
    qtyHighProtein: number;
    qtyVegetarian: number;
  };
}

export interface AdminAiProductSalesItem {
  bowlId: string;
  bowlName: string;
  image: string;
  totalQuantity: number;
  totalRevenue: number;
  lineCount: number;
}

export interface AdminAiProductSalesPayload {
  period: string;
  generatedAt: string;
  totalDistinctItems: number;
  topSelling: AdminAiProductSalesItem[];
  bestSeller: AdminAiProductSalesItem | null;
  slowestSelling: AdminAiProductSalesItem[];
}

export interface AdminAiChatReport {
  type: 'dashboard_overview';
  period: string;
  generatedAt: string;
  kpis: {
    totalRevenue: number;
    grossProfitEstimate: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueGrowth: number;
    cancelRate: number;
    delayedOrders: number;
    delayedRate: number;
  };
  orderStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueSeries: Array<{
    label: string;
    revenue: number;
    orders: number;
  }>;
}

export interface AdminAiFeedbackRequest {
  messageId?: string;
  question?: string;
  answer: string;
  rating: 'up' | 'down';
  orderId?: string;
  reason?: string;
  tags?: string[];
}

export interface AdminAiFeedbackResponse {
  success: boolean;
  message: string;
  recommendations?: string[];
}

export interface AdminAiHintsResponse {
  success: boolean;
  latestOrders: Array<{
    orderId: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

export interface AdminHighRiskOrdersResponse {
  success: boolean;
  total: number;
  thresholds: {
    minCancel: number;
    minDelay: number;
  };
  orders: Array<{
    orderId: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    riskScore: number;
    cancelRisk: AdminAiPrediction;
    delayRisk: AdminAiPrediction;
  }>;
}

export interface AdminModelMonitoringResponse {
  success: boolean;
  generatedAt: string;
  modelInfo: {
    cancel: { threshold: number; validation: unknown };
    delay: { threshold: number; validation: unknown };
  };
  drift: {
    cancel: { score: number; topShiftedFeatures: Array<{ feature: string; zShift: number }> };
    delay: { score: number; topShiftedFeatures: Array<{ feature: string; zShift: number }> };
  };
  weeklyMetrics: Array<{
    week: string;
    cancel: { samples: number; precision: number; recall: number; f1: number };
    delay: { samples: number; precision: number; recall: number; f1: number };
  }>;
}
