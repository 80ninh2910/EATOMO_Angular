import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-customer-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './customer-admin.component.html',
  styleUrl: './customer-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerAdminComponent {
  private readonly defaultCustomer = {
    segments: ['Regular'],
    rfm: {
      recencyDays: 14,
      frequency: 3,
      monetary: 3
    },
    clv: '12,500,000 d',
    healthScore: 70,
    churnRisk: {
      label: 'Low',
      score: 15
    },
    source: 'Organic',
    preferredChannel: 'Zalo',
    campaign: 'Always-on',
    consent: true,
    support: {
      openTickets: 0,
      lastContact: '20/10/2025 10:30',
      owner: 'CS Team',
      slaHours: 4,
      slaStatus: 'On track'
    },
    timeline: ['Account created • 01/05/2025 09:00', 'First order placed • 05/05/2025 11:30'],
    notes: ['Customer prefers lunch deliveries.'],
    audit: ['Profile created • System']
  };

  readonly ratingStars = [1, 2, 3, 4, 5];
  showDetail = false;
  actionMessage = '';
  newNote = '';

  readonly customers = [
    this.buildCustomer({
      id: '#10045',
      name: 'Nguyen Van An',
      phone: '0901234567',
      email: 'nguyenvanan@gmail.com',
      address: '123 Nguyen Hue, Q1, TP.HCM',
      lastOrderId: '#10045',
      totalOrders: 15,
      avgOrder: '2,500,000 d',
      debt: '0 d',
      totalSpent: '37,500,000 d',
      updatedAt: '18/10/2025 14:30',
      daysActive: 128,
      statusLabel: 'Loyal customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 4,
      feedback: 'Great meals and fast delivery. Will order again.',
      segments: ['VIP', 'Loyal'],
      rfm: { recencyDays: 3, frequency: 5, monetary: 5 },
      clv: '185,000,000 d',
      healthScore: 92,
      churnRisk: { label: 'Low', score: 8 },
      source: 'Referral',
      preferredChannel: 'Zalo',
      campaign: 'New year 2025',
      support: {
        openTickets: 0,
        lastContact: '19/10/2025 09:10',
        owner: 'CS Team',
        slaHours: 2,
        slaStatus: 'On track'
      },
      timeline: [
        'Order #10045 delivered • 18/10/2025 14:20',
        'NPS response: 9/10 • 17/10/2025 18:05',
        'Welcome voucher used • 10/10/2025 12:30'
      ],
      notes: ['Prefers low-sugar meals.', 'Send weekend menu updates.'],
      audit: ['Status set to Loyal • Admin', 'Marketing consent updated • Admin']
    }),
    this.buildCustomer({
      id: '#10052',
      name: 'Tran Thi Binh',
      phone: '0912345678',
      email: 'tranthibinh@gmail.com',
      address: '456 Le Loi, Q3, TP.HCM',
      lastOrderId: '#10052',
      totalOrders: 28,
      avgOrder: '1,800,000 d',
      debt: '-500,000 d',
      totalSpent: '50,400,000 d',
      updatedAt: '19/10/2025 09:15',
      daysActive: 214,
      statusLabel: 'Potential customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'Ordered many times, quality is consistent.',
      segments: ['Potential', 'At-risk'],
      rfm: { recencyDays: 21, frequency: 4, monetary: 3 },
      clv: '98,000,000 d',
      healthScore: 68,
      churnRisk: { label: 'Medium', score: 52 },
      source: 'Ads',
      preferredChannel: 'Email',
      campaign: 'Healthy week',
      support: {
        openTickets: 1,
        lastContact: '18/10/2025 16:40',
        owner: 'Anna (CS)',
        slaHours: 6,
        slaStatus: 'At risk'
      },
      timeline: [
        'Order #10052 pending payment • 19/10/2025 09:05',
        'Support ticket opened: Billing • 18/10/2025 16:40'
      ],
      notes: ['Waiting for payment confirmation.'],
      audit: ['Ticket assigned to Anna • Admin']
    }),
    this.buildCustomer({
      id: '#10038',
      name: 'Le Minh Chau',
      phone: '0923456789',
      email: 'leminhchau@gmail.com',
      address: '789 Dien Bien Phu, Q. Binh Thanh',
      lastOrderId: '#10038',
      totalOrders: 42,
      avgOrder: '3,200,000 d',
      debt: '1,200,000 d',
      totalSpent: '134,400,000 d',
      updatedAt: '17/10/2025 16:45',
      daysActive: 365,
      statusLabel: 'VIP customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'Customer service is excellent.',
      segments: ['VIP', 'Advocate'],
      rfm: { recencyDays: 2, frequency: 5, monetary: 5 },
      clv: '260,000,000 d',
      healthScore: 96,
      churnRisk: { label: 'Low', score: 6 },
      source: 'Referral',
      preferredChannel: 'Phone',
      campaign: 'VIP care',
      support: {
        openTickets: 0,
        lastContact: '17/10/2025 16:20',
        owner: 'CS Team',
        slaHours: 2,
        slaStatus: 'On track'
      },
      timeline: [
        'Order #10038 delivered • 17/10/2025 16:45',
        'VIP gift sent • 15/10/2025 09:15'
      ],
      notes: ['Always prefers premium packaging.'],
      audit: ['Upgraded to VIP • Admin']
    }),
    this.buildCustomer({
      id: '#10058',
      name: 'Pham Hoang Dung',
      phone: '0934567890',
      email: 'phamhoangdung@gmail.com',
      address: '321 Vo Van Tan, Q3, TP.HCM',
      lastOrderId: '#10058',
      totalOrders: 8,
      avgOrder: '4,500,000 d',
      debt: '0 d',
      totalSpent: '36,000,000 d',
      updatedAt: '20/10/2025 11:20',
      daysActive: 92,
      statusLabel: 'New customer',
      marketingStatus: 'Not subscribed',
      rating: 3,
      feedback: 'Would like more value combos.',
      segments: ['New'],
      rfm: { recencyDays: 9, frequency: 2, monetary: 4 },
      clv: '28,000,000 d',
      healthScore: 58,
      churnRisk: { label: 'Medium', score: 48 },
      source: 'Organic',
      preferredChannel: 'Zalo',
      campaign: 'Starter kit',
      support: {
        openTickets: 0,
        lastContact: '20/10/2025 11:00',
        owner: 'CS Team',
        slaHours: 5,
        slaStatus: 'On track'
      },
      timeline: ['Order #10058 delivered • 20/10/2025 11:20'],
      notes: ['Offer starter bundle next time.'],
      audit: ['Profile verified • Admin']
    }),
    this.buildCustomer({
      id: '#10029',
      name: 'Vo Thi Lan',
      phone: '0945678901',
      email: 'vothilan@gmail.com',
      address: '654 Cach Mang Thang 8, Q10',
      lastOrderId: '#10029',
      totalOrders: 55,
      avgOrder: '2,100,000 d',
      debt: '-2,500,000 d',
      totalSpent: '115,500,000 d',
      updatedAt: '16/10/2025 13:00',
      daysActive: 412,
      statusLabel: 'VIP customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 4,
      feedback: 'Service is good, hoping for more offers.',
      segments: ['VIP', 'Deal seeker'],
      rfm: { recencyDays: 7, frequency: 5, monetary: 4 },
      clv: '210,000,000 d',
      healthScore: 88,
      churnRisk: { label: 'Low', score: 14 },
      source: 'Referral',
      preferredChannel: 'Email',
      campaign: 'Rewards',
      support: {
        openTickets: 1,
        lastContact: '16/10/2025 12:00',
        owner: 'Minh (CS)',
        slaHours: 8,
        slaStatus: 'At risk'
      },
      timeline: ['Reward redeemed • 16/10/2025 12:20', 'Ticket: Coupon issue • 16/10/2025 12:00'],
      notes: ['Sensitive to delivery time.'],
      audit: ['Applied loyalty voucher • Admin']
    }),
    this.buildCustomer({
      id: '#10061',
      name: 'Dang Quoc Huy',
      phone: '0956789012',
      email: 'dangquochuy@gmail.com',
      address: '987 Hai Ba Trung, Q1, TP.HCM',
      lastOrderId: '#10061',
      totalOrders: 22,
      avgOrder: '5,200,000 d',
      debt: '800,000 d',
      totalSpent: '114,400,000 d',
      updatedAt: '19/10/2025 15:30',
      daysActive: 188,
      statusLabel: 'Potential customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'Portions are good and delivery is on time.',
      segments: ['Potential', 'High value'],
      rfm: { recencyDays: 12, frequency: 4, monetary: 5 },
      clv: '160,000,000 d',
      healthScore: 78,
      churnRisk: { label: 'Low', score: 25 },
      source: 'Ads',
      preferredChannel: 'Zalo',
      campaign: 'Office lunch',
      support: {
        openTickets: 0,
        lastContact: '19/10/2025 15:10',
        owner: 'CS Team',
        slaHours: 4,
        slaStatus: 'On track'
      },
      timeline: ['Order #10061 delivered • 19/10/2025 15:30'],
      notes: ['Corporate billing requested.'],
      audit: ['Billing note added • Admin']
    }),
    this.buildCustomer({
      id: '#10021',
      name: 'Hoang Thi Mai',
      phone: '0967890123',
      email: 'hoangthimai@gmail.com',
      address: '159 Pasteur, Q1, TP.HCM',
      lastOrderId: '#10021',
      totalOrders: 12,
      avgOrder: '1,500,000 d',
      debt: '0 d',
      totalSpent: '18,000,000 d',
      updatedAt: '15/10/2025 10:45',
      daysActive: 74,
      statusLabel: 'New customer',
      marketingStatus: 'Not subscribed',
      rating: 4,
      feedback: 'Tasty meals and nice packaging.',
      segments: ['New'],
      rfm: { recencyDays: 20, frequency: 2, monetary: 2 },
      clv: '22,000,000 d',
      healthScore: 54,
      churnRisk: { label: 'Medium', score: 60 },
      source: 'Organic',
      preferredChannel: 'Zalo',
      campaign: 'Starter kit',
      support: {
        openTickets: 0,
        lastContact: '15/10/2025 10:30',
        owner: 'CS Team',
        slaHours: 6,
        slaStatus: 'On track'
      },
      timeline: ['Order #10021 delivered • 15/10/2025 10:45'],
      notes: ['Send onboarding tips.'],
      audit: ['Welcome email sent • System']
    }),
    this.buildCustomer({
      id: '#10055',
      name: 'Bui Van Nam',
      phone: '0978901234',
      email: 'buivannam@gmail.com',
      address: '753 Ly Thuong Kiet, Q11, TP.HCM',
      lastOrderId: '#10055',
      totalOrders: 67,
      avgOrder: '2,800,000 d',
      debt: '-1,800,000 d',
      totalSpent: '187,600,000 d',
      updatedAt: '20/10/2025 08:00',
      daysActive: 520,
      statusLabel: 'VIP customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'Very satisfied with the service quality.',
      segments: ['VIP', 'Loyal'],
      rfm: { recencyDays: 1, frequency: 5, monetary: 5 },
      clv: '320,000,000 d',
      healthScore: 97,
      churnRisk: { label: 'Low', score: 4 },
      source: 'Referral',
      preferredChannel: 'Phone',
      campaign: 'VIP care',
      support: {
        openTickets: 0,
        lastContact: '20/10/2025 07:40',
        owner: 'CS Team',
        slaHours: 2,
        slaStatus: 'On track'
      },
      timeline: ['Order #10055 delivered • 20/10/2025 08:00'],
      notes: ['Prefers early morning delivery.'],
      audit: ['VIP status confirmed • Admin']
    }),
    this.buildCustomer({
      id: '#10043',
      name: 'Ngo Thi Phuong',
      phone: '0989012345',
      email: 'ngothiphuong@gmail.com',
      address: '246 Tran Hung Dao, Q5, TP.HCM',
      lastOrderId: '#10043',
      totalOrders: 19,
      avgOrder: '3,600,000 d',
      debt: '500,000 d',
      totalSpent: '68,400,000 d',
      updatedAt: '18/10/2025 17:20',
      daysActive: 143,
      statusLabel: 'Potential customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 4,
      feedback: 'Would like more new dishes.',
      segments: ['Potential'],
      rfm: { recencyDays: 18, frequency: 3, monetary: 4 },
      clv: '85,000,000 d',
      healthScore: 66,
      churnRisk: { label: 'Medium', score: 55 },
      source: 'Ads',
      preferredChannel: 'Email',
      campaign: 'New dishes',
      support: {
        openTickets: 0,
        lastContact: '18/10/2025 17:00',
        owner: 'CS Team',
        slaHours: 6,
        slaStatus: 'On track'
      },
      timeline: ['Menu feedback received • 18/10/2025 17:05'],
      notes: ['Wants more variety.'],
      audit: ['Feedback noted • Admin']
    }),
    this.buildCustomer({
      id: '#10032',
      name: 'Nguyen Thi Ly',
      phone: '0932946270',
      email: 'lynguyennn@gmail.com',
      address: 'Ho Chi Minh, Vietnam',
      lastOrderId: '#10032',
      totalOrders: 33,
      avgOrder: '3,265,545 d',
      debt: '-107,543 d',
      totalSpent: '107,763,000 d',
      updatedAt: '20/10/2025 12:00',
      daysActive: 260,
      statusLabel: 'Loyal customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'The team takes great care of customers.',
      segments: ['Loyal'],
      rfm: { recencyDays: 6, frequency: 4, monetary: 4 },
      clv: '140,000,000 d',
      healthScore: 84,
      churnRisk: { label: 'Low', score: 22 },
      source: 'Organic',
      preferredChannel: 'Zalo',
      campaign: 'Referral',
      support: {
        openTickets: 0,
        lastContact: '20/10/2025 11:40',
        owner: 'CS Team',
        slaHours: 4,
        slaStatus: 'On track'
      },
      timeline: ['Order #10032 delivered • 20/10/2025 12:00'],
      notes: ['Interested in family plan.'],
      audit: ['Profile updated • Admin']
    }),
    this.buildCustomer({
      id: '#10064',
      name: 'Vu Thanh Tam',
      phone: '0908877665',
      email: 'vuthanhtam@gmail.com',
      address: '12 Nguyen Trai, Q5, TP.HCM',
      lastOrderId: '#10064',
      totalOrders: 9,
      avgOrder: '1,250,000 d',
      debt: '0 d',
      totalSpent: '11,250,000 d',
      updatedAt: '21/10/2025 09:20',
      daysActive: 60,
      statusLabel: 'New customer',
      marketingStatus: 'Not subscribed',
      rating: 4,
      feedback: 'Fast delivery and solid packaging.',
      segments: ['New'],
      rfm: { recencyDays: 11, frequency: 2, monetary: 2 },
      clv: '18,000,000 d',
      healthScore: 52,
      churnRisk: { label: 'Medium', score: 63 },
      source: 'Ads',
      preferredChannel: 'Email',
      campaign: 'Starter kit',
      support: {
        openTickets: 0,
        lastContact: '21/10/2025 09:00',
        owner: 'CS Team',
        slaHours: 6,
        slaStatus: 'On track'
      },
      timeline: ['Welcome call completed • 21/10/2025 09:10'],
      notes: ['Add to nurture sequence.'],
      audit: ['Welcome call logged • Admin']
    }),
    this.buildCustomer({
      id: '#10070',
      name: 'Mai Khanh Linh',
      phone: '0919988776',
      email: 'maikhanhlinh@gmail.com',
      address: '95 Phan Xich Long, Phu Nhuan',
      lastOrderId: '#10070',
      totalOrders: 31,
      avgOrder: '2,350,000 d',
      debt: '0 d',
      totalSpent: '72,850,000 d',
      updatedAt: '22/10/2025 18:05',
      daysActive: 190,
      statusLabel: 'Loyal customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'Great taste, I order every week.',
      segments: ['Loyal', 'Weekly'],
      rfm: { recencyDays: 4, frequency: 4, monetary: 4 },
      clv: '120,000,000 d',
      healthScore: 86,
      churnRisk: { label: 'Low', score: 18 },
      source: 'Referral',
      preferredChannel: 'Zalo',
      campaign: 'Weekly plan',
      support: {
        openTickets: 0,
        lastContact: '22/10/2025 17:40',
        owner: 'CS Team',
        slaHours: 4,
        slaStatus: 'On track'
      },
      timeline: ['Weekly plan renewed • 22/10/2025 18:05'],
      notes: ['Likes spicy options.'],
      audit: ['Weekly plan renewal logged • Admin']
    }),
    this.buildCustomer({
      id: '#10071',
      name: 'Do Minh Khang',
      phone: '0931122334',
      email: 'dominhkhang@gmail.com',
      address: '220 Vo Thi Sau, Q3, TP.HCM',
      lastOrderId: '#10071',
      totalOrders: 18,
      avgOrder: '2,050,000 d',
      debt: '250,000 d',
      totalSpent: '36,900,000 d',
      updatedAt: '22/10/2025 12:40',
      daysActive: 140,
      statusLabel: 'Potential customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 4,
      feedback: 'Would like more low-carb options.',
      segments: ['Potential'],
      rfm: { recencyDays: 15, frequency: 3, monetary: 3 },
      clv: '70,000,000 d',
      healthScore: 62,
      churnRisk: { label: 'Medium', score: 49 },
      source: 'Organic',
      preferredChannel: 'Email',
      campaign: 'Low-carb',
      support: {
        openTickets: 0,
        lastContact: '22/10/2025 12:20',
        owner: 'CS Team',
        slaHours: 6,
        slaStatus: 'On track'
      },
      timeline: ['Survey completed • 22/10/2025 12:35'],
      notes: ['Send low-carb menu updates.'],
      audit: ['Survey response stored • System']
    }),
    this.buildCustomer({
      id: '#10075',
      name: 'Tran Gia Han',
      phone: '0974455667',
      email: 'trangiahan@gmail.com',
      address: '78 Le Van Sy, Q3, TP.HCM',
      lastOrderId: '#10075',
      totalOrders: 44,
      avgOrder: '2,950,000 d',
      debt: '0 d',
      totalSpent: '129,800,000 d',
      updatedAt: '23/10/2025 08:30',
      daysActive: 330,
      statusLabel: 'VIP customer',
      marketingStatus: 'Subscribed to promotions',
      rating: 5,
      feedback: 'Very professional service.',
      segments: ['VIP', 'Advocate'],
      rfm: { recencyDays: 3, frequency: 5, monetary: 4 },
      clv: '230,000,000 d',
      healthScore: 93,
      churnRisk: { label: 'Low', score: 12 },
      source: 'Referral',
      preferredChannel: 'Phone',
      campaign: 'VIP care',
      support: {
        openTickets: 0,
        lastContact: '23/10/2025 08:10',
        owner: 'CS Team',
        slaHours: 2,
        slaStatus: 'On track'
      },
      timeline: ['VIP check-in call • 23/10/2025 08:20'],
      notes: ['Invite to tasting event.'],
      audit: ['VIP note added • Admin']
    }),
    this.buildCustomer({
      id: '#10080',
      name: 'Le Ngoc Trinh',
      phone: '0985566778',
      email: 'lengoctrinh@gmail.com',
      address: '410 Nguyen Dinh Chieu, Q10',
      lastOrderId: '#10080',
      totalOrders: 6,
      avgOrder: '980,000 d',
      debt: '-120,000 d',
      totalSpent: '5,880,000 d',
      updatedAt: '23/10/2025 19:10',
      daysActive: 45,
      statusLabel: 'New customer',
      marketingStatus: 'Not subscribed',
      rating: 3,
      feedback: 'Need more budget-friendly options.',
      segments: ['New'],
      rfm: { recencyDays: 25, frequency: 1, monetary: 1 },
      clv: '12,000,000 d',
      healthScore: 44,
      churnRisk: { label: 'High', score: 78 },
      source: 'Ads',
      preferredChannel: 'Email',
      campaign: 'Budget plan',
      support: {
        openTickets: 1,
        lastContact: '23/10/2025 18:50',
        owner: 'Khanh (CS)',
        slaHours: 10,
        slaStatus: 'Overdue'
      },
      timeline: ['Ticket: Pricing inquiry • 23/10/2025 18:50'],
      notes: ['Offer budget combos.'],
      audit: ['Support ticket created • System']
    })
  ];

  selectedCustomer = this.customers[0];

  selectCustomer(customer: (typeof this.customers)[number]) {
    this.selectedCustomer = customer;
    this.showDetail = true;
    this.actionMessage = '';
    this.newNote = '';
  }

  getInitials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  openDetail(customer: (typeof this.customers)[number]) {
    this.selectedCustomer = customer;
    this.showDetail = true;
    this.actionMessage = '';
    this.newNote = '';
  }

  backToList() {
    this.showDetail = false;
  }

  addNote() {
    const note = this.newNote.trim();
    if (!note) return;
    const timestamp = new Date().toLocaleString('en-GB');
    this.selectedCustomer = {
      ...this.selectedCustomer,
      notes: [`${timestamp} • Admin: ${note}`, ...this.selectedCustomer.notes],
      audit: [`Note added • ${timestamp}`, ...this.selectedCustomer.audit]
    };
    this.newNote = '';
  }

  performAction(action: string) {
    const timestamp = new Date().toLocaleString('en-GB');
    this.selectedCustomer = {
      ...this.selectedCustomer,
      timeline: [`${action} • ${timestamp}`, ...this.selectedCustomer.timeline],
      audit: [`${action} • ${timestamp}`, ...this.selectedCustomer.audit]
    };
    this.actionMessage = `${action} saved to timeline.`;
  }

  getRiskClass(score: number) {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getHealthClass(score: number) {
    if (score >= 80) return 'health-high';
    if (score >= 55) return 'health-medium';
    return 'health-low';
  }

  private buildCustomer(customer: any) {
    return {
      ...this.defaultCustomer,
      ...customer,
      segments: customer.segments ?? this.defaultCustomer.segments,
      rfm: { ...this.defaultCustomer.rfm, ...(customer.rfm ?? {}) },
      churnRisk: { ...this.defaultCustomer.churnRisk, ...(customer.churnRisk ?? {}) },
      support: { ...this.defaultCustomer.support, ...(customer.support ?? {}) },
      timeline: customer.timeline ?? [...this.defaultCustomer.timeline],
      notes: customer.notes ?? [...this.defaultCustomer.notes],
      audit: customer.audit ?? [...this.defaultCustomer.audit]
    };
  }
}
