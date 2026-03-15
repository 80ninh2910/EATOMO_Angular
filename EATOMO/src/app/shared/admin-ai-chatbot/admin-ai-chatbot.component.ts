import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminAiChatService } from '../../services/admin-ai-chat.service';
import {
  AdminAiChatMessage,
  AdminAiQuickAction,
  AdminAiChatReport,
  AdminAiProductSalesItem,
  AdminAiProductSalesPayload,
  AdminAiOrderAnalysisPayload
} from '../../models/admin-ai-chat.model';

@Component({
  selector: 'app-admin-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-ai-chatbot.component.html',
  styleUrl: './admin-ai-chatbot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAiChatbotComponent {
  private readonly MAX_HINTS = 10;
  private readonly MAX_QUICK_ACTIONS = 2;
  private readonly MAX_MESSAGES = 60;
  private readonly MAX_SMART_PROMPTS = 4;
  private readonly STORAGE_KEY = 'admin_ai_chat_session_v2';
  private readonly fallbackBowlImage = '/assets/healthy/images/index/bowl-b2.jpg';
  private readonly CORE_SMART_PROMPTS = [
    'Cho toi bao cao dashboard 30 ngay.',
    'Thong ke don tre va don huy ngay bay gio.',
    'Phan tich ma don nay chi tiet cho toi.',
    'Thong ke top 5 mon duoc ban chay nhat.',
    'Mon nao ban chay nhat?',
    'Top nhung mon e nhat.'
  ];

  private authService = inject(AuthService);
  private router = inject(Router);
  private chatService = inject(AdminAiChatService);

  isVisible = signal(false);
  isOpen = signal(false);
  isSending = signal(false);
  inputText = signal('');
  orderId = signal('');
  quickActions = signal<AdminAiQuickAction[]>([]);
  smartPrompts = signal<string[]>(this.CORE_SMART_PROMPTS.slice(0, this.MAX_SMART_PROMPTS));
  copiedMessageId = signal<string | null>(null);
  feedbackBusyIds = signal<Record<string, boolean>>({});
  lastQuestionAsked = signal('');
  @ViewChild('messagesBox') private messagesBoxRef?: ElementRef<HTMLDivElement>;

  messages = signal<AdminAiChatMessage[]>([
    {
      role: 'assistant',
      content: 'Tro ly AI admin da san sang. Ban co the hoi rui ro huy don, tre SLA va hanh dong uu tien.',
      timestamp: new Date().toISOString()
    }
  ]);

  hints = signal<Array<{ orderId: string; orderNumber: string; status: string }>>([]);

  canSend = computed(() => this.inputText().trim().length > 0 && !this.isSending());
  canAnalyzeOrder = computed(() => this.orderId().trim().length > 0 && !this.isSending());

  constructor() {
    this.refreshVisibility();
    this.restoreSession();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.refreshVisibility());
  }

  private refreshVisibility(): void {
    const onAdminRoute = this.router.url.startsWith('/admin');
    const canUse = this.authService.isLoggedIn() && this.authService.isAdmin() && onAdminRoute;
    this.isVisible.set(canUse);

    if (canUse) {
      this.loadHints();
    } else {
      this.isOpen.set(false);
    }
  }

  toggle(): void {
    if (!this.isVisible()) return;
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  useOrderHint(orderId: string): void {
    this.orderId.set(orderId);
  }

  onOrderSelect(orderId: string): void {
    this.orderId.set(String(orderId || '').trim());
  }

  analyzeSelectedOrder(): void {
    if (!this.canAnalyzeOrder()) return;
    this.inputText.set('Phan tich ma don nay chi tiet cho toi.');
    this.send();
  }

  send(): void {
    const question = this.inputText().trim();
    if (!question || this.isSending()) return;

    const userMsg: AdminAiChatMessage = {
      id: this.newMessageId(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    this.messages.set(this.withMessageLimit([...this.messages(), userMsg]));
    this.lastQuestionAsked.set(question);
    this.saveSession();
    setTimeout(() => this.scrollToBottom(), 0);
    this.isSending.set(true);

    const orderId = this.orderId().trim();
    const shouldAttachOrderId = this.shouldAttachOrderId(question, orderId);
    this.chatService.ask({ question, orderId: shouldAttachOrderId ? orderId : undefined }).subscribe({
      next: (res) => {
        const extra = res.prediction
          ? `\nRui ro huy: ${(res.prediction.cancelRisk.probability * 100).toFixed(1)}% | Rui ro tre SLA: ${(res.prediction.delayRisk.probability * 100).toFixed(1)}%`
          : '';

        this.messages.set([
          ...this.withMessageLimit(this.messages()),
          {
            id: this.newMessageId(),
            role: 'assistant',
            content: `${res.answer}${extra}`,
            timestamp: new Date().toISOString(),
            report: res.report as AdminAiChatReport | undefined,
            dashboardView: res.dashboardView,
            productSales: res.productSales as AdminAiProductSalesPayload | undefined,
            marketingStrategies: Array.isArray(res.marketingStrategies) ? res.marketingStrategies.slice(0, 4) : undefined,
            orderAnalysis: res.orderAnalysis as AdminAiOrderAnalysisPayload | undefined
          }
        ]);
        this.messages.set(this.withMessageLimit(this.messages()));
        setTimeout(() => this.scrollToBottom(), 0);

        this.inputText.set('');
        this.quickActions.set((res.quickActions || []).slice(0, this.MAX_QUICK_ACTIONS));
        this.smartPrompts.set(this.mergeSmartPrompts(res.smartPrompts || []));
        this.saveSession();
        this.isSending.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Khong the ket noi tro ly AI admin.';
        this.messages.set([
          ...this.withMessageLimit(this.messages()),
          {
            id: this.newMessageId(),
            role: 'assistant',
            content: `Loi: ${msg}`,
            timestamp: new Date().toISOString()
          }
        ]);
        this.messages.set(this.withMessageLimit(this.messages()));
        setTimeout(() => this.scrollToBottom(), 0);
        this.saveSession();
        this.isSending.set(false);
      }
    });
  }

  private scrollToBottom(): void {
    const el = this.messagesBoxRef?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }

  runQuickAction(action: AdminAiQuickAction): void {
    if (action.type === 'route') {
      this.router.navigate([action.route], { queryParams: action.queryParams || {} });
      this.isOpen.set(false);
    }
  }

  runSmartPrompt(prompt: string): void {
    this.inputText.set(prompt);
    this.send();
  }

  private shouldAttachOrderId(question: string, orderId: string): boolean {
    if (!orderId) return false;
    const q = this.normalizeQuestion(question);

    // Only attach orderId when the admin explicitly asks for order-level analysis.
    return /(orderid|order id|ma don|ord[-_ ]?\d|danh gia rui ro|kiem tra rui ro|rui ro don|don nay|phan tich ma don|phan tich don|chi tiet don)/.test(q);
  }

  private normalizeQuestion(text: string): string {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  clearHistory(): void {
    this.messages.set([
      {
        id: this.newMessageId(),
        role: 'assistant',
        content: 'Da xoa lich su. Tro ly AI san sang phien moi.',
        timestamp: new Date().toISOString()
      }
    ]);
    this.smartPrompts.set([]);
    this.smartPrompts.set(this.CORE_SMART_PROMPTS.slice(0, this.MAX_SMART_PROMPTS));
    this.quickActions.set([]);
    this.orderId.set('');
    this.saveSession();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  exportHistory(): void {
    const payload = {
      exportedAt: new Date().toISOString(),
      orderId: this.orderId() || null,
      messages: this.messages()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-ai-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  copyMessage(message: AdminAiChatMessage): void {
    if (!message?.content) return;
    if (!navigator?.clipboard) return;

    navigator.clipboard.writeText(message.content).then(() => {
      this.copiedMessageId.set(message.id || null);
      setTimeout(() => this.copiedMessageId.set(null), 1200);
    }).catch(() => {
      this.copiedMessageId.set(null);
    });
  }

  sendFeedback(message: AdminAiChatMessage, rating: 'up' | 'down'): void {
    if (!message?.id || message.role !== 'assistant') return;

    const busy = { ...this.feedbackBusyIds(), [message.id]: true };
    this.feedbackBusyIds.set(busy);

    this.chatService.sendFeedback({
      messageId: message.id,
      question: this.lastQuestionAsked(),
      answer: message.content,
      rating,
      orderId: this.orderId().trim() || undefined
    }).subscribe({
      next: (res) => {
        this.messages.set(
          this.messages().map((m) => (m.id === message.id ? { ...m, feedback: rating } : m))
        );

        if (rating === 'down' && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
          this.smartPrompts.set(this.mergeSmartPrompts(res.recommendations));
        }

        const done = { ...this.feedbackBusyIds(), [message.id!]: false };
        this.feedbackBusyIds.set(done);
        this.saveSession();
      },
      error: () => {
        const done = { ...this.feedbackBusyIds(), [message.id!]: false };
        this.feedbackBusyIds.set(done);
      }
    });
  }

  isFeedbackBusy(messageId?: string): boolean {
    if (!messageId) return false;
    return Boolean(this.feedbackBusyIds()[messageId]);
  }

  isCopied(messageId?: string): boolean {
    return Boolean(messageId && this.copiedMessageId() === messageId);
  }

  trackByMessage(_index: number, message: AdminAiChatMessage): string {
    return message.id || `${message.role}-${message.timestamp}`;
  }

  getProductItemsForMessage(message: AdminAiChatMessage): AdminAiProductSalesItem[] {
    const payload = message.productSales;
    if (!payload) return [];

    if (message.dashboardView === 'best_seller') {
      return payload.bestSeller ? [payload.bestSeller] : [];
    }

    if (message.dashboardView === 'slowest_selling_5') {
      return payload.slowestSelling || [];
    }

    return payload.topSelling || [];
  }

  getProductDashboardTitle(message: AdminAiChatMessage): string {
    const view = message.dashboardView;

    if (view === 'best_seller') {
      return 'Dashboard ket qua: Mon ban chay nhat';
    }

    if (view === 'slowest_selling_5') {
      return 'Dashboard ket qua: Top mon e nhat';
    }

    return 'Dashboard ket qua: Top mon ban chay';
  }

  getMarketingStrategiesForMessage(message: AdminAiChatMessage): string[] {
    if (Array.isArray(message.marketingStrategies) && message.marketingStrategies.length > 0) {
      return message.marketingStrategies;
    }

    const payload = message.productSales;
    if (!payload) return [];

    const topSelling = payload.topSelling || [];
    const slowestSelling = payload.slowestSelling || [];
    const bestSeller = payload.bestSeller;

    const totalRevenueAll = [...topSelling, ...slowestSelling]
      .reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
    const totalQuantityAll = [...topSelling, ...slowestSelling]
      .reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);

    const topRevenue = topSelling.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
    const topQuantity = topSelling.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);
    const slowRevenue = slowestSelling.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
    const slowQuantity = slowestSelling.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);

    const gapRevenue = Math.max(0, topRevenue - slowRevenue);
    const gapQuantity = Math.max(0, topQuantity - slowQuantity);

    const topNames = topSelling.slice(0, 3).map((item) => item.bowlName).join(', ') || 'nhom mon top';
    const slowNames = slowestSelling.slice(0, 3).map((item) => item.bowlName).join(', ') || 'nhom mon cham';

    if (message.dashboardView === 'best_seller') {
      const bestRevenueShare = totalRevenueAll > 0 && bestSeller
        ? ((Number(bestSeller.totalRevenue || 0) / totalRevenueAll) * 100).toFixed(1)
        : '0.0';

      return [
        `${bestSeller?.bowlName || 'Mon top'} dang chiem ${bestRevenueShare}% doanh thu trong tap hien thi. Nen day mon nay lam neo cho campaign signature.`,
        `Khoang cach doanh thu giua nhom top va nhom cham dang la ${gapRevenue.toLocaleString('vi-VN')} VND. Goi y tao combo best seller + mon cham de keo conversion.`,
        `Neu giu tan suat remarketing cho khach da mua ${bestSeller?.bowlName || 'mon top'} trong 7 ngay, kha nang quay lai se cao hon.`
      ];
    }

    if (message.dashboardView === 'slowest_selling_5') {
      return [
        `Nhom mon cham (${slowNames}) dang thua nhom top ${gapQuantity} phan. Nen chay uu dai theo gio vang de kich thu nhu cau dung thu.`,
        `Doanh thu nhom cham dang kem ${gapRevenue.toLocaleString('vi-VN')} VND. Uu tien bundle mon cham voi mon top (${topNames}) de tang ty le chot don.`,
        `Dat muc tieu nang nhom cham them ${Math.max(5, Math.round(gapQuantity * 0.2))} phan ky toi va theo doi uplift theo tung mon.`
      ];
    }

    const topRevenueShare = totalRevenueAll > 0 ? ((topRevenue / totalRevenueAll) * 100).toFixed(1) : '0.0';
    const topQuantityShare = totalQuantityAll > 0 ? ((topQuantity / totalQuantityAll) * 100).toFixed(1) : '0.0';

    return [
      `Top nhom mon (${topNames}) dang dong gop ${topRevenueShare}% doanh thu va ${topQuantityShare}% san luong trong tap hien thi. Nen uu tien placement tren trang chinh.`,
      `Khoang cach voi nhom cham hien la ${gapQuantity} phan va ${gapRevenue.toLocaleString('vi-VN')} VND. Day la co hoi mo combo giua mon top va mon cham.`,
      `Remarketing den khach da mua nhom top trong 30 ngay va bo sung uu dai nho cho lan quay lai de tang tan suat dat mon.`
    ];
  }

  resolveCardImage(image?: string): string {
    const raw = String(image || '').trim();
    if (!raw) return this.fallbackBowlImage;
    if (raw.startsWith('http') || raw.startsWith('/')) return raw;
    if (raw.startsWith('assets/')) return `/${raw}`;
    return `/assets/healthy/images/index/${raw.replace(/^\/+/, '')}`;
  }

  getPriorityBandLabel(orderAnalysis?: AdminAiOrderAnalysisPayload): string {
    const band = orderAnalysis?.risk?.priorityBand;
    if (!band) return 'Khong xac dinh';

    const map: Record<string, string> = {
      P0_KHAN_CAP: 'P0 - Khan cap',
      P1_CAO: 'P1 - Cao',
      P2_THEO_DOI_SAT: 'P2 - Theo doi sat',
      P3_BINH_THUONG: 'P3 - Binh thuong'
    };

    return map[band] || band;
  }

  getSlaStatusLabel(orderAnalysis?: AdminAiOrderAnalysisPayload): string {
    const status = orderAnalysis?.sla?.status;
    if (status === 'critical') return 'Canh bao do';
    if (status === 'watch') return 'Canh bao vang';
    if (status === 'normal') return 'On dinh';
    return 'Khong xac dinh';
  }

  private loadHints(): void {
    this.chatService.getHints().subscribe({
      next: (res) => {
        const mapped = (res.latestOrders || [])
            .slice(0, this.MAX_HINTS)
            .map((o) => ({ orderId: o.orderId, orderNumber: o.orderNumber, status: o.status }));
        this.hints.set(mapped);

        // Default to latest order if admin has not selected one yet.
        if (!this.orderId() && mapped.length > 0) {
          this.orderId.set(mapped[0].orderId);
        }
      },
      error: () => {
        this.hints.set([]);
      }
    });
  }

  private withMessageLimit(list: AdminAiChatMessage[]): AdminAiChatMessage[] {
    if (list.length <= this.MAX_MESSAGES) return list;
    return list.slice(list.length - this.MAX_MESSAGES);
  }

  private newMessageId(): string {
    return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private saveSession(): void {
    try {
      const data = {
        orderId: this.orderId(),
        quickActions: this.quickActions(),
        smartPrompts: this.smartPrompts(),
        messages: this.withMessageLimit(this.messages())
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors silently (private mode/quota).
    }
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) || {};
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        const normalized = data.messages.map((m: AdminAiChatMessage) => ({
          ...m,
          id: m.id || this.newMessageId()
        }));
        this.messages.set(this.withMessageLimit(normalized));
      }
      if (typeof data.orderId === 'string') this.orderId.set(data.orderId);
      if (Array.isArray(data.quickActions)) this.quickActions.set(data.quickActions.slice(0, this.MAX_QUICK_ACTIONS));
      if (Array.isArray(data.smartPrompts) && data.smartPrompts.length > 0) {
        this.smartPrompts.set(this.mergeSmartPrompts(data.smartPrompts));
      } else {
        this.smartPrompts.set(this.CORE_SMART_PROMPTS.slice(0, this.MAX_SMART_PROMPTS));
      }
    } catch {
      // Ignore parse errors and keep default state.
    }
  }

  private mergeSmartPrompts(dynamicPrompts: string[]): string[] {
    const merged = [...dynamicPrompts, ...this.CORE_SMART_PROMPTS]
      .map((x) => String(x || '').trim())
      .filter((x) => x.length > 0);

    const unique = Array.from(new Set(merged));
    return unique.slice(0, this.MAX_SMART_PROMPTS);
  }
}
