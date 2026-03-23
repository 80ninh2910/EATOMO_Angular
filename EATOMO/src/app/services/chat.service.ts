import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatAskResponse, ChatMessage } from '../models/chat.model';
import { environment } from '../../environments/environment';

const API_BASE = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);

  ask(message: string, history: ChatMessage[]): Observable<ChatAskResponse> {
    const payload = {
      message,
      history: history.map((m) => ({ role: m.role, content: m.content }))
    };

    return this.http.post<ChatAskResponse>(`${API_BASE}/chat/ask`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only retry on network/connectivity errors. If backend already responded
        // with an HTTP status, keep the original error to avoid cross-port drift.
        if (error?.status !== 0) {
          return throwError(() => error);
        }

        return this.http.post<ChatAskResponse>(`${API_BASE}/chat/ask`, payload);
      })
    );
  }
}
