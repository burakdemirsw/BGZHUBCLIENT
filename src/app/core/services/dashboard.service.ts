import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { AuthStateService } from './auth-state.service';
import {
  MonthlySummaryResponse,
  DailySalesResponse,
  IntegrationCountsResponse,
  DailyAiRepliesResponse,
  DailyConversationsResponse,
  ConversationUsageReportResponse,
  UnansweredOperationsReportResponse,
  SubscriptionSummaryResponse,
} from '../models/dashboard/dashboard.models';
import { AiCostReportResponse } from '../models/ai-request-log/ai-request-log.models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly controller = 'Dashboard';

  constructor(
    private httpClientService: HttpClientService,
    private authStateService: AuthStateService
  ) {}

  private get companyId(): string {
    return this.authStateService.profile?.companyId || '';
  }

  /**
   * Bu ayki müşteri, ürün, sipariş sayısı ve ciro bilgisi.
   */
  async getMonthlySummary(): Promise<MonthlySummaryResponse> {
    const response = await this.httpClientService.get<MonthlySummaryResponse>({
      controller: this.controller,
      action: `${this.companyId}/monthly-summary`,
    });
    return this.extractData(response);
  }

  /**
   * Son X günlük günlük satış istatistikleri.
   */
  async getDailySales(days: number = 7): Promise<DailySalesResponse> {
    const response = await this.httpClientService.get<DailySalesResponse>({
      controller: this.controller,
      action: `${this.companyId}/daily-sales`,
      queryString: `days=${days}`,
    });
    return this.extractData(response);
  }

  /**
   * Şirkete ait IntegrationUser ve SocialMediaAccount sayıları.
   */
  async getIntegrationCounts(): Promise<IntegrationCountsResponse> {
    const response = await this.httpClientService.get<IntegrationCountsResponse>({
      controller: this.controller,
      action: `${this.companyId}/integration-counts`,
    });
    return this.extractData(response);
  }

  /**
   * Son X günlük AI ile yanıtlanan mesaj sayısı.
   */
  async getDailyAiReplies(days: number = 7): Promise<DailyAiRepliesResponse> {
    const response = await this.httpClientService.get<DailyAiRepliesResponse>({
      controller: this.controller,
      action: `${this.companyId}/ai-replies`,
      queryString: `days=${days}`,
    });
    return this.extractData(response);
  }

  /**
   * Son X günlük yeni konuşma sayısı.
   */
  async getDailyConversations(days: number = 7): Promise<DailyConversationsResponse> {
    const response = await this.httpClientService.get<DailyConversationsResponse>({
      controller: this.controller,
      action: `${this.companyId}/daily-conversations`,
      queryString: `days=${days}`,
    });
    return this.extractData(response);
  }

  /**
   * Şirket ve tarih aralığına göre sohbet kullanım raporu.
   */
  async getConversationReport(startDate?: string, endDate?: string): Promise<ConversationUsageReportResponse> {
    const response = await this.httpClientService.get<ConversationUsageReportResponse>({
      controller: this.controller,
      action: `${this.companyId}/reports/conversations`,
      queryString: this.buildQueryString([
        ['startDate', startDate],
        ['endDate', endDate],
      ]),
    });
    return this.extractData(response);
  }

  /**
   * Şirket ve tarih aralığına göre AI maliyet raporu.
   */
  async getAiCostReport(startDate?: string, endDate?: string, model?: string): Promise<AiCostReportResponse> {
    const response = await this.httpClientService.get<AiCostReportResponse>({
      controller: this.controller,
      action: `${this.companyId}/reports/ai-cost`,
      queryString: this.buildQueryString([
        ['startDate', startDate],
        ['endDate', endDate],
        ['model', model],
      ]),
    });
    return this.extractData(response);
  }

  /**
   * Şirket ve tarih aralığına göre cevaplanamayan işlem raporu.
   */
  async getUnansweredOperationsReport(startDate?: string, endDate?: string, limit: number = 100): Promise<UnansweredOperationsReportResponse> {
    const response = await this.httpClientService.get<UnansweredOperationsReportResponse>({
      controller: this.controller,
      action: `${this.companyId}/reports/unanswered-operations`,
      queryString: this.buildQueryString([
        ['startDate', startDate],
        ['endDate', endDate],
        ['limit', String(limit)],
      ]),
    });
    return this.extractData(response);
  }

  /**
   * Şirkete ait aktif abonelik bilgisini döner.
   */
  async getSubscriptionSummary(): Promise<SubscriptionSummaryResponse> {
    const response = await this.httpClientService.get<SubscriptionSummaryResponse>({
      controller: this.controller,
      action: `${this.companyId}/subscription-summary`,
    });
    return this.extractData(response);
  }

  /**
   * ApiResponse wrapper'ından data'yı çıkarır.
   */
  private extractData<T>(response: ApiResponse<T>): T {
    if (response.data) return response.data;
    // Bazı durumlarda raw data direkt response olarak gelebilir
    return response as unknown as T;
  }

  private buildQueryString(entries: Array<[string, string | undefined]>): string {
    const params = entries
      .filter(([, value]) => !!value)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`);

    return params.join('&');
  }
}
