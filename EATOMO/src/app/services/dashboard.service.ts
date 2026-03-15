import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats, RevenueDataPoint, TopProduct, RecentOrder, ModelMonitoring } from '../models/dashboard.model';

const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  /**
   * Lấy KPI tổng quan: doanh thu, đơn hàng, khách hàng, giá trị trung bình
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API_URL}/admin/dashboard/stats`);
  }

  /**
   * Lấy dữ liệu biểu đồ doanh thu theo kỳ
   * @param period 'daily' | 'weekly' | 'monthly'
   */
  getRevenueChart(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Observable<RevenueDataPoint[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<RevenueDataPoint[]>(`${API_URL}/admin/dashboard/revenue`, { params });
  }

  /**
   * Lấy top sản phẩm bán chạy
   */
  getTopProducts(limit: number = 10): Observable<TopProduct[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopProduct[]>(`${API_URL}/admin/dashboard/top-products`, { params });
  }

  /**
   * Lấy đơn hàng gần đây
   */
  getRecentOrders(limit: number = 10): Observable<RecentOrder[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RecentOrder[]>(`${API_URL}/admin/dashboard/recent-orders`, { params });
  }

  getModelMonitoring(): Observable<{ success: boolean } & ModelMonitoring> {
    return this.http.get<{ success: boolean } & ModelMonitoring>(`${API_URL}/admin/ai-chat/monitoring`);
  }
}
