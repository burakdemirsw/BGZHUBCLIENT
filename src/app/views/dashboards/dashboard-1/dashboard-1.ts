import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountUpModule } from 'ngx-countup';
import { Apexchart } from '@app/components/apexchart';
import { ApexOptions } from 'ng-apexcharts';
import { DashboardService } from '@core/services/dashboard.service';
import {
  ConversationUsageReportResponse,
  UnansweredOperationsReportResponse,
} from '@core/models/dashboard/dashboard.models';
import { AiCostReportResponse } from '@core/models/ai-request-log/ai-request-log.models';

interface TrendPoint {
  date: string;
  value: number;
}  

@Component({
  selector: 'app-dashboard-1',
  imports: [CommonModule, CountUpModule, Apexchart],
  templateUrl: './dashboard-1.html',
  styleUrls: ['./dashboard-1.scss'],
})
export class Dashboard1 implements OnInit {
  loading = true;
  errorMessage = '';

  periodStart = '';
  periodEnd = '';

  conversationReport: ConversationUsageReportResponse | null = null;
  aiCostReport: AiCostReportResponse | null = null;
  unansweredReport: UnansweredOperationsReportResponse | null = null;

  conversationTrend: TrendPoint[] = [];
  aiCostTrend: TrendPoint[] = [];

  getConversationChartOptions: () => ApexOptions = () => this.buildConversationChart();
  getAiCostChartOptions: () => ApexOptions = () => this.buildAiCostChart();

  constructor(private dashboardService: DashboardService) {}

  async ngOnInit(): Promise<void> {
    this.setDefaultDateRange();
    await this.loadDashboard();
  }

  async reload(): Promise<void> {
    await this.loadDashboard();
  }

  get conversationTotal(): number {
    return this.readNumber(this.conversationReport, ['totalConversations', 'conversationCount', 'totalConversationCount']);
  }

  get aiReplyTotal(): number {
    return this.readNumber(this.conversationReport, ['totalAiReplies', 'aiReplyCount', 'totalAiReplyCount']);
  }

  get unansweredTotal(): number {
    const fromConversationReport = this.readNumber(this.conversationReport, ['totalUnanswered', 'unansweredCount']);
    if (fromConversationReport > 0) return fromConversationReport;
    return this.readNumber(this.unansweredReport, ['totalUnanswered', 'totalCount']);
  }

  get aiTotalCostUsd(): number {
    return this.readNumber(this.aiCostReport, ['totalCostUsd']);
  }

  get aiAverageCostPerRequest(): number {
    return this.readNumber(this.aiCostReport, ['averageCostPerRequest']);
  }

  get unansweredItems(): Array<Record<string, unknown>> {
    const rows = this.toRecordArray(this.unansweredReport, ['items', 'operations', 'rows', 'details']);
    return rows;
  }

  get usageByDay(): Array<Record<string, unknown>> {
    return this.toRecordArray(this.conversationReport, ['usageByDay', 'dailyStats', 'items', 'rows']);
  }

  formatMaybeDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  readRowNumber(row: Record<string, unknown>, keys: string[]): number {
    return this.readNumber(row, keys);
  }

  readRowText(row: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return '-';
  }

  private async loadDashboard(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const results = await Promise.allSettled([
        this.withTimeout(
          this.dashboardService.getConversationReport(this.periodStart, this.periodEnd),
          15000,
          null
        ),
        this.withTimeout(
          this.dashboardService.getAiCostReport(this.periodStart, this.periodEnd),
          15000,
          null
        ),
        this.withTimeout(
          this.dashboardService.getUnansweredOperationsReport(this.periodStart, this.periodEnd, 100),
          15000,
          null
        ),
      ]);

      const conversationReport = results[0].status === 'fulfilled' ? results[0].value : null;
      const aiCostReport = results[1].status === 'fulfilled' ? results[1].value : null;
      const unansweredReport = results[2].status === 'fulfilled' ? results[2].value : null;

      if (!conversationReport && !aiCostReport && !unansweredReport) {
        this.errorMessage = 'Dashboard verileri alınamadı. Lütfen tekrar deneyin.';
      }

      this.conversationReport = conversationReport;
      this.aiCostReport = aiCostReport;
      this.unansweredReport = unansweredReport;

      this.conversationTrend = this.toConversationTrend(conversationReport);
      this.aiCostTrend = this.toAiCostTrend(aiCostReport);

      this.getConversationChartOptions = () => this.buildConversationChart();
      this.getAiCostChartOptions = () => this.buildAiCostChart();
    } catch (err: unknown) {
      this.errorMessage = 'Dashboard verileri yüklenirken hata oluştu. Lütfen tekrar deneyin.';
      console.error('Dashboard load error', err);
    } finally {
      this.loading = false;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      return await Promise.race<T>([
        promise,
        new Promise<T>((resolve) => {
          timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private setDefaultDateRange(): void {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    this.periodStart = this.toIsoDate(start);
    this.periodEnd = this.toIsoDate(end);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  }

  private toConversationTrend(report: ConversationUsageReportResponse | null): TrendPoint[] {
    const rows = this.toRecordArray(report, ['usageByDay', 'dailyStats', 'items', 'rows']);
    return rows.map((row) => ({
      date: this.readRowText(row, ['date', 'Date']),
      value: this.readRowNumber(row, ['conversationCount', 'ConversationCount', 'totalConversations']),
    }));
  }

  private toAiCostTrend(report: AiCostReportResponse | null): TrendPoint[] {
    const rows = this.toRecordArray(report, ['costByDay', 'items', 'rows']);
    return rows.map((row) => ({
      date: this.readRowText(row, ['date', 'Date']),
      value: this.readRowNumber(row, ['totalCostUsd', 'costUsd', 'TotalCostUsd']),
    }));
  }

  private toRecordArray(source: unknown, keys: string[]): Array<Record<string, unknown>> {
    const record = this.toRecord(source);
    if (!record) return [];

    for (const key of keys) {
      const raw = record[key];
      if (Array.isArray(raw)) {
        return raw.filter((item) => !!item && typeof item === 'object') as Array<Record<string, unknown>>;
      }
    }

    return [];
  }

  private toNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private readNumber(source: unknown, keys: string[]): number {
    const record = this.toRecord(source);
    if (!record) return 0;

    for (const key of keys) {
      const raw = record[key];
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
      if (typeof raw === 'string' && raw.trim()) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) return parsed;
      }
    }

    return 0;
  }

  private toRecord(source: unknown): Record<string, unknown> | null {
    return source && typeof source === 'object' ? (source as Record<string, unknown>) : null;
  }

  private buildConversationChart(): ApexOptions {
    const categories = this.conversationTrend.map((item) => this.formatDate(item.date));
    const data = this.conversationTrend.map((item) => item.value);

    return {
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      series: [{ name: 'Konuşma', data }],
      xaxis: { categories },
      yaxis: {
        title: { text: 'Konuşma Sayısı' },
        labels: { formatter: (value: number) => Math.round(value).toString() },
      },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4, strokeWidth: 0 },
      colors: ['#0f766e'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#eef2f7' },
      tooltip: { y: { formatter: (value: number) => `${value} konuşma` } },
    };
  }

  private buildAiCostChart(): ApexOptions {
    const categories = this.aiCostTrend.map((item) => this.formatDate(item.date));
    const data = this.aiCostTrend.map((item) => item.value);

    return {
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      series: [{ name: 'Maliyet (USD)', data }],
      xaxis: { categories },
      yaxis: {
        title: { text: 'USD' },
        labels: { formatter: (value: number) => value.toFixed(4) },
      },
      plotOptions: {
        bar: { borderRadius: 6, columnWidth: '55%' },
      },
      colors: ['#8b5cf6'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#eef2f7' },
      tooltip: { y: { formatter: (value: number) => `$${value.toFixed(4)}` } },
    };
  }
}
