import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountUpModule } from 'ngx-countup';
import { NgIcon } from '@ng-icons/core';
import { Apexchart } from '@app/components/apexchart';
import { ApexOptions } from 'ng-apexcharts';
import { DashboardService } from '@core/services/dashboard.service';
import {
  MonthlySummaryResponse,
  IntegrationCountsResponse,
  DailySalesItem,
  DailyAiReplyItem,
} from '@core/models/dashboard/dashboard.models';

interface SummaryCard {
  title: string;
  value: number;
  icon: string;
  gradient: string;
  helper: string;
  prefix?: string;
  suffix?: string;
}

@Component({
  selector: 'app-dashboard-1',
  imports: [CommonModule, CountUpModule, NgIcon, Apexchart],
  templateUrl: './dashboard-1.html',
  styleUrl: './dashboard-1.scss',
})
export class Dashboard1 implements OnInit {
  // ─── Summary Cards ─────────────────────────────────────────────────────────
  summaryCards: SummaryCard[] = [];

  // ─── Integration Counts ────────────────────────────────────────────────────
  integrationUserCount = 0;
  socialMediaAccountCount = 0;

  // ─── Chart data ────────────────────────────────────────────────────────────
  dailySalesItems: DailySalesItem[] = [];
  dailyAiReplyItems: DailyAiReplyItem[] = [];

  // ─── Loading / error state ─────────────────────────────────────────────────
  loading = true;
  errorMessage = '';

  // ─── Chart option getters (bound for Apexchart component) ──────────────────
  getSalesChartOptions: () => ApexOptions = () => this.buildSalesChart();
  getAiRepliesChartOptions: () => ApexOptions = () => this.buildAiRepliesChart();

  constructor(private dashboardService: DashboardService) {}

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  private async loadAll(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const [summary, sales, integrations, aiReplies] = await Promise.all([
        this.dashboardService.getMonthlySummary(),
        this.dashboardService.getDailySales(7),
        this.dashboardService.getIntegrationCounts(),
        this.dashboardService.getDailyAiReplies(7),
      ]);

      this.mapSummary(summary);
      this.mapIntegrations(integrations);
      this.dailySalesItems = sales?.items ?? [];
      this.dailyAiReplyItems = aiReplies?.items ?? [];

      // Re-bind chart option getters after data change
      this.getSalesChartOptions = () => this.buildSalesChart();
      this.getAiRepliesChartOptions = () => this.buildAiRepliesChart();
    } catch (err: unknown) {
      this.errorMessage = 'Dashboard verileri yüklenirken bir hata oluştu.';
      console.error('Dashboard load error', err);
    } finally {
      this.loading = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAPPING HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private mapSummary(s: MonthlySummaryResponse): void {
    this.summaryCards = [
      {
        title: 'Müşteri Sayısı',
        value: s.customerCount ?? 0,
        icon: 'tablerUsers',
        gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.9))',
        helper: 'Bu ay',
      },
      {
        title: 'Ürün Sayısı',
        value: s.productCount ?? 0,
        icon: 'tablerPackage',
        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(34, 197, 94, 0.9))',
        helper: 'Bu ay',
      },
      {
        title: 'Sipariş Sayısı',
        value: s.orderCount ?? 0,
        icon: 'tablerShoppingCart',
        gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(251, 146, 60, 0.9))',
        helper: 'Bu ay',
      },
      {
        title: 'Toplam Ciro',
        value: s.totalRevenue ?? 0,
        icon: 'tablerCurrencyLira',
        gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.95), rgba(244, 114, 182, 0.9))',
        helper: 'Bu ay',
        suffix: ' ₺',
      },
    ];
  }

  private mapIntegrations(i: IntegrationCountsResponse): void {
    this.integrationUserCount = i.integrationUserCount ?? 0;
    this.socialMediaAccountCount = i.socialMediaAccountCount ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHART BUILDERS
  // ═══════════════════════════════════════════════════════════════════════════

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  }

  private buildSalesChart(): ApexOptions {
    const categories = this.dailySalesItems.map(i => this.formatDate(i.date));
    const orderData = this.dailySalesItems.map(i => i.orderCount);
    const revenueData = this.dailySalesItems.map(i => i.revenue);

    return {
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      series: [
        { name: 'Sipariş', data: orderData },
        { name: 'Ciro (₺)', data: revenueData },
      ],
      xaxis: {
        categories,
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: [
        {
          title: { text: 'Sipariş' },
          labels: { formatter: (v: number) => Math.round(v).toString() },
        },
        {
          opposite: true,
          title: { text: 'Ciro (₺)' },
          labels: { formatter: (v: number) => v.toLocaleString('tr-TR') + ' ₺' },
        },
      ],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 100] },
      },
      colors: ['#6366f1', '#f97316'],
      tooltip: {
        shared: true,
        intersect: false,
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' },
      legend: { position: 'top' },
    };
  }

  private buildAiRepliesChart(): ApexOptions {
    const categories = this.dailyAiReplyItems.map(i => this.formatDate(i.date));
    const data = this.dailyAiReplyItems.map(i => i.replyCount);

    return {
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      series: [{ name: 'AI Yanıt', data }],
      xaxis: {
        categories,
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: {
        title: { text: 'Yanıt Sayısı' },
        labels: { formatter: (v: number) => Math.round(v).toString() },
      },
      plotOptions: {
        bar: { borderRadius: 6, columnWidth: '50%' },
      },
      colors: ['#8b5cf6'],
      dataLabels: { enabled: false },
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, opacityFrom: 0.85, opacityTo: 0.95 },
      },
      grid: { borderColor: '#f1f1f1' },
      tooltip: {
        y: { formatter: (v: number) => v + ' yanıt' },
      },
    };
  }
}
