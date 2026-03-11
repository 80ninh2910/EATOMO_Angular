import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, RevenueDataPoint, TopProduct, RecentOrder } from '../../models/dashboard.model';

@Component({
  selector: 'app-report-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, DecimalPipe],
  templateUrl: './report-admin.component.html',
  styleUrl: './report-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAdminComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  stats: DashboardStats | null = null;
  revenueChart: RevenueDataPoint[] = [];
  topProducts: TopProduct[] = [];
  recentOrders: RecentOrder[] = [];

  period: 'daily' | 'weekly' | 'monthly' = 'weekly';
  isLoadingStats = false;
  isLoadingChart = false;
  isLoadingProducts = false;
  isLoadingOrders = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadStats();
    this.loadChart();
    this.loadTopProducts();
    this.loadRecentOrders();
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.dashboardService.getStats().subscribe({
      next: data => {
        this.stats = data;
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = 'Could not load stats: ' + (err.error?.message || err.message);
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadChart(): void {
    this.isLoadingChart = true;
    this.dashboardService.getRevenueChart(this.period).subscribe({
      next: data => {
        this.revenueChart = data;
        this.isLoadingChart = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.revenueChart = [];
        this.isLoadingChart = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTopProducts(): void {
    this.isLoadingProducts = true;
    this.dashboardService.getTopProducts(10).subscribe({
      next: data => {
        this.topProducts = data;
        this.isLoadingProducts = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.topProducts = [];
        this.isLoadingProducts = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadRecentOrders(): void {
    this.isLoadingOrders = true;
    this.dashboardService.getRecentOrders(10).subscribe({
      next: data => {
        this.recentOrders = data;
        this.isLoadingOrders = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.recentOrders = [];
        this.isLoadingOrders = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPeriodChange(p: 'daily' | 'weekly' | 'monthly'): void {
    this.period = p;
    this.loadChart();
  }

  /** Chart bar height as % relative to max revenue */
  barHeight(value: number): number {
    const max = Math.max(...this.revenueChart.map(d => d.revenue), 1);
    return Math.round((value / max) * 100);
  }

  /** Format growth number with + sign */
  growthLabel(v: number): string {
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'badge-done',
      delivering: 'badge-shipping',
      preparing: 'badge-waiting',
      confirmed: 'badge-waiting',
      pending: 'badge-pending',
      cancelled: 'badge-cancelled'
    };
    return map[status] ?? 'badge-pending';
  }

  trackByLabel(_i: number, d: RevenueDataPoint) { return d.label; }
  trackByBowl(_i: number, p: TopProduct) { return p.bowlId; }
  trackByOrder(_i: number, o: RecentOrder) { return o.id; }
}
