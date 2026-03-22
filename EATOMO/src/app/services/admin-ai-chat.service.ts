import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminAiAskRequest,
  AdminAiAskResponse,
  AdminAiFeedbackRequest,
  AdminAiFeedbackResponse,
  AdminAiHintsResponse,
  AdminHighRiskOrdersResponse,
  AdminModelMonitoringResponse,
  AdminAiMetricsResponse,
  AdminAiOrderPredictionResponse
} from '../models/admin-ai-chat.model';
import { API_BASE } from './api-base';

const API_URL = API_BASE;

@Injectable({
  providedIn: 'root'
})
export class AdminAiChatService {
  private http = inject(HttpClient);

  ask(payload: AdminAiAskRequest): Observable<AdminAiAskResponse> {
    return this.http.post<AdminAiAskResponse>(`${API_URL}/admin/ai-chat/ask`, payload);
  }

  getHints(): Observable<AdminAiHintsResponse> {
    return this.http.get<AdminAiHintsResponse>(`${API_URL}/admin/ai-chat/hints`);
  }

  getHighRiskOrders(minCancel: number = 0.6, minDelay: number = 0.45, limit: number = 100): Observable<AdminHighRiskOrdersResponse> {
    return this.http.get<AdminHighRiskOrdersResponse>(
      `${API_URL}/admin/ai-chat/high-risk-orders?minCancel=${minCancel}&minDelay=${minDelay}&limit=${limit}`
    );
  }

  getMonitoring(): Observable<AdminModelMonitoringResponse> {
    return this.http.get<AdminModelMonitoringResponse>(`${API_URL}/admin/ai-chat/monitoring`);
  }

  getOrderPrediction(orderId: string): Observable<AdminAiOrderPredictionResponse> {
    return this.http.post<AdminAiOrderPredictionResponse>(`${API_URL}/admin/ai-chat/predict/order/${orderId}`, {});
  }

  getMetrics(accuracy?: number, recall?: number): Observable<AdminAiMetricsResponse> {
    const query = new URLSearchParams();
    if (Number.isFinite(accuracy)) query.set('accuracy', String(accuracy));
    if (Number.isFinite(recall)) query.set('recall', String(recall));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<AdminAiMetricsResponse>(`${API_URL}/admin/ai-chat/metrics${suffix}`);
  }

  sendFeedback(payload: AdminAiFeedbackRequest): Observable<AdminAiFeedbackResponse> {
    return this.http.post<AdminAiFeedbackResponse>(`${API_URL}/admin/ai-chat/feedback`, payload);
  }
}
