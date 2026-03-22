import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, inject, computed, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { BuildYourOwnPreset, ChatMessage, RecommendedBowl } from '../../models/chat.model';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotWidgetComponent {
  private chatService = inject(ChatService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('chatHistory') private chatHistoryRef?: ElementRef<HTMLDivElement>;
  @ViewChild('chatInputRef') private chatInputRef?: ElementRef<HTMLInputElement>;

  private readonly storageKeys = {
    messages: 'chat_widget_messages',
    suggestions: 'chat_widget_suggestions',
    highlightedBowls: 'chat_widget_highlighted_bowls'
  };
  private readonly maxMessages = 30;
  private readonly maxSuggestions = 6;
  private readonly personalConsultationKeyword = 'tư vấn cho riêng bạn';
  private readonly fallbackBowlImage = '/assets/healthy/images/index/bowl-b2.jpg';
  readonly chatToggleIcon = '/assets/healthy/images/index/to.png';
  private readonly maxRecommendedBowls = 3;
  private readonly strategicSuggestions = [
    'Tư vấn cho riêng bạn',
    'Voucher nào đang dùng được?',
    'Địa chỉ giao hàng ở đâu?',
    'Đơn hàng của tôi',
    'Gợi ý bowl giảm cân',
    'Gợi ý bowl tăng cơ'
  ];
  private pendingConsultationRedirect = false;

  isOpen = signal(false);
  showToggleImage = signal(true);
  isSending = signal(false);
  isConsultationFormOpen = signal(false);
  consultationFormSubmitted = signal(false);
  inputText = signal('');
  suggestions = signal<string[]>([...this.strategicSuggestions]);
  private readonly pinnedSuggestions = ['Tư vấn cho riêng bạn'];

  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Xin chào. Mình là trợ lý EATOMO. Bạn cần hỗ trợ đơn hàng, voucher hay gợi ý bowl?',
      timestamp: new Date().toISOString()
    }
  ]);
  highlightedBowls = signal<RecommendedBowl[]>([]);
  selectedPreset = signal<BuildYourOwnPreset | null>(null);

  hideWidget = signal(false);
  canSend = computed(() => {
    if (this.isConsultationFormOpen()) {
      return !this.isSending();
    }

    return this.inputText().trim().length > 0 && !this.isSending();
  });
  consultationForm = signal({
    gender: '',
    weightKg: '',
    heightCm: '',
    goal: '',
    age: '',
    activity: '',
    preference: ''
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreFromStorage();
    }

    this.hideWidget.set(this.router.url.startsWith('/admin'));
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.hideWidget.set(this.router.url.startsWith('/admin'));
        this.isOpen.set(false);
      });
  }

  toggleOpen(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      setTimeout(() => {
        this.scrollToLatestMessage();
        this.chatInputRef?.nativeElement.focus();
      }, 0);
    }
  }

  clearConversation(): void {
    this.messages.set([
      {
        role: 'assistant',
        content: 'Mình đã reset cuộc hội thoại. Bạn muốn mình tư vấn đơn hàng, voucher hay bowl theo mục tiêu dinh dưỡng?',
        timestamp: new Date().toISOString()
      }
    ]);
    this.suggestions.set(this.mergeSuggestions(this.pinnedSuggestions, this.strategicSuggestions));
    this.highlightedBowls.set([]);
    this.selectedPreset.set(null);
    this.closeConsultationForm();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.storageKeys.messages);
      localStorage.removeItem(this.storageKeys.suggestions);
      localStorage.removeItem(this.storageKeys.highlightedBowls);
    }
    this.persistToStorage();
    this.scrollToLatestMessage();
  }

  useSuggestion(text: string): void {
    if (this.normalizeForSuggestion(text) === this.normalizeForSuggestion(this.personalConsultationKeyword)) {
      this.openConsultationForm();
      return;
    }

    this.inputText.set(text);
    this.send();
  }

  send(): void {
    if (this.isConsultationFormOpen()) {
      this.submitConsultationForm();
      return;
    }

    const text = this.inputText().trim();
    this.sendText(text);
    this.inputText.set('');
  }

  updateConsultationField(
    key: 'gender' | 'weightKg' | 'heightCm' | 'goal' | 'age' | 'activity' | 'preference',
    value: string
  ): void {
    this.consultationForm.update((current) => ({ ...current, [key]: this.toText(value) }));
  }

  submitConsultationForm(): void {
    if (this.isSending()) {
      return;
    }

    this.consultationFormSubmitted.set(true);
    if (!this.isConsultationFormValid()) {
      return;
    }

    const payload = this.consultationForm();
    const prompt = [
      'Tư vấn cho riêng bạn',
      `giới tính ${payload.gender}`,
      `cân nặng ${payload.weightKg}kg`,
      `chiều cao ${payload.heightCm}cm`,
      `mục tiêu ${payload.goal}`,
      payload.age ? `tuổi ${payload.age}` : 'tuổi mặc định 25',
      payload.activity ? `tần suất ${payload.activity}` : 'tần suất mặc định vận động vừa',
      payload.preference ? `thích ${payload.preference}` : 'không có món ưu tiên'
    ].join(', ');

    this.closeConsultationForm();
    this.pendingConsultationRedirect = true;
    this.sendText(prompt);
  }

  cancelConsultationForm(): void {
    this.closeConsultationForm();
  }

  onConsultationEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.submitConsultationForm();
  }

  isRequiredFieldInvalid(field: 'gender' | 'weightKg' | 'heightCm' | 'goal'): boolean {
    if (!this.consultationFormSubmitted()) return false;
    return !this.hasValue(this.consultationForm()[field]);
  }

  private openConsultationForm(): void {
    this.isConsultationFormOpen.set(true);
    this.consultationFormSubmitted.set(false);
    setTimeout(() => this.scrollToLatestMessage(), 0);
  }

  private closeConsultationForm(): void {
    this.isConsultationFormOpen.set(false);
    this.consultationFormSubmitted.set(false);
    this.consultationForm.set({
      gender: '',
      weightKg: '',
      heightCm: '',
      goal: '',
      age: '',
      activity: '',
      preference: ''
    });
  }

  private isConsultationFormValid(): boolean {
    const form = this.consultationForm();
    return this.hasValue(form.gender) && this.hasValue(form.weightKg) && this.hasValue(form.heightCm) && this.hasValue(form.goal);
  }

  private hasValue(value: unknown): boolean {
    return this.toText(value).length > 0;
  }

  private toText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private sendText(text: string): void {
    const normalizedText = text.trim();
    if (!normalizedText || this.isSending()) return;

    if (normalizedText.length > 500) {
      this.messages.set([
        ...this.messages(),
        {
          role: 'assistant',
          content: 'Tin nhắn đang quá dài. Bạn giúp mình viết gọn hơn dưới 500 ký tự nhé.',
          timestamp: new Date().toISOString()
        }
      ]);
      this.scrollToLatestMessage();
      this.persistToStorage();
      return;
    }

    if (this.normalizeForSuggestion(normalizedText) === this.normalizeForSuggestion(this.personalConsultationKeyword)) {
      this.openConsultationForm();
      return;
    }

    const nextHistory: ChatMessage[] = [
      ...this.messages(),
      { role: 'user', content: normalizedText, timestamp: new Date().toISOString() }
    ];

    this.messages.set(nextHistory);
    this.isSending.set(true);
    this.scrollToLatestMessage();
    this.persistToStorage();

    this.chatService.ask(normalizedText, nextHistory).subscribe({
      next: (response) => {
        this.isSending.set(false);

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.reply || 'Mình chưa trả lời được lúc này. Bạn thử lại giúp mình nhé.',
          timestamp: new Date().toISOString()
        };

        this.messages.set([...this.messages(), assistantMsg]);
        this.scrollToLatestMessage();
        this.suggestions.set(
          this.mergeSuggestions(
            this.intentSuggestions(response.intent),
            response.suggestions,
            this.suggestions(),
            this.strategicSuggestions
          )
        );

        const bowls = (response.data?.recommendedBowls || [])
          .slice(0, this.maxRecommendedBowls)
          .map((b) => ({ ...b, image: this.resolveBowlImage(b.image) }));
        this.highlightedBowls.set(bowls);

        const preset = response.data?.buildYourOwnPreset || null;
        this.selectedPreset.set(preset);
        const shouldRedirectToBuildYourOwn = Boolean(
          preset && (
            response.action === 'redirect_build_your_own' ||
            (this.pendingConsultationRedirect && response.intent === 'nutrition_coaching')
          )
        );

        if (shouldRedirectToBuildYourOwn && preset) {
          this.pendingConsultationRedirect = false;
          this.messages.set([
            ...this.messages(),
            {
              role: 'assistant',
              content: 'Mình đang mở Build Your Own với công thức đã chọn sẵn. Bạn chỉ cần xem lại và bấm xác nhận.',
              timestamp: new Date().toISOString()
            }
          ]);
          this.scrollToLatestMessage();

          setTimeout(() => {
            this.navigateToBuildYourOwn(preset, 'chatbot');
          }, 700);
        } else if (response.action === 'redirect_stores') {
          this.messages.set([
            ...this.messages(),
            {
              role: 'assistant',
              content: 'Mình đang mở trang Stores để bạn xem địa chỉ và cơ sở gần nhất.',
              timestamp: new Date().toISOString()
            }
          ]);
          this.scrollToLatestMessage();
          setTimeout(() => this.router.navigate(['/stores']), 450);
        } else if (response.action === 'redirect_about_us') {
          this.messages.set([
            ...this.messages(),
            {
              role: 'assistant',
              content: 'Mình đang mở trang About Us để bạn xem thông tin liên hệ, góp ý và hỗ trợ.',
              timestamp: new Date().toISOString()
            }
          ]);
          this.scrollToLatestMessage();
          setTimeout(() => this.router.navigate(['/about-us']), 450);
        }

        this.persistToStorage();
      },
      error: () => {
        this.pendingConsultationRedirect = false;
        this.isSending.set(false);
        this.selectedPreset.set(null);
        this.messages.set([
          ...this.messages(),
          {
            role: 'assistant',
            content: 'Kết nối chatbot tạm thời bị lỗi. Bạn kiểm tra backend đang chạy rồi thử lại giúp mình nhé.',
            timestamp: new Date().toISOString()
          }
        ]);
        this.highlightedBowls.set([]);
        this.scrollToLatestMessage();
        this.persistToStorage();
      }
    });
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      if (this.isConsultationFormOpen() && this.inputText().trim().length === 0) {
        this.submitConsultationForm();
        return;
      }

      this.send();
    }
  }

  onToggleIconError(): void {
    this.showToggleImage.set(false);
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByBowl(index: number, bowl: RecommendedBowl): string {
    return bowl._id || `${bowl.name}-${index}`;
  }

  selectRecommendedBowl(bowl: RecommendedBowl): void {
    this.messages.set([
      ...this.messages(),
      {
        role: 'assistant',
        content: `Đã chọn ${bowl.name}. Mình đang mở Sou-made bowls và đưa bạn đến đúng món này.`,
        timestamp: new Date().toISOString()
      }
    ]);
    this.scrollToLatestMessage();
    this.persistToStorage();
    this.router.navigate(['/our-bowls'], {
      queryParams: {
        bowlId: bowl._id,
        category: bowl.category,
        source: 'chatbot_card'
      }
    });
  }

  onBowlImageError(index: number): void {
    this.highlightedBowls.update((bowls) => {
      const next = [...bowls];
      if (!next[index]) return bowls;
      next[index] = { ...next[index], image: this.fallbackBowlImage };
      return next;
    });
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private persistToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem(this.storageKeys.messages, JSON.stringify(this.messages().slice(-this.maxMessages)));
    localStorage.setItem(this.storageKeys.suggestions, JSON.stringify(this.mergeSuggestions(this.suggestions())));
    localStorage.setItem(this.storageKeys.highlightedBowls, JSON.stringify(this.highlightedBowls().slice(0, this.maxRecommendedBowls)));
  }

  private restoreFromStorage(): void {
    try {
      const rawMessages = localStorage.getItem(this.storageKeys.messages);
      const rawSuggestions = localStorage.getItem(this.storageKeys.suggestions);
      const rawHighlightedBowls = localStorage.getItem(this.storageKeys.highlightedBowls);

      if (rawMessages) {
        const parsed = JSON.parse(rawMessages) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages.set(parsed.slice(-this.maxMessages));
          this.scrollToLatestMessage();
        }
      }

      if (rawSuggestions) {
        const parsed = JSON.parse(rawSuggestions) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.suggestions.set(this.mergeSuggestions(parsed));
        }
      }

      if (rawHighlightedBowls) {
        const parsed = JSON.parse(rawHighlightedBowls) as RecommendedBowl[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.highlightedBowls.set(
            parsed.slice(0, this.maxRecommendedBowls).map((b) => ({ ...b, image: this.resolveBowlImage(b.image) }))
          );
        }
      }
    } catch {
      localStorage.removeItem(this.storageKeys.messages);
      localStorage.removeItem(this.storageKeys.suggestions);
      localStorage.removeItem(this.storageKeys.highlightedBowls);
    }
  }

  private mergeSuggestions(...sourceSets: Array<string[] | undefined>): string[] {
    const merged = [
      ...this.pinnedSuggestions,
      ...sourceSets.flat().filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    ];

    const deduped = Array.from(new Set(merged));
    return deduped
      .sort((a, b) => this.suggestionPriority(a) - this.suggestionPriority(b))
      .slice(0, this.maxSuggestions);
  }

  private intentSuggestions(intent?: string): string[] {
    switch (intent) {
      case 'voucher_check':
      case 'voucher_info':
        return ['Voucher nào đang dùng được?', 'Mã nào hợp lệ cho đơn của tôi?'];
      case 'order_lookup':
      case 'order_status':
      case 'cancel_order':
        return ['Đơn hàng của tôi', 'Địa chỉ giao hàng ở đâu?'];
      case 'nutrition_coaching':
        return ['Tư vấn cho riêng bạn', 'Gợi ý bowl giảm cân', 'Gợi ý bowl tăng cơ'];
      case 'customer_faq':
        return ['Địa chỉ giao hàng ở đâu?', 'Voucher nào đang dùng được?'];
      default:
        return [];
    }
  }

  private suggestionPriority(text: string): number {
    const normalized = this.normalizeForSuggestion(text);

    if (normalized.includes('tu van') || normalized.includes('ca nhan')) return 0;
    if (normalized.includes('voucher') || normalized.includes('ma giam') || normalized.includes('khuyen mai')) return 1;
    if (normalized.includes('dia chi') || normalized.includes('giao hang') || normalized.includes('cua hang')) return 2;
    if (normalized.includes('don hang') || normalized.includes('order')) return 3;
    if (normalized.includes('goi y') || normalized.includes('bowl') || normalized.includes('dinh duong')) return 4;
    if (normalized.includes('build your own') || normalized.includes('custom')) return 5;

    return 10;
  }

  private normalizeForSuggestion(text: string): string {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private resolveBowlImage(image?: string): string {
    if (!image || !image.trim()) {
      return this.fallbackBowlImage;
    }

    if (image.startsWith('http') || image.startsWith('/')) {
      return image;
    }

    if (image.startsWith('assets/')) {
      return `/${image}`;
    }

    if (image.startsWith('../') || image.startsWith('./')) {
      const normalized = image.replace(/^\.\//, '').replace(/^\.\.\//, '');
      return `/${normalized}`;
    }

    return `/assets/healthy/images/index/${image.replace(/^\/+/, '')}`;
  }

  private navigateToBuildYourOwn(preset: BuildYourOwnPreset, source: string): void {
    this.router.navigate(['/build-your-own'], {
      queryParams: {
        protein: preset.protein,
        carbs: preset.carbs,
        side: preset.side,
        sauce: preset.sauce,
        source
      }
    });
  }

  private scrollToLatestMessage(): void {
    setTimeout(() => {
      const el = this.chatHistoryRef?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
