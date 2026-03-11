import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer, CustomerDetail } from '../../models/customer.model';

interface DisplayCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  lastOrderId: string;
  totalOrders: number;
  avgOrder: string;
  debt: string;
  totalSpent: string;
  updatedAt: string;
  daysActive: number;
  statusLabel: string;
  marketingStatus: string;
  rating: number;
  feedback: string;
  segments: string[];
  rfm: { recencyDays: number; frequency: number; monetary: number };
  clv: string;
  healthScore: number;
  churnRisk: { label: string; score: number };
  source: string;
  preferredChannel: string;
  campaign: string;
  support: { openTickets: number; lastContact: string; owner: string; slaHours: number; slaStatus: string };
  timeline: string[];
  notes: string[];
  audit: string[];
}

@Component({
  selector: 'app-customer-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './customer-admin.component.html',
  styleUrl: './customer-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerAdminComponent implements OnInit {
  private customerService = inject(CustomerService);
  private cdr = inject(ChangeDetectorRef);

  readonly ratingStars = [1, 2, 3, 4, 5];
  showDetail = false;
  actionMessage = '';
  newNote = '';
  isLoading = true;
  error = '';

  customers: DisplayCustomer[] = [];
  selectedCustomer!: DisplayCustomer;

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data.map(c => this.mapCustomer(c));
        if (this.customers.length > 0) {
          this.selectedCustomer = this.customers[0];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Load customers error:', err);
        this.error = 'Không thể tải danh sách khách hàng.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private mapCustomer(c: Customer): DisplayCustomer {
    const name = c.fullName || c.username;
    const totalSpentNum = c.totalSpent ?? 0;
    const avgOrderNum = c.totalOrders > 0 ? Math.round(totalSpentNum / c.totalOrders) : 0;
    const createdDate = new Date(c.createdAt);
    const daysActive = Math.floor((Date.now() - createdDate.getTime()) / 86400000);

    // Derive status label from orders
    let statusLabel = 'New customer';
    if (c.totalOrders >= 20) statusLabel = 'VIP customer';
    else if (c.totalOrders >= 10) statusLabel = 'Loyal customer';
    else if (c.totalOrders >= 5) statusLabel = 'Potential customer';

    // Derive simple churn risk
    const churnScore = Math.max(0, 100 - c.totalOrders * 3);
    const churnLabel = churnScore >= 70 ? 'High' : churnScore >= 40 ? 'Medium' : 'Low';

    // Derive health score
    const healthScore = Math.min(100, 40 + c.totalOrders * 2);

    // Derive CLV estimate
    const clvEstimate = totalSpentNum * 2;

    // Derive segments
    const segments: string[] = [];
    if (c.totalOrders >= 20) segments.push('VIP');
    else if (c.totalOrders >= 10) segments.push('Loyal');
    else if (c.totalOrders >= 5) segments.push('Potential');
    else segments.push('New');

    const createdFormatted = createdDate.toLocaleDateString('vi-VN');

    return {
      id: c.id,
      name,
      phone: c.phone ?? 'N/A',
      email: c.email,
      address: c.address ?? 'N/A',
      lastOrderId: 'N/A',
      totalOrders: c.totalOrders,
      avgOrder: avgOrderNum > 0 ? avgOrderNum.toLocaleString('vi-VN') + ' đ' : 'N/A',
      debt: '0 đ',
      totalSpent: totalSpentNum.toLocaleString('vi-VN') + ' đ',
      updatedAt: createdFormatted,
      daysActive,
      statusLabel,
      marketingStatus: 'Subscribed to promotions',
      rating: 4,
      feedback: 'No feedback yet.',
      segments,
      rfm: {
        recencyDays: Math.max(1, 30 - c.totalOrders),
        frequency: Math.min(5, Math.ceil(c.totalOrders / 5)),
        monetary: Math.min(5, Math.ceil(totalSpentNum / 2000000))
      },
      clv: clvEstimate.toLocaleString('vi-VN') + ' đ',
      healthScore,
      churnRisk: { label: churnLabel, score: churnScore },
      source: 'Organic',
      preferredChannel: 'Zalo',
      campaign: 'Always-on',
      support: {
        openTickets: 0,
        lastContact: createdFormatted,
        owner: 'CS Team',
        slaHours: 4,
        slaStatus: 'On track'
      },
      timeline: [`Account created • ${createdFormatted}`],
      notes: [],
      audit: [`Profile created • System`]
    };
  }

  selectCustomer(customer: DisplayCustomer): void {
    this.selectedCustomer = customer;
    this.showDetail = true;
    this.actionMessage = '';
    this.newNote = '';
    // Load real orders for this customer
    this.customerService.getCustomerById(customer.id).subscribe({
      next: (detail: CustomerDetail) => {
        if (detail.orders && detail.orders.length > 0) {
          const latest = detail.orders[0];
          const idx = this.customers.findIndex(c => c.id === customer.id);
          if (idx >= 0) {
            this.customers[idx].lastOrderId = (latest as any).orderNumber ?? latest.id;
            this.selectedCustomer = this.customers[idx];
          }
        }
        this.cdr.markForCheck();
      },
      error: () => { /* silently ignore */ }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  openDetail(customer: DisplayCustomer): void {
    this.selectCustomer(customer);
  }

  backToList(): void {
    this.showDetail = false;
  }

  addNote(): void {
    const note = this.newNote.trim();
    if (!note) return;
    const timestamp = new Date().toLocaleString('vi-VN');
    this.selectedCustomer = {
      ...this.selectedCustomer,
      notes: [`${timestamp} • Admin: ${note}`, ...this.selectedCustomer.notes],
      audit: [`Note added • ${timestamp}`, ...this.selectedCustomer.audit]
    };
    this.newNote = '';
    this.cdr.markForCheck();
  }

  performAction(action: string): void {
    const timestamp = new Date().toLocaleString('vi-VN');
    this.selectedCustomer = {
      ...this.selectedCustomer,
      timeline: [`${action} • ${timestamp}`, ...this.selectedCustomer.timeline],
      audit: [`${action} • ${timestamp}`, ...this.selectedCustomer.audit]
    };
    this.actionMessage = `${action} saved to timeline.`;
    this.cdr.markForCheck();
  }

  getRiskClass(score: number): string {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getHealthClass(score: number): string {
    if (score >= 80) return 'health-high';
    if (score >= 55) return 'health-medium';
    return 'health-low';
  }
}
