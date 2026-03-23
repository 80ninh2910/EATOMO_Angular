import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, CustomerDetail } from '../models/customer.model';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);

  /** GET /api/admin/customers */
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${API_URL}/admin/customers`);
  }

  /** GET /api/admin/customers/:id — bao gồm danh sách đơn hàng */
  getCustomerById(id: string): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(`${API_URL}/admin/customers/${id}`);
  }
  // THÊM HÀM NÀY ĐỂ GỌI API XOÁ:
  /** DELETE /api/admin/customers/:id */
  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/admin/customers/${id}`);
  }
}
