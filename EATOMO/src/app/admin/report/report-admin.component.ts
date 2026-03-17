import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, RevenueDataPoint, TopProduct, RecentOrder, ModelMonitoring, WeeklyModelMetric } from '../../models/dashboard.model';

@Component({
  selector: 'app-report-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, DecimalPipe],
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
  monitoring: ModelMonitoring | null = null;

  period: 'daily' | 'weekly' | 'monthly' = 'weekly';
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  selectedDay = new Date().getDate();
  showDateFilters = false;
  yearOptions: number[] = [];
  readonly monthOptions = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ];

  chartMax = 0;
  yAxisTicks: number[] = [];

  isLoadingStats = false;
  isLoadingChart = false;
  isLoadingProducts = false;
  isLoadingOrders = false;
  isLoadingMonitoring = false;
  error: string | null = null;

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2025; y--) this.yearOptions.push(y);
    this.loadAll();
  }

  loadAll(): void {
    this.loadStats();
    this.loadChart();
    this.loadTopProducts();
    this.loadRecentOrders();
    this.loadMonitoring();
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
    this.cdr.markForCheck();
    this.dashboardService.getRevenueChart(this.period, {
      year: this.selectedYear,
      month: this.selectedMonth,
      day: this.selectedDay
    }).subscribe({
      next: data => {
        this.revenueChart = data.map(d => ({ ...d, label: this.formatChartLabel(d.label) }));
        this.computeAxis();
        this.isLoadingChart = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.revenueChart = [];
        this.chartMax = 0;
        this.yAxisTicks = [0];
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

  loadMonitoring(): void {
    this.isLoadingMonitoring = true;
    this.dashboardService.getModelMonitoring().subscribe({
      next: data => {
        this.monitoring = {
          generatedAt: data.generatedAt,
          modelInfo: data.modelInfo,
          drift: data.drift,
          weeklyMetrics: data.weeklyMetrics || []
        };
        this.isLoadingMonitoring = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.monitoring = null;
        this.isLoadingMonitoring = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPeriodChange(p: 'daily' | 'weekly' | 'monthly'): void {
    this.period = p;
    this.cdr.markForCheck();
    this.loadChart();
  }

  onTimeFilterChange(): void {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (this.selectedDay > daysInMonth) this.selectedDay = daysInMonth;
    this.cdr.markForCheck();
    this.loadChart();
  }

  get dayOptions(): number[] {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  get dateRangeLabel(): string {
    const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (this.period === 'daily') {
      return `${mn[this.selectedMonth - 1]} ${this.selectedDay}, ${this.selectedYear}`;
    }
    if (this.period === 'weekly') {
      const end = new Date(this.selectedYear, this.selectedMonth - 1, this.selectedDay);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const fmt = (d: Date) => `${mn[d.getMonth()]} ${d.getDate()}`;
      return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
    }
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    return `${mn[this.selectedMonth - 1]} 1 – ${mn[this.selectedMonth - 1]} ${daysInMonth}, ${this.selectedYear}`;
  }

  get peakBarIndex(): number {
    if (!this.revenueChart.length) return -1;
    let maxVal = -1, maxIdx = 0;
    this.revenueChart.forEach((d, i) => {
      if (d.revenue > maxVal) { maxVal = d.revenue; maxIdx = i; }
    });
    return maxIdx;
  }

  /** Chart bar height as % relative to max revenue */
  barHeight(value: number): number {
    const max = Math.max(this.chartMax, 1);
    return Math.round((value / max) * 100);
  }

  private computeAxis(): void {
    const maxData = Math.max(...this.revenueChart.map(d => d.revenue), 0);
    if (maxData <= 0) {
      this.chartMax = 1;
      this.yAxisTicks = [1, 0];
      return;
    }

    const roughStep = maxData / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    let step = magnitude;
    if (normalized > 5) step = 10 * magnitude;
    else if (normalized > 2) step = 5 * magnitude;
    else if (normalized > 1) step = 2 * magnitude;

    this.chartMax = Math.ceil(maxData / step) * step;
    this.yAxisTicks = [
      this.chartMax,
      this.chartMax - step,
      this.chartMax - step * 2,
      this.chartMax - step * 3,
      this.chartMax - step * 4,
      0
    ].filter(v => v >= 0);
  }

  formatAxisValue(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  }

  private formatChartLabel(label: string): string {
    if (this.period === 'monthly' && label.length === 10) {
      return label.slice(8); // DD
    }
    if (this.period === 'daily' && label.endsWith(':00')) {
      return label.slice(0, 2); // HH
    }
    if (this.period === 'weekly' && label.length === 10) {
      return label.slice(5); // MM-DD
    }
    return label;
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
  trackByWeek(_i: number, w: WeeklyModelMetric) { return w.week; }
}
