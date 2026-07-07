import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order, CreateOrderRequest, OrderStatus } from '../models/order.model';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);

  // ───────── User ─────────

  /**
   * Tạo đơn hàng mới
   */
  createOrder(data: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${API_URL}/orders`, data);
  }

  /**
   * Lấy danh sách đơn hàng của user hiện tại
   */
  getMyOrders(): Observable<Order[]> {
    return this.http.get<{ orders: Order[] }>(`${API_URL}/orders`).pipe(
      map(response => response.orders || [])
    );
  }

  /**
   * Lấy chi tiết đơn hàng
   */
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${API_URL}/orders/${id}`);
  }

  /**
   * Hủy đơn hàng (user)
   */
  cancelOrder(id: string): Observable<Order> {
    return this.http.patch<Order>(`${API_URL}/orders/${id}/cancel`, {});
  }

  // ───────── Admin ─────────

  /**
   * Lấy tất cả đơn hàng (Admin) — filter theo status, date range
   */
  getAllOrders(filters?: {
    status?: OrderStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Observable<{ orders: Order[]; total: number }> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<{ orders: Order[]; total: number }>(`${API_URL}/admin/orders`, { params });
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin)
   */
  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${API_URL}/admin/orders/${id}/status`, { status });
  }
}
