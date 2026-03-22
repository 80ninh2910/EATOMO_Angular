import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CheckoutVoucherService {
  private pendingVoucherCodeSignal = signal<string | null>(null);

  setPendingVoucherCode(code: string): void {
    const normalized = String(code || '').trim().toUpperCase();
    this.pendingVoucherCodeSignal.set(normalized || null);
  }

  consumePendingVoucherCode(): string | null {
    const code = this.pendingVoucherCodeSignal();
    this.pendingVoucherCodeSignal.set(null);
    return code;
  }
}
