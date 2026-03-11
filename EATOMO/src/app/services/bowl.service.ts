import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bowl, CreateBowlRequest, UpdateBowlRequest } from '../models/bowl.model';

@Injectable({
  providedIn: 'root'
})
export class BowlService {
  private readonly API = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ───────── Public ─────────

  getBowls(category?: string): Observable<Bowl[]> {
    let params = new HttpParams();
    if (category && category !== 'all') {
      params = params.set('category', category);
    }
    return this.http.get<Bowl[]>(`${this.API}/bowls`, { params });
  }

  getBowlsByCategory(category: string): Observable<Bowl[]> {
    return this.getBowls(category);
  }

  getBowlById(id: string): Observable<Bowl> {
    return this.http.get<Bowl>(`${this.API}/bowls/${id}`);
  }

  // ───────── Admin CRUD ─────────

  createBowl(data: CreateBowlRequest): Observable<Bowl> {
    return this.http.post<Bowl>(`${this.API}/admin/bowls`, data);
  }

  updateBowl(id: string, data: UpdateBowlRequest): Observable<Bowl> {
    return this.http.patch<Bowl>(`${this.API}/admin/bowls/${id}`, data);
  }

  deleteBowl(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API}/admin/bowls/${id}`);
  }

  updateBowlPrice(id: string, price: number): Observable<Bowl> {
    return this.updateBowl(id, { price });
  }

  updateBowlStock(id: string, inStock: boolean): Observable<Bowl> {
    return this.updateBowl(id, { inStock });
  }
}
