import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface OrderRow {
  id: string;
  customer: string;
  date: string;
  status: 'completed' | 'pending' | 'processing' | 'cancelled';
  amount: string;
  itemCount: number;
}

type PaymentStatus = 'paid' | 'pending';
type FulfillmentStatus = 'pending' | 'waiting' | 'shipping' | 'done';
type PaymentMethod = 'COD' | 'Card' | 'Bank transfer' | 'E-wallet';

interface OrderMeta {
  id: string;
  customer: string;
  createdAt: string;
  dateISO: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: PaymentMethod;
  city: string;
  cod: boolean;
  items: number;
  total: string;
  updatedAt: string;
  updatedBy: string;
  slaMinutes: number;
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
  orders: OrderRow[] = [];
  filteredOrders: OrderRow[] = [];
  activeTab: 'all' | 'pending' | 'shipping' | 'delivered' = 'all';
  viewMode: 'grid' | 'list' = 'list';
  showColumnPanel = false;
  filterPaymentMethod: 'all' | PaymentMethod = 'all';
  filterCity: 'all' | 'HCMC' | 'Thu Duc' | 'Binh Thanh' | 'Phu Nhuan' = 'all';
  filterCodOnly = false;
  dateFrom = '';
  dateTo = '';
  selectedIds = new Set<string>();
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

  private openOrders = new Set<string>(['10032']);
  private searchTerm = '';
  private appliedSearchTerm = '';
  readonly orderMeta: Record<string, OrderMeta> = {
    '10032': {
      id: '10032',
      customer: 'Ngo Viet Thanh',
      createdAt: '09/10/2025 08:58 PM',
      dateISO: '2025-10-09',
      paymentStatus: 'paid',
      fulfillmentStatus: 'pending',
      paymentMethod: 'Card',
      city: 'HCMC',
      cod: false,
      items: 19,
      total: '1,375,000 đ',
      updatedAt: '09/10/2025 10:15',
      updatedBy: 'Admin',
      slaMinutes: 180
    },
    '10031': {
      id: '10031',
      customer: 'Nguyen Quoc Thinh',
      createdAt: '09/10/2025 09:30 PM',
      dateISO: '2025-10-09',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      paymentMethod: 'COD',
      city: 'HCMC',
      cod: true,
      items: 18,
      total: '1,430,000 đ',
      updatedAt: '09/10/2025 11:10',
      updatedBy: 'Manager',
      slaMinutes: 260
    },
    '10030': {
      id: '10030',
      customer: 'Tran Quoc Hao',
      createdAt: '09/10/2025 09:42 PM',
      dateISO: '2025-10-09',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      paymentMethod: 'Bank transfer',
      city: 'Thu Duc',
      cod: false,
      items: 32,
      total: '2,418,000 đ',
      updatedAt: '09/10/2025 11:20',
      updatedBy: 'Admin',
      slaMinutes: 240
    },
    '10029': {
      id: '10029',
      customer: 'Huynh Vi Khoi',
      createdAt: '09/10/2025 10:27 PM',
      dateISO: '2025-10-09',
      paymentStatus: 'paid',
      fulfillmentStatus: 'done',
      paymentMethod: 'Card',
      city: 'HCMC',
      cod: false,
      items: 37,
      total: '2,738,000 đ',
      updatedAt: '10/10/2025 09:30',
      updatedBy: 'Admin',
      slaMinutes: 120
    },
    '10028': {
      id: '10028',
      customer: 'Le Thao Nguyen',
      createdAt: '10/10/2025 08:10 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'pending',
      fulfillmentStatus: 'waiting',
      paymentMethod: 'COD',
      city: 'HCMC',
      cod: true,
      items: 11,
      total: '980,000 đ',
      updatedAt: '10/10/2025 09:05',
      updatedBy: 'Staff',
      slaMinutes: 200
    },
    '10027': {
      id: '10027',
      customer: 'Pham Gia Han',
      createdAt: '10/10/2025 08:42 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'shipping',
      paymentMethod: 'Card',
      city: 'Binh Thanh',
      cod: false,
      items: 8,
      total: '715,000 đ',
      updatedAt: '10/10/2025 09:25',
      updatedBy: 'Admin',
      slaMinutes: 90
    },
    '10026': {
      id: '10026',
      customer: 'Trinh Quoc Bao',
      createdAt: '10/10/2025 09:05 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'pending',
      fulfillmentStatus: 'waiting',
      paymentMethod: 'COD',
      city: 'HCMC',
      cod: true,
      items: 14,
      total: '1,120,000 đ',
      updatedAt: '10/10/2025 10:05',
      updatedBy: 'Manager',
      slaMinutes: 210
    },
    '10025': {
      id: '10025',
      customer: 'Do Minh Khang',
      createdAt: '10/10/2025 09:30 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'done',
      paymentMethod: 'Card',
      city: 'HCMC',
      cod: false,
      items: 6,
      total: '560,000 đ',
      updatedAt: '10/10/2025 10:40',
      updatedBy: 'Admin',
      slaMinutes: 70
    },
    '10024': {
      id: '10024',
      customer: 'Hoang Gia Linh',
      createdAt: '10/10/2025 10:05 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'pending',
      fulfillmentStatus: 'waiting',
      paymentMethod: 'COD',
      city: 'Binh Thanh',
      cod: true,
      items: 4,
      total: '420,000 đ',
      updatedAt: '10/10/2025 10:40',
      updatedBy: 'Staff',
      slaMinutes: 230
    },
    '10023': {
      id: '10023',
      customer: 'Tran My An',
      createdAt: '10/10/2025 10:40 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'shipping',
      paymentMethod: 'E-wallet',
      city: 'Phu Nhuan',
      cod: false,
      items: 7,
      total: '910,000 đ',
      updatedAt: '10/10/2025 11:15',
      updatedBy: 'Admin',
      slaMinutes: 110
    },
    '10022': {
      id: '10022',
      customer: 'Nguyen Ha Vy',
      createdAt: '10/10/2025 11:05 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'done',
      paymentMethod: 'Card',
      city: 'Binh Thanh',
      cod: false,
      items: 9,
      total: '1,120,000 đ',
      updatedAt: '10/10/2025 11:50',
      updatedBy: 'Manager',
      slaMinutes: 85
    },
    '10021': {
      id: '10021',
      customer: 'Pham Hong Son',
      createdAt: '10/10/2025 11:30 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      paymentMethod: 'Bank transfer',
      city: 'HCMC',
      cod: false,
      items: 3,
      total: '390,000 đ',
      updatedAt: '11/10/2025 08:10',
      updatedBy: 'Staff',
      slaMinutes: 160
    },
    '10020': {
      id: '10020',
      customer: 'Le Kim Yen',
      createdAt: '10/10/2025 11:50 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'shipping',
      paymentMethod: 'Card',
      city: 'HCMC',
      cod: false,
      items: 10,
      total: '1,240,000 đ',
      updatedAt: '11/10/2025 08:35',
      updatedBy: 'Admin',
      slaMinutes: 95
    },
    '10019': {
      id: '10019',
      customer: 'Vo Minh Thu',
      createdAt: '10/10/2025 12:10 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'done',
      paymentMethod: 'Card',
      city: 'HCMC',
      cod: false,
      items: 5,
      total: '640,000 đ',
      updatedAt: '11/10/2025 09:00',
      updatedBy: 'Manager',
      slaMinutes: 75
    },
    '10018': {
      id: '10018',
      customer: 'Tran Duc Bao',
      createdAt: '10/10/2025 12:35 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'pending',
      fulfillmentStatus: 'waiting',
      paymentMethod: 'COD',
      city: 'HCMC',
      cod: true,
      items: 12,
      total: '1,560,000 đ',
      updatedAt: '11/10/2025 09:40',
      updatedBy: 'Staff',
      slaMinutes: 210
    },
    '10017': {
      id: '10017',
      customer: 'Le Thi Hanh',
      createdAt: '10/10/2025 12:55 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'pending',
      paymentMethod: 'Card',
      city: 'Thu Duc',
      cod: false,
      items: 8,
      total: '980,000 đ',
      updatedAt: '11/10/2025 10:05',
      updatedBy: 'Admin',
      slaMinutes: 150
    },
    '10016': {
      id: '10016',
      customer: 'Nguyen Gia Bao',
      createdAt: '10/10/2025 01:15 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'pending',
      fulfillmentStatus: 'waiting',
      paymentMethod: 'COD',
      city: 'Thu Duc',
      cod: true,
      items: 5,
      total: '650,000 đ',
      updatedAt: '11/10/2025 10:25',
      updatedBy: 'Staff',
      slaMinutes: 190
    },
    '10015': {
      id: '10015',
      customer: 'Tran Quoc Huy',
      createdAt: '10/10/2025 01:40 PM',
      dateISO: '2025-10-10',
      paymentStatus: 'paid',
      fulfillmentStatus: 'done',
      paymentMethod: 'Card',
      city: 'HCMC',
      cod: false,
      items: 9,
      total: '1,050,000 đ',
      updatedAt: '11/10/2025 11:05',
      updatedBy: 'Manager',
      slaMinutes: 80
    }
  };
  private readonly searchIndex: Record<string, string> = {
    '10032': '10032 ngo viet thanh l1 l2 l3 low cal',
    '10031': '10031 nguyen quoc thinh l4 l5 low cal',
    '10030': '10030 tran quoc hao l6 l7 l8 low cal',
    '10029': '10029 huynh vi khoi l9 l10 b1 balanced',
    '10028': '10028 le thao nguyen b2 b3 b4 balanced',
    '10027': '10027 pham gia han b5 b6 balanced',
    '10026': '10026 trinh quoc bao b7 b8 b9 balanced',
    '10025': '10025 do minh khang b10 balanced',
    '10024': '10024 hoang gia linh l4 l5 low cal',
    '10023': '10023 tran my an b1 b2 balanced',
    '10022': '10022 nguyen ha vy b3 balanced',
    '10021': '10021 pham hong son l6 low cal',
    '10020': '10020 le kim yen l7 balanced',
    '10019': '10019 vo minh thu b4 balanced',
    '10018': '10018 tran duc bao l8 low cal',
    '10017': '10017 le thi hanh b5 balanced',
    '10016': '10016 nguyen gia bao l9 low cal',
    '10015': '10015 tran quoc huy b6 balanced'
  };

  ngOnInit(): void {
    void this.loadOrders();
  }

  async loadOrders() {
    try {
      const response = await fetch('assets/healthy/json/admin_data.json');
      const data = await response.json();
      const transactions = Array.isArray(data?.transactions) ? data.transactions : [];

      this.orders = transactions.map((order: OrderRow, index: number) => ({
        ...order,
        itemCount: (index % 5) + 1
      }));
    } catch {
      this.orders = [];
      this.filteredOrders = [];
    }
  }

  viewOrder(orderId: string) {
    alert(`View order details for: ${orderId}`);
  }

  editOrder(orderId: string) {
    alert(`Edit order: ${orderId}`);
  }

  updateStatus(orderId: string) {
    const newStatus = prompt(
      `Update status for order ${orderId}:\n1. completed\n2. pending\n3. processing\n4. cancelled`
    );
    if (newStatus) {
      alert(`Order ${orderId} status updated to: ${newStatus}`);
      this.applyFilters();
    }
  }

  trackByOrderId(_: number, order: OrderRow) {
    return order.id;
  }

  toggleOrder(orderId: string) {
    if (this.openOrders.has(orderId)) {
      this.openOrders.delete(orderId);
      return;
    }
    this.openOrders.add(orderId);
  }

  isOpen(orderId: string) {
    return this.openOrders.has(orderId);
  }

  filterTab(tab: 'all' | 'pending' | 'shipping' | 'delivered') {
    this.activeTab = tab;
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
  }

  changeView(view: 'grid' | 'list') {
    this.viewMode = view;
  }

  applyFilters() {
    this.appliedSearchTerm = this.searchTerm.trim();
  }

  toggleColumnPanel() {
    this.showColumnPanel = !this.showColumnPanel;
  }

  toggleSelectAllVisible(event: Event) {
    const target = event.target as HTMLInputElement;
    const visibleIds = this.getVisibleOrderIds();
    if (target.checked) {
      visibleIds.forEach((id) => this.selectedIds.add(id));
    } else {
      visibleIds.forEach((id) => this.selectedIds.delete(id));
    }
  }

  toggleSelectOrder(orderId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedIds.add(orderId);
    } else {
      this.selectedIds.delete(orderId);
    }
  }

  isSelected(orderId: string) {
    return this.selectedIds.has(orderId);
  }

  isAllSelectedVisible() {
    const visibleIds = this.getVisibleOrderIds();
    return visibleIds.length > 0 && visibleIds.every((id) => this.selectedIds.has(id));
  }

  getDetailsColspan() {
    return Object.values(this.columnVisibility).filter(Boolean).length;
  }

  getPaymentLabel(orderId: string) {
    return this.orderMeta[orderId]?.paymentStatus === 'paid' ? 'Paid' : 'Unpaid';
  }

  getPaymentClass(orderId: string) {
    return this.orderMeta[orderId]?.paymentStatus === 'paid' ? 'paid' : 'pending';
  }

  getFulfillmentLabel(orderId: string) {
    const status = this.orderMeta[orderId]?.fulfillmentStatus;
    if (status === 'done') {
      return 'Delivered';
    }
    if (status === 'shipping') {
      return 'Shipping';
    }
    if (status === 'waiting') {
      return 'Not delivered';
    }
    return 'Pending';
  }

  getFulfillmentClass(orderId: string) {
    const status = this.orderMeta[orderId]?.fulfillmentStatus;
    if (status === 'done') {
      return 'done';
    }
    if (status === 'shipping') {
      return 'shipping';
    }
    if (status === 'waiting') {
      return 'waiting';
    }
    return 'pending';
  }

  updateOrderStatus(orderId: string, type: 'payment' | 'fulfillment', value: string) {
    const meta = this.orderMeta[orderId];
    if (!meta) {
      return;
    }
    if (type === 'payment') {
      meta.paymentStatus = value as PaymentStatus;
    } else {
      meta.fulfillmentStatus = value as FulfillmentStatus;
    }
    meta.updatedAt = this.getNowLabel();
    meta.updatedBy = 'Admin';
  }

  bulkConfirm() {
    if (this.selectedIds.size === 0) {
      return;
    }
    this.selectedIds.forEach((id) => this.updateOrderStatus(id, 'fulfillment', 'pending'));
    alert(`Confirmed ${this.selectedIds.size} orders`);
  }

  bulkShip() {
    if (this.selectedIds.size === 0) {
      return;
    }
    this.selectedIds.forEach((id) => this.updateOrderStatus(id, 'fulfillment', 'shipping'));
    alert(`Marked ${this.selectedIds.size} orders as shipping`);
  }

  bulkExport() {
    if (this.selectedIds.size === 0) {
      return;
    }
    alert(`Exported ${this.selectedIds.size} orders`);
  }

  shouldShowOrder(
    paymentStatus: 'paid' | 'pending',
    fulfillmentStatus: 'waiting' | 'shipping' | 'done' | 'pending',
    orderId: string
  ) {
    const meta = this.orderMeta[orderId];
    if (!meta) {
      return false;
    }
    let matchesTab = true;
    if (this.activeTab === 'pending') {
      matchesTab = meta.fulfillmentStatus === 'pending' || meta.fulfillmentStatus === 'waiting';
    } else if (this.activeTab === 'shipping') {
      matchesTab = meta.fulfillmentStatus === 'shipping';
    } else if (this.activeTab === 'delivered') {
      matchesTab = meta.fulfillmentStatus === 'done';
    }

    if (!matchesTab) {
      return false;
    }

    if (this.filterPaymentMethod !== 'all' && meta.paymentMethod !== this.filterPaymentMethod) {
      return false;
    }

    if (this.filterCity !== 'all' && meta.city !== this.filterCity) {
      return false;
    }

    if (this.filterCodOnly && !meta.cod) {
      return false;
    }

    if (this.dateFrom && meta.dateISO < this.dateFrom) {
      return false;
    }

    if (this.dateTo && meta.dateISO > this.dateTo) {
      return false;
    }

    if (!this.appliedSearchTerm) {
      return true;
    }

    return (this.searchIndex[orderId] || '').includes(this.appliedSearchTerm);
  }

  getOrderActivity(orderId: string) {
    const meta = this.orderMeta[orderId];
    if (!meta) {
      return [];
    }
    const paymentLabel = meta.paymentStatus === 'paid' ? 'Payment captured' : 'Awaiting payment';
    const fulfillmentLabel =
      meta.fulfillmentStatus === 'done'
        ? 'Order delivered'
        : meta.fulfillmentStatus === 'shipping'
          ? 'Handed to courier'
          : 'Processing started';
    return [
      `Order created • ${meta.createdAt}`,
      `${paymentLabel} • ${meta.updatedAt}`,
      `${fulfillmentLabel} • ${meta.updatedAt}`
    ];
  }

  getOrderNotes(orderId: string) {
    const meta = this.orderMeta[orderId];
    if (!meta) {
      return [];
    }
    return [
      `Status updated by ${meta.updatedBy} • ${meta.updatedAt}`,
      `Customer requested quick delivery • ${meta.createdAt}`
    ];
  }

  getSlaLabel(orderId: string) {
    const meta = this.orderMeta[orderId];
    if (!meta) {
      return '';
    }
    const hours = Math.floor(meta.slaMinutes / 60);
    const minutes = meta.slaMinutes % 60;
    return `SLA ${hours}h ${minutes}m`;
  }

  getVisibleOrderIds() {
    return Object.keys(this.orderMeta).filter((orderId) =>
      this.shouldShowOrder(
        this.orderMeta[orderId].paymentStatus,
        this.orderMeta[orderId].fulfillmentStatus,
        orderId
      )
    );
  }

  getNowLabel() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  archiveOrder(orderId: string) {
    alert(`Archive order: #${orderId}`);
  }

  printOrder(orderId: string) {
    alert(`Print order: #${orderId}`);
  }

  cancelOrder(orderId: string) {
    alert(`Cancel order: #${orderId}`);
  }

  confirmOrder(orderId: string) {
    alert(`Confirm order: #${orderId}`);
  }

  deliverOrder(orderId: string) {
    alert(`Deliver order: #${orderId}`);
  }
}
