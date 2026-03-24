import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AdminAiChatService } from '../../services/admin-ai-chat.service';
import { Order, OrderStatus } from '../../models/order.model';

type FulfillmentStatus = 'pending' | 'waiting' | 'shipping' | 'done';
type LocalPaymentStatus = 'paid' | 'pending';
type DisplayPaymentMethod = 'COD' | 'Card' | 'Bank transfer' | 'E-wallet';

interface OrderMeta {
  id: string;
  customer: string;
  createdAt: string;
  dateISO: string;
  paymentStatus: LocalPaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: DisplayPaymentMethod;
  cod: boolean;
  items: number;
  total: string;
  updatedAt: string;
  updatedBy: string;
  backendStatus: OrderStatus;
  orderObj: Order;
}

@Component({
  selector: 'app-order-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './order-admin.component.html',
  styleUrl: './order-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderAdminComponent implements OnInit {
  private orderService = inject(OrderService);
  private adminAiChatService = inject(AdminAiChatService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ordersMap: Record<string, OrderMeta> = {};
  allOrderIds: string[] = [];
  isLoading = true;
  error = '';

  activeTab: 'all' | 'pending' | 'shipping' | 'delivered' = 'all';
  currentPage = 1;
  totalPages = 0;
  totalOrders = 0;
  limit = 20;
  viewMode: 'grid' | 'list' = 'list';
  showColumnPanel = false;
  filterPaymentMethod: 'all' | DisplayPaymentMethod = 'all';
  filterCodOnly = false;
  dateFrom = '';
  dateTo = '';
  selectedIds = new Set<string>();
  highRiskOrderIds = new Set<string>();
  aiRiskFilterActive = false;
  searchTerm = '';
  appliedSearchTerm = '';

  columnVisibility = {
    id: true,
    createdAt: true,
    customer: true,
    payment: true,
    fulfillment: true,
    paymentMethod: true,
    cod: true,
    items: true,
    total: true,
    updated: true
  };

  private openOrders = new Set<string>();


  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const risk = params.get('risk');
      this.aiRiskFilterActive = risk === 'high';
      if (this.aiRiskFilterActive) {
        this.loadHighRiskOrders();
      } else {
        this.highRiskOrderIds.clear();
      }
      this.cdr.markForCheck();
    });
    this.loadOrders(1);
  }

  private loadHighRiskOrders(): void {
    this.adminAiChatService.getHighRiskOrders(0.6, 0.45, 150).subscribe({
      next: (res) => {
        this.highRiskOrderIds = new Set((res.orders || []).map((o) => o.orderId));
        this.cdr.markForCheck();
      },
      error: () => {
        this.highRiskOrderIds.clear();
        this.cdr.markForCheck();
      }
    });
  }

  clearAiRiskFilter(): void {
    this.router.navigate(['/admin']);
  }

  loadOrders(page: number = 1): void {
    this.isLoading = true;
    this.error = '';
    this.currentPage = page;
    this.orderService.getAllOrders({ page, limit: this.limit, status: this.activeTab !== 'all' ? this.mapTabToStatus(this.activeTab) : undefined }).subscribe({
      next: (res) => {
        const orders: Order[] = (res as any).orders ?? [];
        this.totalOrders = (res as any).total ?? 0;
        this.totalPages = (res as any).totalPages ?? 0;
        this.currentPage = (res as any).page ?? page;

        this.ordersMap = {};
        this.allOrderIds = [];
        orders.forEach(o => {
          const id = o.id ?? (o as any)._id ?? '';
          if (id) {
            this.ordersMap[id] = this.buildMeta(o, id);
            this.allOrderIds.push(id);
          }
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Load orders error:', err);
        this.error = 'Không thể tải danh sách đơn hàng.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private mapTabToStatus(tab: string): OrderStatus | undefined {
    switch (tab) {
      case 'pending': return 'pending';
      case 'shipping': return 'delivering';
      case 'delivered': return 'completed';
      default: return undefined;
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadOrders(page);
  }

  private buildMeta(o: Order, id: string): OrderMeta {
    const fulfillmentStatus = this.mapBackendStatus(o.status);
    const paymentStatus: LocalPaymentStatus = (o.paymentStatus === 'paid' || o.paymentStatus === 'refunded') ? 'paid' : 'pending';
    const paymentMethod = this.mapPaymentMethod(o.paymentMethod);
    const createdAt = this.formatDate(new Date(o.createdAt));
    const updatedAt = this.formatDate(new Date(o.updatedAt));
    const dateISO = new Date(o.createdAt).toISOString().substring(0, 10);
    return {
      id,
      customer: (o as any).customerName ?? 'Unknown',
      createdAt,
      dateISO,
      paymentStatus,
      fulfillmentStatus,
      paymentMethod,
      cod: o.paymentMethod === 'cash',
      items: o.items.reduce((sum, item) => sum + item.quantity, 0),
      total: this.formatCurrency(o.totalAmount),
      updatedAt,
      updatedBy: 'Admin',
      backendStatus: o.status,
      orderObj: o
    };
  }

  private mapBackendStatus(status: OrderStatus): FulfillmentStatus {
    switch (status) {
      case 'completed': return 'done';
      case 'delivering': return 'shipping';
      case 'confirmed': case 'preparing': return 'waiting';
      default: return 'pending';
    }
  }

  private mapFulfillmentToBackend(fs: FulfillmentStatus): OrderStatus {
    switch (fs) {
      case 'done': return 'completed';
      case 'shipping': return 'delivering';
      case 'waiting': return 'confirmed';
      default: return 'pending';
    }
  }

  private mapPaymentMethod(pm: string): DisplayPaymentMethod {
    switch (pm) {
      case 'momo': return 'E-wallet';
      case 'card': return 'Card';
      case 'bank_transfer': return 'Bank transfer';
      default: return 'COD';
    }
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
  }

  private formatCurrency(amount: number): string {
    const formatted = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `${formatted} \u20AB`;
  }

  getNowLabel(): string {
    return this.formatDate(new Date());
  }

  shouldShowOrder(orderId: string): boolean {
    const meta = this.ordersMap[orderId];
    if (!meta) return false;
    if (this.aiRiskFilterActive && !this.highRiskOrderIds.has(orderId)) return false;
    if (this.activeTab === 'pending' && meta.fulfillmentStatus !== 'pending' && meta.fulfillmentStatus !== 'waiting') return false;
    if (this.activeTab === 'shipping' && meta.fulfillmentStatus !== 'shipping') return false;
    if (this.activeTab === 'delivered' && meta.fulfillmentStatus !== 'done') return false;
    if (this.filterPaymentMethod !== 'all' && meta.paymentMethod !== this.filterPaymentMethod) return false;
    if (this.filterCodOnly && !meta.cod) return false;
    if (this.dateFrom && meta.dateISO < this.dateFrom) return false;
    if (this.dateTo && meta.dateISO > this.dateTo) return false;
    if (this.appliedSearchTerm) {
      const haystack = `${meta.id} ${meta.customer} ${meta.paymentMethod} ${meta.total}`.toLowerCase();
      if (!haystack.includes(this.appliedSearchTerm)) return false;
    }
    return true;
  }

  getVisibleOrderIds(): string[] {
    return this.allOrderIds.filter(id => this.shouldShowOrder(id));
  }

  updateOrderStatus(orderId: string, type: 'payment' | 'fulfillment', value: string): void {
    const meta = this.ordersMap[orderId];
    if (!meta) return;
    if (type === 'payment') {
      meta.paymentStatus = value as LocalPaymentStatus;
      meta.updatedAt = this.getNowLabel();
      this.cdr.markForCheck();
    } else {
      const fs = value as FulfillmentStatus;
      const newStatus = this.mapFulfillmentToBackend(fs);
      this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
        next: () => {
          meta.fulfillmentStatus = fs;
          meta.backendStatus = newStatus;
          meta.updatedAt = this.getNowLabel();
          this.cdr.markForCheck();
        },
        error: () => alert('Cáº­p nháº­t tráº¡ng thĂ¡i tháº¥t báº¡i.')
      });
    }
  }

  setBackendStatus(orderId: string, status: OrderStatus): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        const meta = this.ordersMap[orderId];
        if (meta) {
          meta.backendStatus = status;
          meta.fulfillmentStatus = this.mapBackendStatus(status);
          meta.updatedAt = this.getNowLabel();
        }
        this.cdr.markForCheck();
      },
      error: () => alert('Cáº­p nháº­t Ä‘Æ¡n hĂ ng tháº¥t báº¡i.')
    });
  }

  confirmOrder(orderId: string): void { this.setBackendStatus(orderId, 'confirmed'); }
  deliverOrder(orderId: string): void { this.setBackendStatus(orderId, 'delivering'); }
  cancelOrder(orderId: string): void { this.setBackendStatus(orderId, 'cancelled'); }
  archiveOrder(orderId: string): void { this.setBackendStatus(orderId, 'completed'); }
  printOrder(_orderId: string): void { window.print(); }

  bulkConfirm(): void {
    if (!this.selectedIds.size) return;
    this.selectedIds.forEach(id => this.setBackendStatus(id, 'confirmed'));
  }

  bulkShip(): void {
    if (!this.selectedIds.size) return;
    this.selectedIds.forEach(id => this.setBackendStatus(id, 'delivering'));
  }

  bulkExport(): void {
    alert(`Export ${this.selectedIds.size} orders: ${Array.from(this.selectedIds).join(', ')}`);
  }

  toggleOrder(orderId: string): void {
    this.openOrders.has(orderId) ? this.openOrders.delete(orderId) : this.openOrders.add(orderId);
  }

  isOpen(orderId: string): boolean { return this.openOrders.has(orderId); }
  filterTab(tab: 'all' | 'pending' | 'shipping' | 'delivered'): void {
    this.activeTab = tab;
    this.loadOrders(1);
  }
  onSearchInput(e: Event): void {
    this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
    this.appliedSearchTerm = this.searchTerm.trim();
  }
  changeView(view: 'grid' | 'list'): void { this.viewMode = view; }
  applyFilters(): void { this.appliedSearchTerm = this.searchTerm.trim(); }
  toggleColumnPanel(): void { this.showColumnPanel = !this.showColumnPanel; }

  toggleSelectAllVisible(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.getVisibleOrderIds().forEach(id => checked ? this.selectedIds.add(id) : this.selectedIds.delete(id));
  }

  toggleSelectOrder(orderId: string, event: Event): void {
    (event.target as HTMLInputElement).checked ? this.selectedIds.add(orderId) : this.selectedIds.delete(orderId);
  }

  isSelected(orderId: string): boolean { return this.selectedIds.has(orderId); }

  isAllSelectedVisible(): boolean {
    const ids = this.getVisibleOrderIds();
    return ids.length > 0 && ids.every(id => this.selectedIds.has(id));
  }

  getDetailsColspan(): number { return Object.values(this.columnVisibility).filter(Boolean).length; }

  getFulfillmentLabel(orderId: string): string {
    const s = this.ordersMap[orderId]?.fulfillmentStatus;
    return s === 'done' ? 'Delivered' : s === 'shipping' ? 'Shipping' : s === 'waiting' ? 'Not delivered' : 'Pending';
  }

  getFulfillmentClass(orderId: string): string { return this.ordersMap[orderId]?.fulfillmentStatus ?? 'pending'; }

  getSlaLabel(orderId: string): string {
    const meta = this.ordersMap[orderId];
    if (!meta) return '';
    const ms = Date.now() - new Date(meta.orderObj.createdAt).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `Age ${h}h ${m}m`;
  }

  getOrderActivity(orderId: string): string[] {
    const meta = this.ordersMap[orderId];
    if (!meta) return [];
    return [
      `Order created â€¢ ${meta.createdAt}`,
      `Status: ${meta.backendStatus} â€¢ ${meta.updatedAt}`,
      `Payment: ${meta.paymentStatus} â€¢ ${meta.updatedAt}`
    ];
  }

  getOrderNotes(orderId: string): string[] {
    const meta = this.ordersMap[orderId];
    if (!meta) return [];
    const note = (meta.orderObj as any).deliveryNotes;
    return note ? [note] : ['No notes'];
  }

  getOrderItems(orderId: string) {
    return this.ordersMap[orderId]?.orderObj?.items ?? [];
  }

  trackById(_: number, id: string): string { return id; }
}
